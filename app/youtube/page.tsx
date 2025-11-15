// YouTube videos list page - Server Component
// Displays latest Memphis City Council videos with transcription options

import { fetchLatestVideos } from '@/lib/data/youtube';
import { getTranscription } from '@/lib/data/youtube_transcriptions';
import YouTubeTranscribeButton from '@/components/YouTubeTranscribeButton';
import Link from 'next/link';

/**
 * Format duration from seconds to readable format (e.g., "1h 23m")
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Format date to readable format
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default async function YouTubePage() {
  let videos;
  let error = null;

  try {
    videos = await fetchLatestVideos(5);
  } catch (err) {
    console.error('Error fetching videos:', err);
    error = err instanceof Error ? err.message : 'Failed to load videos';
  }

  // Fetch transcription status for each video
  const videosWithStatus = videos ? await Promise.all(
    videos.map(async (video) => {
      const transcription = await getTranscription(video.videoId);
      return {
        ...video,
        transcriptionStatus: transcription?.status || ('idle' as const),
      };
    })
  ) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 font-medium mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Memphis City Council Videos
          </h1>
          <p className="text-gray-600">
            Watch recent council meetings and create searchable transcripts
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">
              <strong>Error:</strong> {error}
            </p>
            <p className="text-sm text-red-600 mt-2">
              Please check that your YouTube API key is configured correctly.
            </p>
          </div>
        )}

        {/* Videos Grid */}
        {videosWithStatus.length > 0 ? (
          <div className="grid gap-6">
            {videosWithStatus.map((video) => (
              <div
                key={video.videoId}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Thumbnail */}
                  <div className="md:w-1/3 relative">
                    <a
                      href={`https://www.youtube.com/watch?v=${video.videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                        {formatDuration(parseInt(video.duration))}
                      </div>
                    </a>
                  </div>

                  {/* Content */}
                  <div className="md:w-2/3 p-6 flex flex-col justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        {video.title}
                      </h2>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                        <span>{video.channelTitle}</span>
                        <span>•</span>
                        <span>{formatDate(video.publishedAt)}</span>
                        <span>•</span>
                        <span>{formatDuration(parseInt(video.duration))}</span>
                      </div>
                      {video.description && (
                        <p className="text-gray-700 text-sm line-clamp-2 mb-4">
                          {video.description}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <a
                        href={`https://www.youtube.com/watch?v=${video.videoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                      >
                        Watch on YouTube
                      </a>
                      <YouTubeTranscribeButton
                        videoId={video.videoId}
                        initialStatus={video.transcriptionStatus}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !error && (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-600">Loading videos...</p>
            </div>
          )
        )}

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">
            About Transcriptions
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Transcripts are shared across all users - no duplicate work!</li>
            <li>• Processing can take several minutes for long videos</li>
            <li>• Transcripts include timestamps for easy navigation</li>
            <li>• All transcriptions use AI to ensure accuracy</li>
          </ul>
        </div>
      </div>
    </div>
  );
}