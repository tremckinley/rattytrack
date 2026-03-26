// Meeting Video Section Component
// Displays embedded Granicus player or fallback UI

interface MeetingVideoSectionProps {
    videoId: string | null;
    videoUrl: string | null;
    title: string;
}

export default function MeetingVideoSection({ videoId, videoUrl, title }: MeetingVideoSectionProps) {
    // No video available
    if (!videoId && !videoUrl) {
        return (
            <div className="bg-gray-100 rounded-lg p-8 flex flex-col items-center justify-center min-h-[300px]">
                <div className="text-6xl mb-4">📹</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Video Available</h3>
                <p className="text-gray-600 text-center">
                    Video for this meeting has not been uploaded yet.
                </p>
            </div>
        );
    }

    // Extract video ID from URL if not directly provided
    const actualVideoId = videoId || (videoUrl ? extractVideoId(videoUrl) : null);

    if (!actualVideoId) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Meeting Video</h3>
                <a
                    href={videoUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Watch Video ↗
                </a>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Video Embed */}
            <div className="aspect-video w-full bg-black">
                <iframe
                    src={`https://memphis.granicus.com/MediaPlayer.php?view_id=6&clip_id=${actualVideoId}&embed=1&autostart=0`}
                    title={title}
                    allowFullScreen
                    className="w-full h-full border-0"
                />
            </div>

            {/* Video Actions */}
            <div className="p-4 bg-gray-50 flex gap-3 border-t border-gray-100">
                <a
                    href={`https://memphis.granicus.com/MediaPlayer.php?view_id=6&clip_id=${actualVideoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm"
                >
                    Watch on Granicus Archive ↗
                </a>
            </div>
        </div>
    );
}

/**
 * Extract Granicus video ID from various URL formats
 */
function extractVideoId(url: string): string | null {
    // Checks for standard clipID assignment like clip_id=10666
    const clipMatch = url.match(/clip_id=(\d+)/);
    if (clipMatch) {
        return clipMatch[1];
    }

    // If it's just a raw number passed as a URL string magically
    if (/^\d+$/.test(url)) {
        return url;
    }

    return null;
}
