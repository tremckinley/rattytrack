import { updateTranscriptionStatus } from '@/lib/data/transcriptions';
import { submitBufferToAssemblyAI } from '@/lib/utils/assemblyai-client';

/**
 * Downloads a YouTube video's audio directly to memory and submits it to AssemblyAI.
 * Triggered asynchronously by QStash. Works natively on Vercel Serverless.
 */
export async function runVideoIngestionPipeline(videoId: string) {
    try {
        console.log(`[Ingestion Pipeline] Starting in-memory download for ${videoId}...`);
        
        // Dynamically import the youtube downloader
        const { downloadYouTubeAudioBuffer } = await import('@/lib/utils/youtube-downloader');
        
        // 1. Download YouTube Audio purely in memory
        const audioBuffer = await downloadYouTubeAudioBuffer(videoId);
        
        if (!audioBuffer || audioBuffer.length === 0) {
            throw new Error('Failed to extract audio stream from YouTube.');
        }
        
        // 2. Submit buffer directly to AssemblyAI
        console.log(`[Ingestion Pipeline] Submitting buffer to AssemblyAI...`);
        const transcriptId = await submitBufferToAssemblyAI({
            buffer: audioBuffer,
            videoId,
            type: 'youtube', // Explicitly label it so callbacks route correctly
        });

        // 3. Update status (wait for the AssemblyAI webhook to fire 'completed')
        await updateTranscriptionStatus(videoId, 'processing');
        console.log(`[Ingestion Pipeline] AssemblyAI processing started (ID: ${transcriptId}). Waiting for webhook.`);

        return { success: true, transcriptId };
    } catch (error) {
        console.error(`[Ingestion Pipeline] Failed for ${videoId}:`, error);
        await updateTranscriptionStatus(videoId, 'failed');
        throw error;
    }
}
