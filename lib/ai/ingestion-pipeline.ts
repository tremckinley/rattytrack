import { updateTranscriptionStatus } from '@/lib/data/transcriptions';
import { submitBufferToAssemblyAI } from '@/lib/utils/assemblyai-client';

/**
 * Downloads a meeting video from Granicus and submits it to AssemblyAI.
 * Triggered asynchronously by QStash. Works natively on Vercel Serverless.
 */
export async function runVideoIngestionPipeline(clipId: string) {
    try {
        console.log(`[Ingestion Pipeline] Starting Granicus download for clip ${clipId}...`);
        
        // Dynamically import the meeting video downloader
        const { downloadMeetingVideoBuffer } = await import('@/lib/utils/meeting-video-downloader');
        
        // 1. Download meeting video directly into memory from Granicus CDN
        const videoBuffer = await downloadMeetingVideoBuffer(clipId);
        
        if (!videoBuffer || videoBuffer.length === 0) {
            throw new Error('Failed to download meeting video from Granicus.');
        }

        console.log(`[Ingestion Pipeline] Buffer ready (${(videoBuffer.length / 1024 / 1024).toFixed(2)} MB). Submitting to AssemblyAI...`);
        
        // 2. Submit buffer directly to AssemblyAI
        const transcriptId = await submitBufferToAssemblyAI({
            buffer: videoBuffer,
            videoId: clipId, // clipId is now used as our internal video identifier
            type: 'youtube', // Keep 'youtube' type so the webhook routes to the correct handler
        });

        // 3. Update status (wait for the AssemblyAI webhook to fire 'completed')
        await updateTranscriptionStatus(clipId, 'processing');
        console.log(`[Ingestion Pipeline] AssemblyAI processing started (ID: ${transcriptId}). Waiting for webhook.`);

        return { success: true, transcriptId };
    } catch (error) {
        console.error(`[Ingestion Pipeline] Failed for clip ${clipId}:`, error);
        await updateTranscriptionStatus(clipId, 'failed');
        throw error;
    }
}
