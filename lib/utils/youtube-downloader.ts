import { Innertube } from 'youtubei.js';

/**
 * Downloads a YouTube video directly to memory as a Buffer using youtubei.js.
 * This completely bypasses Vercel Serverless limitations on headless browsers
 * and avoids saving files to ephemeral disk space.
 */
export async function downloadYouTubeAudioBuffer(videoId: string): Promise<Buffer> {
    try {
        console.log(`[YouTube] Initializing Innertube for video ${videoId}...`);
        const yt = await Innertube.create();
        
        console.log(`[YouTube] Fetching info and stream URL...`);
        
        // Array of internal clients to attempt to bypass "login required" bot flags or age gates
        const clientsToTry: any[] = ['ANDROID', 'IOS', 'WEB', 'TV_EMBEDDED'];
        let stream: any;
        let lastError: any;

        for (const clientName of clientsToTry) {
            try {
                console.log(`[YouTube] Attempting extraction with client: ${clientName}`);
                stream = await yt.download(videoId, {
                    type: 'audio',
                    quality: 'best',
                    client: clientName,
                });
                break; // Extraction succeeded, exit loop
            } catch (err: any) {
                lastError = err;
                console.warn(`[YouTube] Client ${clientName} failed:`, err.message);
            }
        }

        if (!stream) {
            throw lastError || new Error(`All fallback clients failed to extract stream for ${videoId}`);
        }
        
        console.log(`[YouTube] Streaming audio directly to memory...`);
        const reader = stream.getReader();
        const chunks: Uint8Array[] = [];
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) chunks.push(value);
        }
        
        const buffer = Buffer.concat(chunks);
        console.log(`[YouTube] Download complete. Buffer size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
        
        return buffer;
    } catch (error) {
        console.error(`[YouTube] Error extracting stream for ${videoId}:`, error);
        throw error;
    }
}
