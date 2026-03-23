import { NextRequest, NextResponse } from 'next/server';
import { verifySignatureAppRouter } from '@upstash/qstash/dist/nextjs';
import { runVideoIngestionPipeline } from '@/lib/ai/ingestion-pipeline';
import { getTranscription } from '@/lib/data/transcriptions';

export const dynamic = 'force-dynamic';

async function handler(request: NextRequest) {
    try {
        const body = await request.json();
        const { eventType, payload } = body;

        console.log(`[QStash Webhook] Received event: ${eventType}`);

        if (eventType === 'transcribe-video') {
            const { videoId } = payload;
            
            // Verify it hasn't already been processed
            const existing = await getTranscription(videoId);
            if (existing?.status === 'completed' || existing?.status === 'processing') {
                return NextResponse.json({ message: 'Already processed or processing' });
            }

            // Run the heavy ingestion pipeline
            await runVideoIngestionPipeline(videoId);
            
            return NextResponse.json({ success: true, processed: videoId });
        }

        return NextResponse.json({ message: 'Unknown event type' }, { status: 400 });
    } catch (error: any) {
        console.error('[QStash Webhook] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// During local dev without keys, we might simulate calls without a signature.
// Only enforce `verifySignatureAppRouter` if QSTASH env vars are present.
const hasQstashKeys = process.env.QSTASH_CURRENT_SIGNING_KEY && process.env.QSTASH_NEXT_SIGNING_KEY;

export const POST = hasQstashKeys ? verifySignatureAppRouter(handler) : handler;
