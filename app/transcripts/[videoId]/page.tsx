// Transcript viewer page - Server Component
// Displays YouTube video with timestamped transcript and agenda timeline

import { getTranscriptionWithSegments, getSpeakerLabels } from '@/lib/data/transcriptions';
import { getLegislators } from '@/lib/data/legislators/legislator_card';
import { getAgendaItemsForVideo } from '@/lib/data/client/agenda-items-client';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import TranscriptPlayer from '@/components/TranscriptPlayer';
import SpeakerMapperWrapper from '@/components/SpeakerMapperWrapper';
import AgendaTimeline from '@/components/AgendaTimeline';

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

  // Fetch speaker labels and legislators for mapping (only if transcription completed with diarization)
  let speakerLabels: Array<{ label: string; segmentCount: number; legislatorId: string | null }> = [];
  let legislators: Array<{ id: string; display_name: string; title: string | null; district: string | null; photo_url: string | null }> = [];
  let legislatorMap: Record<string, { display_name: string }> = {};

  if (transcription.status === 'completed' && transcription.diarization_enabled) {
    const speakerData = await getSpeakerLabels(videoId);
    speakerLabels = speakerData.labels;

    const legislatorData = await getLegislators('all');
    legislators = legislatorData.data.map(l => ({
      id: l.id,
      display_name: l.display_name,
      title: l.title,
      district: l.district,
      photo_url: l.photo_url,
    }));

    // Create lookup map for TranscriptPlayer
    legislatorMap = legislators.reduce((acc, l) => {
      acc[l.id] = { display_name: l.display_name };
      return acc;
    }, {} as Record<string, { display_name: string }>);
  }

  // Fetch agenda items for this video
  const agendaItems = transcription.status === 'completed'
    ? await getAgendaItemsForVideo(videoId)
    : [];

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

        {/* Video Title */}
        <div className="block bg-rose-950 text-background shadow-lg mb-6">
          <h1 className="text-3xl font-bold mb-2">{transcription.title}</h1>
          <div className="flex items-center gap-4 text-gray-100">
            <span>{transcription.channel_title}</span>
            <span>•</span>
            <span>{formatDate(transcription.published_at)}</span>
          </div>
        </div>


        {/* Speaker Mapper (if diarization was used) */}
        {transcription.status === 'completed' && speakerLabels.length > 0 && (
          <SpeakerMapperWrapper
            videoId={videoId}
            speakerLabels={speakerLabels}
            legislators={legislators}
          />
        )}

        {/* Agenda Timeline (if agenda items exist) */}
        {transcription.status === 'completed' && agendaItems.length > 0 && (
          <div className="mb-6 bg-white rounded-lg shadow-md p-6">
            <AgendaTimeline
              agendaItems={agendaItems}
              segments={segments}
              legislatorMap={legislatorMap}
            />
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
            legislatorMap={legislatorMap}
          />
        )}

        {/* Metadata */}
        {/* {transcription.status === 'completed' && transcription.transcription_cost && (
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
        )} */}
      </div>
    </div>
  );
}