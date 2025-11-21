// Transcript viewer page - Server Component
// Displays YouTube video with timestamped transcript

import { getTranscriptionWithSegments } from '@/lib/data/youtube_transcriptions';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import TranscriptPlayer from '@/components/TranscriptPlayer';

interface PageProps {
  params: Promise<{ videoId: string }>;
}

/**
 * Format date to readable format
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function TranscriptPage({ params }: PageProps) {
  const { videoId } = await params;

  const { transcription, segments } = await getTranscriptionWithSegments(videoId);

  if (!transcription) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/youtube"
            className="text-blue-600 hover:text-blue-700 font-medium mb-4 inline-block"
          >
            ← Back to Videos
          </Link>
        </div>

        {/* Error State */}
        {transcription.status === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-red-900 mb-2">
              Transcription Failed
            </h3>
            <p className="text-red-800 mb-4">
              {transcription.error_message || 'An unknown error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Retry Transcription
            </button>
          </div>
        )}

        {/* Processing State */}
        {transcription.status === 'processing' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <div>
                <h3 className="font-semibold text-blue-900">
                  Transcription in Progress
                </h3>
                <p className="text-blue-800 text-sm">
                  This may take several minutes. The page will update automatically.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Video Player and Transcript */}
        {transcription.status === 'completed' && (
          <TranscriptPlayer
            videoId={videoId}
            title={transcription.title}
            channelTitle={transcription.channel_title}
            publishedAt={transcription.published_at}
            segments={segments}
          />
        )}

        {/* Metadata */}
        {transcription.status === 'completed' && transcription.transcription_cost && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              Transcription Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Segments:</span>
                <span className="ml-2 font-medium">{segments.length}</span>
              </div>
              <div>
                <span className="text-gray-600">Cost:</span>
                <span className="ml-2 font-medium">
                  ${Number(transcription.transcription_cost).toFixed(4)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Transcribed:</span>
                <span className="ml-2 font-medium">
                  {formatDate(transcription.created_at)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}