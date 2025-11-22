// API route for YouTube video transcription
// POST /api/transcribe/youtube

import { NextRequest, NextResponse } from 'next/server';
import { getVideoDetails } from '@/lib/data/youtube';
import {
  getTranscription,
  createTranscription,
  updateTranscriptionStatus,
  saveTranscriptSegments,
  deleteTranscription,
} from '@/lib/data/transcriptions';
import { cleanupAudioFiles } from '@/lib/utils/audio-processor';
import { transcribeWithAutoChunking } from '@/lib/utils/whisper-client';
import path from 'path';
import fs from 'fs';
import os from 'os';

interface TranscribeRequest {
  videoId: string;
  forceRetry?: boolean;
  provider?: 'whisper' | 'elevenlabs';
  numSpeakers?: number;
}

/**
 * Check if user is admin
 */
function isAdmin(request: NextRequest): boolean {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
  const userEmail = request.headers.get('x-user-email'); // Set this in middleware if using auth
  return adminEmails.includes(userEmail || '');
}

/**
 * POST /api/transcribe/youtube
 * Transcribe a YouTube video or return existing transcription
 */
export async function POST(request: NextRequest) {
  try {
    const body: TranscribeRequest = await request.json();
    const { videoId, forceRetry, provider, numSpeakers } = body;

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      );
    }

    // Check if already transcribed
    const existingTranscription = await getTranscription(videoId);

    if (existingTranscription && !forceRetry) {
      if (existingTranscription.status === 'completed') {
        return NextResponse.json({
          message: 'Video already transcribed',
          transcription: existingTranscription,
          alreadyExists: true,
        });
      } else if (existingTranscription.status === 'processing') {
        return NextResponse.json({
          message: 'Transcription already in progress',
          transcription: existingTranscription,
          processing: true,
        });
      }
    }

    // Handle retry (admin only)
    if (forceRetry) {
      if (!isAdmin(request)) {
        return NextResponse.json(
          { error: 'Only admins can retry transcriptions' },
          { status: 403 }
        );
      }

      if (existingTranscription) {
        await deleteTranscription(videoId);
        console.log(`Deleted existing transcription for retry: ${videoId}`);
      }
    }

    // Fetch video details from YouTube
    const videoDetails = await getVideoDetails(videoId);

    if (!videoDetails) {
      return NextResponse.json(
        { error: 'Video not found or invalid video ID' },
        { status: 404 }
      );
    }

    // Create transcription record
    const transcription = await createTranscription({
      videoId: videoDetails.videoId,
      title: videoDetails.title,
      channelTitle: videoDetails.channelTitle,
      publishedAt: videoDetails.publishedAt,
      duration: parseInt(videoDetails.duration, 10),
      thumbnailUrl: videoDetails.thumbnailUrl,
    });

    if (!transcription) {
      return NextResponse.json(
        { error: 'Failed to create transcription record' },
        { status: 500 }
      );
    }

    // Start transcription process asynchronously
    // We return immediately and let the process run in background
    processTranscription(videoId, provider, numSpeakers).catch(error => {
      console.error('Background transcription failed:', error);
    });

    return NextResponse.json({
      message: 'Transcription started',
      transcription,
      processing: true,
    });
  } catch (error) {
    console.error('Error in transcribe API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Background process for transcription
 * This runs asynchronously after API response is sent
 */
async function processTranscription(
  videoId: string,
  provider: 'whisper' | 'elevenlabs' = 'elevenlabs',
  numSpeakers?: number
): Promise<void> {
  const workDir = path.join(os.tmpdir(), `youtube-transcribe-${videoId}-${Date.now()}`);
  let audioChunks: string[] = [];

  try {
    console.log(`Starting background transcription for ${videoId}`);

    // Create work directory
    fs.mkdirSync(workDir, { recursive: true });

    // Step 1: Download MP3 from YouTube using ytmp3.as
    // Dynamic import to prevent bundling in prerendered pages
    const { recordYouTubeAudio } = await import('@/lib/utils/youtube-downloader');
    
    const mp3Path = path.join(workDir, 'audio.mp3');
    const downloadResult = await recordYouTubeAudio({
      videoId,
      outputPath: mp3Path,
    });

    if (!downloadResult.success) {
      throw new Error(downloadResult.error || 'Download failed');
    }

    // Step 2: Check if file needs chunking (if over 25MB)
    console.log('Checking if audio needs chunking...');
    const { exceedsFileSizeLimit, splitAudioIntoChunks } = await import('@/lib/utils/audio-processor');
    
    if (exceedsFileSizeLimit(mp3Path, 25)) {
      console.log('File exceeds 25MB, splitting into chunks...');
      const chunksDir = path.join(workDir, 'chunks');
      audioChunks = await splitAudioIntoChunks({
        inputPath: mp3Path,
        outputDir: chunksDir,
        chunkDuration: 600, // 10 minutes per chunk
      });
      // Delete the large MP3 file
      fs.unlinkSync(mp3Path);
    } else {
      audioChunks = [mp3Path];
    }

    console.log(`Audio ready: ${audioChunks.length} chunk(s)`);

    // Step 3: Transcribe using selected provider
    const useDiarization = provider === 'elevenlabs';
    console.log(`Transcribing with ${provider} API...${useDiarization ? ' (with diarization)' : ''}`);
    
    let transcribeResult;
    
    if (provider === 'elevenlabs') {
      const { transcribeWithAutoChunking: transcribeElevenLabs } = await import('@/lib/utils/elevenlabs-client');
      transcribeResult = await transcribeElevenLabs(audioChunks, {
        language: 'en',
        numSpeakers: numSpeakers || null,
        diarizationThreshold: 0.22,
      });
    } else {
      transcribeResult = await transcribeWithAutoChunking(audioChunks, {
        language: 'en',
        prompt: 'Memphis City Council meeting transcription',
      });
    }

    console.log(`Transcription completed: ${transcribeResult.segments.length} segments`);

    // Step 4: Match speakers to legislators if diarization was used
    let speakerMatches: Map<string, any> | null = null;
    if (useDiarization && transcribeResult.segments.some(s => 'speaker' in s && s.speaker)) {
      console.log('Matching speakers to legislators...');
      const { matchAllSpeakers } = await import('@/lib/utils/speaker-matcher');
      const speakerLabels = transcribeResult.segments
        .map(s => ('speaker' in s ? s.speaker : undefined))
        .filter((s): s is string => !!s);
      speakerMatches = await matchAllSpeakers(speakerLabels);
      console.log(`Matched ${speakerMatches.size} unique speakers`);
    }

    // Step 5: Save to database with speaker information
    // Wrap in try-catch to ensure status is updated even if partial save occurs
    try {
      const segmentsWithSpeakers = transcribeResult.segments.map(seg => {
        const speaker = 'speaker' in seg ? (seg.speaker as string | undefined) : undefined;
        const speakerName: string | null = speaker || null;
        const speakerId: string | null = speakerName && speakerMatches 
          ? speakerMatches.get(speakerName)?.legislatorId || null
          : null;
        
        return {
          start: seg.start,
          end: seg.end,
          text: seg.text,
          speakerName,
          speakerId,
        };
      });

      await saveTranscriptSegments(
        videoId,
        segmentsWithSpeakers,
        transcribeResult.cost,
        provider,
        useDiarization
      );
      
      // Mark as completed only after successful save
      await updateTranscriptionStatus(videoId, 'completed');
      console.log(`Successfully transcribed video ${videoId} using ${provider}`);
    } catch (dbError) {
      console.error('Database save failed:', dbError);
      // Even if save fails, mark as error so it's not stuck in processing
      await updateTranscriptionStatus(
        videoId,
        'error',
        `Database error: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`
      );
      throw dbError; // Re-throw to trigger outer error handler
    }
  } catch (error) {
    console.error(`Transcription failed for ${videoId}:`, error);

    // Update status to error
    await updateTranscriptionStatus(
      videoId,
      'error',
      error instanceof Error ? error.message : 'Unknown error'
    );
  } finally {
    // Clean up temporary files
    console.log('Cleaning up temporary files...');

    try {
      // Delete audio chunks
      cleanupAudioFiles(audioChunks);

      // Delete work directory
      if (fs.existsSync(workDir)) {
        fs.rmSync(workDir, { recursive: true, force: true });
        console.log(`Deleted work directory: ${workDir}`);
      }
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError);
    }
  }
}

/**
 * GET /api/transcribe/youtube?videoId=xxx
 * Check transcription status
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');

  if (!videoId) {
    return NextResponse.json(
      { error: 'Video ID is required' },
      { status: 400 }
    );
  }

  const transcription = await getTranscription(videoId);

  if (!transcription) {
    return NextResponse.json(
      { error: 'Transcription not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ transcription });
}