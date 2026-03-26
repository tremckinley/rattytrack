/**
 * Extracts YouTube audio using the Cobalt API.
 * This completely bypasses YouTube's strict datacenter IP blocks (which cause 
 * "Video is login required" errors) by using Cobalt's residential extraction instances.
 */
export async function downloadYouTubeAudioBuffer(videoId: string): Promise<Buffer> {
    try {
        const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
        console.log(`[YouTube/Cobalt] Requesting audio stream URL for ${youtubeUrl}...`);

        // 1. Ask Cobalt to extract the direct MP3 link
        const cobaltResponse = await fetch('https://api.cobalt.tools/api/json', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            body: JSON.stringify({
                url: youtubeUrl,
                isAudioOnly: true,
                aFormat: 'mp3'
            })
        });

        if (!cobaltResponse.ok) {
            throw new Error(`[Cobalt] API Error ${cobaltResponse.status}: ${await cobaltResponse.text()}`);
        }

        const data = await cobaltResponse.json();
        
        if (data.status === 'error' || !data.url) {
            throw new Error(`[Cobalt] Extraction failed: ${data.text || 'No URL returned'}`);
        }

        console.log(`[YouTube/Cobalt] Success! Downloading absolute audio stream to memory...`);
        
        // 2. Download the raw audio stream to a memory buffer
        const streamResponse = await fetch(data.url);
        if (!streamResponse.ok) {
            throw new Error(`[Cobalt] Failed to fetch audio stream: ${streamResponse.status}`);
        }

        const arrayBuffer = await streamResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        console.log(`[YouTube/Cobalt] Download complete. Buffer size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
        return buffer;
        
    } catch (error) {
        console.error(`[YouTube] Error extracting stream for ${videoId}:`, error);
        throw error;
    }
}
