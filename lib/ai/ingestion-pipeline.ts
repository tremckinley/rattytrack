import { updateTranscriptionStatus } from '@/lib/data/transcriptions';
import { submitUrlToAssemblyAI } from '@/lib/utils/assemblyai-client';

/**
 * Resolves the Granicus MP4 URL and passes it directly to AssemblyAI.
 * AssemblyAI downloads the file from their servers — zero memory on ours.
 * This avoids OOM kills on Vercel Serverless for large meeting videos.
 */
export async function runVideoIngestionPipeline(clipId: string) {
    try {
        console.log(`[Ingestion Pipeline] Resolving Granicus MP4 URL for clip ${clipId}...`);
        
        const { resolveMp4Url } = await import('@/lib/utils/meeting-video-downloader');
        
        // 1. Resolve the direct MP4 CDN URL (lightweight HTTP request, no download)
        const mp4Url = await resolveMp4Url(clipId);
        
        console.log(`[Ingestion Pipeline] Resolved URL: ${mp4Url}`);
        console.log(`[Ingestion Pipeline] Submitting URL directly to AssemblyAI (zero-download mode)...`);
        
        // 2. Pass the URL directly to AssemblyAI — they handle the download
        const transcriptId = await submitUrlToAssemblyAI({
            remoteUrl: mp4Url,
            videoId: clipId,
            source: 'granicus',
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
