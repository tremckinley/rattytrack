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
/**
 * Fetches the list of recent meetings from the Granicus archive page.
 * Returns an array of objects containing the clipId, date, and title.
 */
export async function fetchGranicusMeetings(): Promise<Array<{ clipId: string; date: Date; title: string }>> {
    const archiveUrl = `${GRANICUS_BASE}/ViewPublisher.php?view_id=${GRANICUS_VIEW_ID}`;
    console.log(`[Granicus] Fetching archive page: ${archiveUrl}`);

    const response = await fetch(archiveUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch Granicus archive page: HTTP ${response.status}`);
    }

    const html = await response.text();
    const meetings: Array<{ clipId: string; date: Date; title: string }> = [];

    // Regex to find meeting rows and their clip IDs
    // Example: <a href="MediaPlayer.php?view_id=6&clip_id=10666" ...
    // And search for dates in nearby text (usually in a <td>)
    
    // Simpler approach: find all clip_id links and extract metadata from the surrounding text
    const clipRegex = /clip_id=(\d+)/g;
    const clipIds = new Set<string>();
    let match;
    while ((match = clipRegex.exec(html)) !== null) {
        clipIds.add(match[1]);
    }

    console.log(`[Granicus] Found ${clipIds.size} unique clip IDs on the archive page.`);

    // To be more robust, we should parse the table rows properly.
    // For now, let's iterate through the clip IDs and try to find their dates in the HTML.
    for (const clipId of clipIds) {
        // Look for the clip ID in the HTML and backtrack/look ahead for a date
        // This is a bit hacky but effective for simple list pages.
        // Format is often: <td>Mar 24, 2026</td> ... clip_id=10666
        
        // Find the index of the clipId in the HTML
        const index = html.indexOf(`clip_id=${clipId}`);
        if (index === -1) continue;

        // Look back about 500 chars for a date like "Mar 24, 2026"
        const searchRange = html.substring(Math.max(0, index - 500), index);
        const dateMatch = searchRange.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),\s+(\d{4})\b/i);
        
        if (dateMatch) {
            const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
            const month = monthNames.indexOf(dateMatch[1].toLowerCase());
            const day = parseInt(dateMatch[2]);
            const year = parseInt(dateMatch[3]);
            const date = new Date(year, month, day);

            // Find title in a similar way (usually in an <a> tag near the clip_id)
            const titleMatch = searchRange.match(/>([^<]+Meeting[^<]*)</i) || html.substring(index).match(/>([^<]+Meeting[^<]*)</i);
            const title = titleMatch?.[1]?.trim() || `Meeting ${clipId}`;

            meetings.push({ clipId, date, title });
        }
    }

    return meetings;
}
