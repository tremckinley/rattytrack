import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  let meetingId: string | null = null;

  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const title = formData.get('title') as string | null;
    const description = formData.get('description') as string | null;
    const password = formData.get('password') as string | null;

    // Check password
    if (password !== process.env.TRANSCRIPTION_PASSWORD) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Check file size (25MB limit for Whisper API)
    const maxSize = 25 * 1024 * 1024; // 25MB in bytes
    if (audioFile.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 25MB limit. Please upload a smaller file.' },
        { status: 400 }
      );
    }

    // Save initial upload record to database (using service role client)
    const { data: uploadedMeeting, error: insertError } = await supabaseAdmin
      .from('uploaded_meetings')
      .insert({
        title: title || audioFile.name,
        description: description,
        video_filename: audioFile.name,
        video_size_bytes: audioFile.size,
        transcription_status: 'processing'
      })
      .select()
      .single();

    if (insertError || !uploadedMeeting) {
      console.error('Error saving upload to database:', insertError);
      // Continue anyway - transcription is still valuable
    } else {
      meetingId = uploadedMeeting.id;
    }

    // Transcribe with Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['segment'],
    });

    // Update meeting with transcript
    if (meetingId) {
      const { error: updateError } = await supabaseAdmin
        .from('uploaded_meetings')
        .update({
          full_transcript: transcription.text,
          video_duration_seconds: transcription.duration,
          video_language: transcription.language,
          transcription_status: 'completed',
          processed_at: new Date().toISOString()
        })
        .eq('id', meetingId);

      if (updateError) {
        console.error('Error updating meeting record:', updateError);
      }

      // Save segments
      if (transcription.segments && transcription.segments.length > 0) {
        const segments = transcription.segments.map((segment, index) => ({
          uploaded_meeting_id: meetingId,
          segment_index: index,
          start_time_seconds: segment.start,
          end_time_seconds: segment.end,
          text: segment.text
        }));

        const { error: segmentsError } = await supabaseAdmin
          .from('uploaded_meeting_segments')
          .insert(segments);

        if (segmentsError) {
          console.error('Error saving segments:', segmentsError);
        }
      }
    }

    return NextResponse.json({
      meetingId: meetingId,
      text: transcription.text,
      segments: transcription.segments,
      duration: transcription.duration,
      language: transcription.language,
    });
  } catch (error) {
    console.error('Transcription error:', error);

    // Update meeting status to failed if we created a record
    if (meetingId) {
      await supabaseAdmin
        .from('uploaded_meetings')
        .update({
          transcription_status: 'failed',
          transcription_error: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', meetingId);
    }

    if (error instanceof Error) {
      return NextResponse.json({
        error: 'Transcription failed',
        details: error.message
      }, { status: 500 });
    }

    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 });
  }
}
