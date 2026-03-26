/**
 * Extracts YouTube audio using the open-source Piped API network.
 * This effectively bypasses YouTube's strict datacenter IP blocks (Vercel) 
 * by requesting the stream through community-hosted residential proxies.
 */
export async function downloadYouTubeAudioBuffer(videoId: string): Promise<Buffer> {
    // A curated list of highly-available public Piped instances.
    // If one is rate-limited or down, it instantly falls over to the next.
    const PIPED_INSTANCES = [
        'https://pipedapi.kavin.rocks',
        'https://pipedapi.lunar.icu',
        'https://pipedapi.smnz.de',
        'https://api.piped.projectsegfau.lt'
    ];

    let lastError: any;

    for (const instance of PIPED_INSTANCES) {
        try {
            console.log(`[YouTube/Piped] Requesting audio stream from ${instance} for ${videoId}...`);
            
            // 1. Ask Piped to resolve the YouTube format streams
            const response = await fetch(`${instance}/streams/${videoId}`);
            
            if (!response.ok) {
                throw new Error(`Instance returned HTTP ${response.status}`);
            }

            const data = await response.json();
            
            // 2. Find the best audio-only stream (M4A is natively perfect for AssemblyAI)
            const audioStream = data.audioStreams?.find((s: any) => s.mimeType.includes('audio/mp4')) 
                || data.audioStreams?.[0]; // Fallback to first available

            if (!audioStream || !audioStream.url) {
                throw new Error(`Instance payload missing audio streams`);
            }

            console.log(`[YouTube/Piped] Success! Downloading absolute audio stream to memory...`);
            
            // 3. Download the raw proxied audio stream to a memory buffer
            const streamResponse = await fetch(audioStream.url);
            
            if (!streamResponse.ok) {
                throw new Error(`Failed to fetch underlying audio stream: ${streamResponse.status}`);
            }

            const arrayBuffer = await streamResponse.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            
            console.log(`[YouTube/Piped] Download complete. Buffer size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
            return buffer;

        } catch (error: any) {
            console.warn(`[YouTube/Piped] Instance ${instance} failed:`, error.message);
            lastError = error;
            // Loop continues to the next fallback instance
        }
    }

    // If it exhausts the entire array without success
    console.error(`[YouTube/Piped] All Piped instances failed for video ${videoId}`);
    throw lastError || new Error(`Failed to extract audio stream for ${videoId}`);
}
