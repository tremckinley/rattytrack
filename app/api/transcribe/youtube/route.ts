// API route for YouTube video transcription
// POST /api/transcribe/youtube

import { NextRequest, NextResponse } from 'next/server';
import { getVideoDetails } from '@/lib/data/youtube';
import {
  getTranscription,
  createTranscription,
  deleteTranscription,
} from '@/lib/data/transcriptions';
import { publishQueueEvent } from '@/lib/queue/qstash';
import { requireAdmin } from '@/lib/utils/auth-utils';

export const dynamic = 'force-dynamic';

interface TranscribeRequest {
  videoId: string;
  forceRetry?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    // Check for admin session
    await requireAdmin();

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
      await deleteTranscription(videoId);
      console.log(`Deleted existing transcription for retry: ${videoId}`);
    }

    // Fetch video details from YouTube
    const videoDetails = await getVideoDetails(videoId);

    if (!videoDetails) {
      return NextResponse.json(
        { error: 'Video not found or invalid video ID' },
        { status: 404 }
      );
    }

    // Create transcription record in `queued` state
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

    // Determine the absolute webhook URL ensuring preview branch deployments receive their own webhooks
    const isDev = process.env.NODE_ENV === 'development';
    // Fallback order: NEXT_PUBLIC_APP_URL -> VERCEL_URL (current deployment) -> VERCEL_PROJECT_PRODUCTION_URL
    const getVercelUrl = () => process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
    const getProdUrl = () => process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null;
    const baseUrl = isDev ? 'http://127.0.0.1:5000' : (process.env.NEXT_PUBLIC_APP_URL || getVercelUrl() || getProdUrl() || '');
    let url = `${baseUrl}/api/webhooks/queue`;
    if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
        url += `?x-vercel-protection-bypass=${process.env.VERCEL_AUTOMATION_BYPASS_SECRET}&x-vercel-set-bypass-cookie=true`;
    }

    await publishQueueEvent({
      url: url,
      payload: {
        eventType: 'transcribe-video',
        videoId: videoDetails.videoId,
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