// Individual meeting page - Server Component
// Displays meeting details, video, documents, and transcript

import { getFullMeetingData, getMeetingById } from '@/lib/data/meetings';
import { getTranscriptionWithSegments, getSpeakerLabels } from '@/lib/data/transcriptions';
import { getLegislators } from '@/lib/data/legislators/legislator_card';
import { getAgendaItemsForVideo } from '@/lib/data/client/agenda-items-client';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import MeetingHeader from '@/components/MeetingHeader';
import MeetingVideoSection from '@/components/MeetingVideoSection';
import MeetingDocumentsSection from '@/components/MeetingDocumentsSection';
import MeetingAttendeesSection from '@/components/MeetingAttendeesSection';
import TranscriptPlayer from '@/components/TranscriptPlayer';
import SpeakerMapperWrapper from '@/components/SpeakerMapperWrapper';
import AgendaTimeline from '@/components/AgendaTimeline';
import MeetingTranscribeButton from '@/components/MeetingTranscribeButton';
import VotingSummary from '@/components/VotingSummary';
import MeetingSummaryWrapper from '@/components/MeetingSummaryWrapper';
import { getMeetingSummary } from '@/lib/data/meeting-summaries';

interface PageProps {
    params: Promise<{ meetingId: string }>;
}

export default async function MeetingPage({ params }: PageProps) {
    const { meetingId } = await params;

    // Fetch meeting and associated data
    const { meeting, documents, attendees, hasTranscript } = await getFullMeetingData(meetingId);

    if (!meeting) {
        notFound();
    }

    // If there's a linked video, fetch transcript data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let transcription: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let segments: any[] = [];
    let speakerLabels: Array<{ label: string; segmentCount: number; legislatorId: string | null }> = [];
    let legislators: Array<{ id: string; display_name: string; title: string | null; district: string | null; photo_url: string | null }> = [];
    let legislatorMap: Record<string, { display_name: string }> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let agendaItems: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let meetingSummary: any = null;

    if (meeting.video_id && hasTranscript) {
        const transcriptData = await getTranscriptionWithSegments(meeting.video_id);
        transcription = transcriptData.transcription;
        segments = transcriptData.segments;

        if (transcription?.status === 'completed' && transcription.diarization_enabled) {
            const speakerData = await getSpeakerLabels(meeting.video_id);
            speakerLabels = speakerData.labels;

            const legislatorData = await getLegislators('all');
            legislators = legislatorData.data.map(l => ({
                id: l.id,
                display_name: l.display_name,
                title: l.title,
                district: l.district,
                photo_url: l.photo_url,
            }));

            legislatorMap = legislators.reduce((acc, l) => {
                acc[l.id] = { display_name: l.display_name };
                return acc;
            }, {} as Record<string, { display_name: string }>);
        }

        // Fetch agenda items
        agendaItems = await getAgendaItemsForVideo(meeting.video_id);

        // Fetch meeting summary
        meetingSummary = await getMeetingSummary(meeting.video_id);
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Navigation */}
                <div className="mb-8">
                    <Link
                        href="/meetings"
                        className="text-blue-600 hover:text-blue-700 font-medium mb-4 inline-block"
                    >
                        ← Back to Meetings
                    </Link>
                </div>

                {/* Meeting Header */}
                <MeetingHeader
                    meeting={meeting}
                    hasTranscript={hasTranscript}
                    hasDocuments={documents.length > 0}
                />

                {/* AI Meeting Summary (for transcribed meetings) */}
                {hasTranscript && meeting.video_id && (
                    <MeetingSummaryWrapper
                        initialSummary={meetingSummary}
                        videoId={meeting.video_id}
                    />
                )}

                {/* Two-column layout for video and documents */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* Video Section - only show if no transcript (TranscriptPlayer has its own video) */}
                    <div className="lg:col-span-2">
                        {!hasTranscript && (
                            <MeetingVideoSection
                                videoId={meeting.video_id}
                                videoUrl={meeting.video_url}
                                title={meeting.title}
                            />
                        )}
                    </div>

                    {/* Sidebar: Documents and Attendees */}
                    <div className="space-y-6">
                        {/* Documents Section */}
                        <MeetingDocumentsSection
                            documents={documents}
                            agendaUrl={meeting.agenda_url}
                            minutesUrl={meeting.minutes_url}
                        />

                        {/* Attendees Section */}
                        {attendees.length > 0 && (
                            <MeetingAttendeesSection attendees={attendees} />
                        )}
                    </div>
                </div>

                {/* Speaker Mapper (if diarization was used) */}
                {transcription?.status === 'completed' && speakerLabels.length > 0 && meeting.video_id && (
                    <SpeakerMapperWrapper
                        videoId={meeting.video_id}
                        speakerLabels={speakerLabels}
                        legislators={legislators}
                    />
                )}

                {/* Agenda Timeline (if agenda items exist) */}
                {transcription?.status === 'completed' && agendaItems.length > 0 && (
                    <div className="mb-6 bg-white rounded-lg shadow-md p-6">
                        <AgendaTimeline
                            agendaItems={agendaItems}
                            segments={segments}
                            legislatorMap={legislatorMap}
                        />
                    </div>
                )}

                {/* Voting Summary (if votes exist) */}
                {transcription?.status === 'completed' && agendaItems.some(item => item.vote_result) && (
                    <VotingSummary
                        agendaItems={agendaItems}
                        legislators={legislators.map(l => ({ id: l.id, display_name: l.display_name }))}
                    />
                )}

                {/* Transcript Section */}
                {transcription?.status === 'completed' && meeting.video_id && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Meeting Transcript</h2>
                        <TranscriptPlayer
                            videoId={meeting.video_id}
                            title={meeting.title}
                            channelTitle={transcription.channel_title}
                            publishedAt={transcription.published_at}
                            segments={segments}
                            legislatorMap={legislatorMap}
                            agendaItems={agendaItems}
                        />
                    </div>
                )}

                {/* No Transcript - Show Transcribe Button */}
                {!hasTranscript && meeting.video_id && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                        <h3 className="font-semibold text-yellow-900 mb-2">Transcript Not Available</h3>
                        <p className="text-yellow-800">
                            This meeting has a video but has not been transcribed yet.
                        </p>
                        <MeetingTranscribeButton
                            videoId={meeting.video_id}
                            meetingId={meeting.id}
                        />
                    </div>
                )}

                {/* No Video Message */}
                {!meeting.video_id && (
                    <div className="bg-gray-100 border border-gray-200 rounded-lg p-6">
                        <h3 className="font-semibold text-gray-900 mb-2">No Video Available</h3>
                        <p className="text-gray-700">
                            This meeting does not have video available yet.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
