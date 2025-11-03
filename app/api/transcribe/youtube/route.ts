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
} from '@/lib/data/youtube_transcriptions';
import { recordYouTubeAudio } from '@/lib/utils/youtube-downloader';
import { processAudioForWhisper, cleanupAudioFiles } from '@/lib/utils/audio-processor';
import { transcribeWithAutoChunking } from '@/lib/utils/whisper-client';
import path from 'path';
import fs from 'fs';
import os from 'os';

interface TranscribeRequest {
  videoId: string;
  forceRetry?: boolean; // Admin-only: allow retranscription
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
    const { videoId, forceRetry } = body;

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
    processTranscription(videoId).catch(error => {
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
async function processTranscription(videoId: string): Promise<void> {
  const workDir = path.join(os.tmpdir(), `youtube-transcribe-${videoId}-${Date.now()}`);
  let audioChunks: string[] = [];

  try {
    console.log(`Starting background transcription for ${videoId}`);

    // Create work directory
    fs.mkdirSync(workDir, { recursive: true });

    // Step 1: Record audio from YouTube
    const webmPath = path.join(workDir, 'audio.webm');
    const recordingResult = await recordYouTubeAudio({
      videoId,
      outputPath: webmPath,
      onProgress: (seconds) => {
        console.log(`Recording progress: ${seconds}s`);
      },
    });

    if (!recordingResult.success) {
      throw new Error(recordingResult.error || 'Recording failed');
    }

    // Step 2: Process audio (convert to MP3, split if needed)
    console.log('Processing audio...');
    const processResult = await processAudioForWhisper(webmPath, workDir);
    audioChunks = processResult.chunks;

    console.log(`Audio processed: ${audioChunks.length} chunk(s)`);

    // Step 3: Transcribe using Whisper API
    console.log('Transcribing with Whisper API...');
    const transcribeResult = await transcribeWithAutoChunking(audioChunks, {
      language: 'en',
      prompt: 'Memphis City Council meeting transcription',
    });

    console.log(`Transcription completed: ${transcribeResult.segments.length} segments`);

    // Step 4: Save to database
    await saveTranscriptSegments(
      videoId,
      transcribeResult.segments,
      transcribeResult.cost
    );

    console.log(`Successfully transcribed video ${videoId}`);
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