import { NextRequest, NextResponse } from 'next/server';
import { getVideoInfo, downloadYouTubeAudio, cleanupAudioFile } from '@/lib/utils/youtube-downloader';
import { processAudioForTranscription, cleanupChunks } from '@/lib/utils/audio-processor';
import { getYouTubeTranscription } from '@/lib/data/youtube_transcriptions';
import { isAdmin, getAdminEmailFromRequest } from '@/lib/utils/admin';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import fs from 'fs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Use service role for database writes
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoId, forceRetranscribe } = body;

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      );
    }

    // Check if video is already transcribed
    const existing = await getYouTubeTranscription(videoId);
    
    if (existing && !forceRetranscribe) {
      // Already transcribed - return existing
      return NextResponse.json({
        message: 'Video already transcribed',
        transcriptionId: existing.id,
        status: existing.transcription_status,
      });
    }

    if (existing && forceRetranscribe) {
      // Check admin permissions for re-transcription
      const adminEmail = getAdminEmailFromRequest(request);
      if (!isAdmin(adminEmail)) {
        return NextResponse.json(
          { error: 'Only administrators can re-transcribe videos' },
          { status: 403 }
        );
      }
      
      // Mark existing as inactive
      await supabaseAdmin
        .from('uploaded_meetings')
        .update({ is_active: false })
        .eq('id', existing.id);
    }

    // Step 1: Get video information
    console.log(`Fetching info for video: ${videoId}`);
    const videoInfo = await getVideoInfo(videoId);
    
    // Step 2: Create database record with pending status
    const { data: meeting, error: insertError } = await supabaseAdmin
      .from('uploaded_meetings')
      .insert({
        youtube_video_id: videoId,
        title: videoInfo.title,
        description: videoInfo.description,
        video_duration_seconds: videoInfo.duration,
        transcription_status: 'processing',
        video_filename: null,
        video_size_bytes: null,
      })
      .select()
      .single();

    if (insertError || !meeting) {
      console.error('Error creating meeting record:', insertError);
      throw new Error('Failed to create database record');
    }

    const meetingId = meeting.id;
    console.log(`Created meeting record: ${meetingId}`);

    // Step 3: Download audio
    let audioPath: string | null = null;
    try {
      console.log('Downloading audio...');
      audioPath = await downloadYouTubeAudio(videoId);
      
      // Step 4: Process audio (compress and chunk if needed)
      console.log('Processing audio...');
      const chunks = await processAudioForTranscription(audioPath, videoInfo.duration);
      
      // Step 5: Transcribe each chunk
      console.log(`Transcribing ${chunks.length} chunk(s)...`);
      const allSegments: any[] = [];
      let fullTranscript = '';
      
      for (const chunk of chunks) {
        console.log(`Transcribing chunk ${chunk.index + 1}/${chunks.length}...`);
        
        const fileStream = fs.createReadStream(chunk.path);
        const transcription = await openai.audio.transcriptions.create({
          file: fileStream,
          model: 'whisper-1',
          response_format: 'verbose_json',
          timestamp_granularities: ['segment'],
        });
        
        // Process segments with offset for chunked files
        if (transcription.segments) {
          transcription.segments.forEach((segment: any, index: number) => {
            const adjustedStart = segment.start + chunk.startTime;
            const adjustedEnd = segment.end + chunk.startTime;
            
            allSegments.push({
              uploaded_meeting_id: meetingId,
              segment_index: allSegments.length,
              start_time_seconds: adjustedStart,
              end_time_seconds: adjustedEnd,
              text: segment.text.trim(),
              speaker_name: null,
              speaker_id: null,
            });
            
            fullTranscript += segment.text + ' ';
          });
        }
      }
      
      // Step 6: Save segments to database
      if (allSegments.length > 0) {
        const { error: segmentsError } = await supabaseAdmin
          .from('uploaded_meeting_segments')
          .insert(allSegments);
        
        if (segmentsError) {
          console.error('Error saving segments:', segmentsError);
          throw new Error('Failed to save transcript segments');
        }
      }
      
      // Step 7: Update meeting with completion status
      const { error: updateError } = await supabaseAdmin
        .from('uploaded_meetings')
        .update({
          full_transcript: fullTranscript.trim(),
          transcription_status: 'completed',
          processed_at: new Date().toISOString(),
        })
        .eq('id', meetingId);
      
      if (updateError) {
        console.error('Error updating meeting:', updateError);
        throw new Error('Failed to update meeting status');
      }
      
      // Cleanup
      cleanupChunks(chunks);
      if (audioPath) cleanupAudioFile(audioPath);
      
      console.log('Transcription completed successfully!');
      
      return NextResponse.json({
        message: 'Transcription completed successfully',
        transcriptionId: meetingId,
        segmentCount: allSegments.length,
      });
      
    } catch (error) {
      console.error('Transcription error:', error);
      
      // Update database with error status
      await supabaseAdmin
        .from('uploaded_meetings')
        .update({
          transcription_status: 'failed',
          transcription_error: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', meetingId);
      
      // Cleanup on error
      if (audioPath) {
        try {
          cleanupAudioFile(audioPath);
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError);
        }
      }
      
      throw error;
    }
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Transcription failed',
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check transcription status
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const videoId = searchParams.get('videoId');

  if (!videoId) {
    return NextResponse.json(
      { error: 'Video ID is required' },
      { status: 400 }
    );
  }

  const transcription = await getYouTubeTranscription(videoId);
  
  if (!transcription) {
    return NextResponse.json({ exists: false });
  }

  return NextResponse.json({
    exists: true,
    id: transcription.id,
    status: transcription.transcription_status,
    title: transcription.title,
    duration: transcription.video_duration_seconds,
  });
}
