// Meeting Video Section Component
// Displays embedded YouTube player or fallback UI

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
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                    Watch Video ↗
                </a>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* YouTube Embed */}
            <div className="aspect-video w-full">
                <iframe
                    src={`https://www.youtube.com/embed/${actualVideoId}`}
                    title={title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                />
            </div>

            {/* Video Actions */}
            <div className="p-4 bg-gray-50 flex gap-3">
                <a
                    href={`https://www.youtube.com/watch?v=${actualVideoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                    Watch on YouTube ↗
                </a>
            </div>
        </div>
    );
}

/**
 * Extract YouTube video ID from various URL formats
 */
function extractVideoId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/,
        /^([a-zA-Z0-9_-]{11})$/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            return match[1];
        }
    }

    return null;
}
