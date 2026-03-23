import { updateTranscriptionStatus } from '@/lib/data/transcriptions';
import { submitToAssemblyAI } from '@/lib/utils/assemblyai-client';
import path from 'path';
import os from 'os';
import fs from 'fs';

/**
 * Downloads a YouTube video's audio and submits it to AssemblyAI.
 * Triggered asynchronously by QStash.
 */
export async function runVideoIngestionPipeline(videoId: string) {
    const workDir = path.join(os.tmpdir(), `youtube-ingest-${videoId}-${Date.now()}`);
    
    try {
        console.log(`[Ingestion Pipeline] Starting download for ${videoId}...`);
        fs.mkdirSync(workDir, { recursive: true });
        
        // Dynamically import the youtube downloader
        const { recordYouTubeAudio } = await import('@/lib/utils/youtube-downloader');
        
        // 1. Download YouTube Audio
        const mp3Path = path.join(workDir, 'audio.mp3');
        const downloadResult = await recordYouTubeAudio({
            videoId,
            outputPath: mp3Path,
        });
        
        if (!downloadResult || !downloadResult.filePath) {
            throw new Error('Failed to download audio from YouTube. The ytmp3.as scraper may be blocked.');
        }

        console.log(`[Ingestion Pipeline] Download successful: ${downloadResult.filePath}`);
        
        // 2. Submit to AssemblyAI
        console.log(`[Ingestion Pipeline] Submitting to AssemblyAI...`);
        const transcriptId = await submitToAssemblyAI({
            filePath: downloadResult.filePath,
            videoId,
        });

        // 3. Update status (wait for the AssemblyAI webhook to fire 'completed')
        await updateTranscriptionStatus(videoId, 'processing');
        console.log(`[Ingestion Pipeline] AssemblyAI processing started (ID: ${transcriptId}). Waiting for webhook.`);
        
        // Cleanup local file
        try {
            if (fs.existsSync(downloadResult.filePath)) {
                fs.unlinkSync(downloadResult.filePath);
            }
        } catch (cleanupErr) {
            console.error(`[Ingestion Pipeline] Failed to cleanup file: ${cleanupErr}`);
        }

        return { success: true, transcriptId };
    } catch (error) {
        console.error(`[Ingestion Pipeline] Failed for ${videoId}:`, error);
        await updateTranscriptionStatus(videoId, 'failed');
        throw error;
    }
}
