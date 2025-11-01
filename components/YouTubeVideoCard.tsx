import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay } from '@fortawesome/free-solid-svg-icons';
import { faYoutube } from '@fortawesome/free-brands-svg-icons';
import type { YouTubeVideo } from '@/lib/data/youtube';
import YouTubeTranscribeButton from './YouTubeTranscribeButton';

interface YouTubeVideoCardProps {
  video: YouTubeVideo;
  isTranscribed: boolean;
  videoDuration: number; // Duration in seconds
}

export default function YouTubeVideoCard({ video, isTranscribed, videoDuration }: YouTubeVideoCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const truncateDescription = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-muted">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <FontAwesomeIcon icon={faPlay} className="text-white text-4xl" />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">
          {video.title}
        </h3>
        
        <p className="text-sm text-muted-foreground mb-3">
          {formatDate(video.publishedAt)}
        </p>

        {video.description && (
          <p className="text-sm text-foreground/80 mb-4 line-clamp-3">
            {truncateDescription(video.description)}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <a
            href={`https://www.youtube.com/watch?v=${video.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            <FontAwesomeIcon icon={faYoutube} />
            Watch on YouTube
          </a>
          
          <YouTubeTranscribeButton
            videoId={video.id}
            videoTitle={video.title}
            durationSeconds={videoDuration}
            isTranscribed={isTranscribed}
          />
        </div>
      </div>
    </div>
  );
}
