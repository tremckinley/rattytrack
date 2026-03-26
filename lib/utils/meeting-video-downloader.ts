/**
 * Downloads meeting video from the Granicus government archive platform.
 * Granicus hosts direct .mp4 files on a CDN with zero bot-detection,
 * making this approach vastly more reliable than YouTube extraction.
 *
 * Supports two input types:
 *   1. A Granicus clip ID (e.g. "10666") — scrapes the download URL from the player page
 *   2. A direct .mp4 URL — downloads immediately
 */

const GRANICUS_BASE = 'https://memphis.granicus.com';
const GRANICUS_VIEW_ID = 6; // Memphis City Council view

/**
 * Given a Granicus clip ID, resolve the direct MP4 download URL.
 * This is a lightweight HTTP request — no video data is downloaded.
 */
export async function resolveMp4Url(clipId: string): Promise<string> {
    const playerUrl = `${GRANICUS_BASE}/MediaPlayer.php?view_id=${GRANICUS_VIEW_ID}&clip_id=${clipId}`;
    console.log(`[Granicus] Fetching player page: ${playerUrl}`);

    const response = await fetch(playerUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch Granicus player page: HTTP ${response.status}`);
    }

    const html = await response.text();

    // The download link is embedded as: href="https://archive-video.granicus.com/memphis/memphis_<uuid>.mp4"
    const mp4Match = html.match(/href="(https:\/\/archive-video\.granicus\.com\/[^"]+\.mp4)"/);
    if (!mp4Match || !mp4Match[1]) {
        throw new Error(`Could not find MP4 download link on Granicus player page for clip ${clipId}`);
    }

    console.log(`[Granicus] Resolved MP4 URL: ${mp4Match[1]}`);
    return mp4Match[1];
}

/**
 * Downloads a meeting video directly into memory as a Buffer.
 * Accepts either a numeric clip ID or a full direct MP4 URL.
 */
export async function downloadMeetingVideoBuffer(clipIdOrUrl: string): Promise<Buffer> {
    const isDirectUrl = clipIdOrUrl.startsWith('http');
    const mp4Url = isDirectUrl ? clipIdOrUrl : await resolveMp4Url(clipIdOrUrl);

    console.log(`[Granicus] Downloading MP4 to memory...`);
    const streamResponse = await fetch(mp4Url);

    if (!streamResponse.ok) {
        throw new Error(`Failed to download MP4: HTTP ${streamResponse.status}`);
    }

    const arrayBuffer = await streamResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`[Granicus] Download complete. Buffer size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
    return buffer;
}

/**
 * Fetches the title/metadata for a Granicus clip from the player page.
 */
export async function fetchGranicusClipTitle(clipId: string): Promise<string> {
    const playerUrl = `${GRANICUS_BASE}/MediaPlayer.php?view_id=${GRANICUS_VIEW_ID}&clip_id=${clipId}`;
    const response = await fetch(playerUrl);

    if (!response.ok) {
        return `Memphis City Council Meeting (Clip ${clipId})`;
    }

    const html = await response.text();
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    return titleMatch?.[1]?.trim() || `Memphis City Council Meeting (Clip ${clipId})`;
}
