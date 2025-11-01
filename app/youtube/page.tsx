import { getMemphisCityCouncilVideos } from '@/lib/data/youtube';
import YouTubeVideoCard from '@/components/YouTubeVideoCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faYoutube } from '@fortawesome/free-brands-svg-icons';

export default async function YouTubePage() {
  let videos;
  let error = null;

  try {
    videos = await getMemphisCityCouncilVideos(5);
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load videos';
    console.error('Error loading YouTube videos:', err);
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FontAwesomeIcon icon={faYoutube} className="text-red-600 text-3xl" />
            <h1 className="text-3xl font-bold">Memphis City Council Videos</h1>
          </div>
          <p className="text-muted-foreground">
            Latest meetings and videos from the official Memphis City Council YouTube channel
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-6 bg-destructive/10 border border-destructive rounded-lg mb-6">
            <h3 className="font-semibold text-destructive mb-2">Failed to Load Videos</h3>
            <p className="text-sm">{error}</p>
            <p className="text-sm mt-2 text-muted-foreground">
              Please check your YouTube API key configuration.
            </p>
          </div>
        )}

        {/* Videos Grid */}
        {videos && videos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <YouTubeVideoCard key={video.id} video={video} />
            ))}
          </div>
        ) : !error && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No videos found</p>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 p-6 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <h3 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">
            About These Videos
          </h3>
          <ul className="text-sm text-foreground/80 space-y-2">
            <li>• Shows the latest 5 videos from @MemphisCityCouncil</li>
            <li>• Click "Watch on YouTube" to view the full video</li>
            <li>• Click "Transcribe" to generate AI transcripts (coming soon)</li>
            <li>• Videos include committee meetings and regular council sessions</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
