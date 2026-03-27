// API route for meeting video transcription via Granicus
// POST /api/transcribe/youtube (kept at same path for backward compatibility)

import { NextRequest, NextResponse } from 'next/server';
import {
  getTranscription,
  createTranscription,
  deleteTranscription,
} from '@/lib/data/transcriptions';
import { publishQueueEvent } from '@/lib/queue/qstash';
import { requireAdmin } from '@/lib/utils/auth-utils';
import { fetchGranicusClipTitle } from '@/lib/utils/meeting-video-downloader';

export const dynamic = 'force-dynamic';

interface TranscribeRequest {
  clipId: string;       // Granicus clip ID (e.g. "10666")
  videoId?: string;     // Legacy YouTube video ID (backward compat)
  forceRetry?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    // Check for admin session
    await requireAdmin();

    const body: TranscribeRequest = await request.json();
    // Support both clipId (new) and videoId (legacy) for backward compatibility
    const meetingId = body.clipId || body.videoId;
    const { forceRetry } = body;

    if (!meetingId) {
      return NextResponse.json(
        { error: 'Clip ID is required' },
        { status: 400 }
      );
    }

    // Check if already transcribed
    const existingTranscription = await getTranscription(meetingId);

    if (existingTranscription && !forceRetry) {
      if (existingTranscription.status === 'completed') {
        return NextResponse.json({
          message: 'Meeting already transcribed',
          transcription: existingTranscription,
          alreadyExists: true,
        });
      } else if (existingTranscription.status === 'processing' || existingTranscription.status === 'queued') {
        return NextResponse.json({
          message: 'Transcription already in progress',
          transcription: existingTranscription,
          processing: true,
        });
      }
    }

    // Handle retry
    if (forceRetry && existingTranscription) {
      await deleteTranscription(meetingId);
      console.log(`Deleted existing transcription for retry: ${meetingId}`);
    }

    // Fetch meeting title from Granicus
    const title = await fetchGranicusClipTitle(meetingId);

    // Create transcription record in `queued` state
    const transcription = await createTranscription({
      videoId: meetingId,
      title: title,
      channelTitle: 'Memphis City Council',
      publishedAt: new Date().toISOString(),
      duration: 0, // Will be updated by AssemblyAI after processing
      thumbnailUrl: '',
    });

    if (!transcription) {
      return NextResponse.json(
        { error: 'Failed to create transcription record' },
        { status: 500 }
      );
    }

    // Determine the absolute webhook URL ensuring preview branch deployments receive their own webhooks
    const isDev = process.env.NODE_ENV === 'development';
    const getVercelUrl = () => process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
    const getProdUrl = () => process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null;
    const baseUrl = isDev ? 'http://127.0.0.1:5000' : (process.env.NEXT_PUBLIC_APP_URL || getVercelUrl() || getProdUrl() || '');
    const url = `${baseUrl}/api/webhooks/queue`;

    await publishQueueEvent({
      url: url,
      payload: {
        eventType: 'transcribe-video',
        videoId: meetingId, // Keep using `videoId` in the payload for internal consistency
      },
    });

    return NextResponse.json({
      message: 'Transcription task queued successfully',
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
 * GET /api/transcribe/youtube?videoId=xxx
 * Check transcription status
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId') || searchParams.get('clipId');

  if (!videoId) {
    return NextResponse.json(
      { error: 'Video/Clip ID is required' },
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