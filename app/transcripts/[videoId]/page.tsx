import { getYouTubeTranscription } from '@/lib/data/youtube_transcriptions';
import { supabase } from '@/lib/utils/supabase';
import type { UploadedMeetingSegment } from '@/types/UploadedMeeting';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar, faClock } from '@fortawesome/free-solid-svg-icons';
import { faYoutube } from '@fortawesome/free-brands-svg-icons';
import { notFound } from 'next/navigation';

interface TranscriptPageProps {
  params: {
    videoId: string;
  };
}

export default async function TranscriptPage({ params }: TranscriptPageProps) {
  const { videoId } = params;
  
  // Fetch transcription
  const transcription = await getYouTubeTranscription(videoId);
  
  if (!transcription) {
    notFound();
  }
  
  // Fetch segments
  const { data: segments, error } = await supabase
    .from('uploaded_meeting_segments')
    .select('*')
    .eq('uploaded_meeting_id', transcription.id)
    .order('segment_index', { ascending: true });
  
  if (error) {
    console.error('Error fetching segments:', error);
  }
  
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return 'Unknown';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };
  
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-3">{transcription.title}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faCalendar} />
              <span>{formatDate(transcription.uploaded_at)}</span>
            </div>
            {transcription.video_duration_seconds && (
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faClock} />
                <span>{formatDuration(transcription.video_duration_seconds)}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faYoutube} className="text-red-600" />
              <a
                href={`https://www.youtube.com/watch?v=${videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Watch on YouTube
              </a>
            </div>
          </div>
        </div>

        {/* Video Embed */}
        <div className="mb-8">
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${videoId}`}
              title={transcription.title || 'YouTube video'}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>

        {/* Description */}
        {transcription.description && (
          <div className="mb-8 p-4 bg-muted rounded-lg">
            <h2 className="font-semibold mb-2">Description</h2>
            <p className="text-sm text-foreground/80 whitespace-pre-wrap">
              {transcription.description}
            </p>
          </div>
        )}

        {/* Transcription Status */}
        {transcription.transcription_status !== 'completed' && (
          <div className="mb-8 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <h3 className="font-semibold text-yellow-700 dark:text-yellow-300 mb-2">
              Transcription Status: {transcription.transcription_status}
            </h3>
            {transcription.transcription_error && (
              <p className="text-sm">{transcription.transcription_error}</p>
            )}
          </div>
        )}

        {/* Timestamped Segments */}
        {segments && segments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Transcript</h2>
            <div className="space-y-3">
              {(segments as UploadedMeetingSegment[]).map((segment) => (
                <div
                  key={segment.id}
                  className="flex gap-4 p-4 rounded-md bg-card border border-border hover:bg-accent/50 transition-colors"
                >
                  <a
                    href={`https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(segment.start_time_seconds)}s`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-mono text-primary hover:underline whitespace-nowrap"
                  >
                    {formatTime(segment.start_time_seconds)}
                  </a>
                  <div className="flex-1 text-sm">{segment.text}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Full Transcript */}
        {!segments && transcription.full_transcript && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Full Transcript</h2>
            <div className="p-6 bg-card border border-border rounded-lg">
              <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                {transcription.full_transcript}
              </p>
            </div>
          </div>
        )}

        {/* Back Link */}
        <div className="mt-8">
          <a
            href="/youtube"
            className="text-primary hover:underline"
          >
            ← Back to YouTube Videos
          </a>
        </div>
      </div>
    </main>
  );
}
