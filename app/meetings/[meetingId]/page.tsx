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
import VotingSummary from '@/components/VotingSummary';
import MeetingSummaryWrapper from '@/components/MeetingSummaryWrapper';
import IssueSpeakingDashboard from '@/components/IssueSpeakingDashboard';
import { getMeetingSummary } from '@/lib/data/meeting-summaries';
import { getMeetingIssueMetrics } from '@/lib/data/meeting_issue_metrics';

interface PageProps {
    params: Promise<{ meetingId: string }>;
    searchParams: Promise<{ t?: string }>;
}

export default async function MeetingPage({ params, searchParams }: PageProps) {
    const { meetingId } = await params;
    const { t } = await searchParams;
    const initialTime = t ? parseInt(t as string) : 0;

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
    let issueMetrics: any[] = [];

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

        // Fetch issue metrics for this meeting
        issueMetrics = await getMeetingIssueMetrics(meeting.video_id);
    }

    return (
        <div className="min-h-screen pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Breadcrumbs */}
                <div className="mb-6">
                    <Link
                        href="/meetings"
                        className="text-capyred hover:text-rose-800 font-medium flex items-center gap-2"
                    >
                        <span>←</span> Back to Meetings
                    </Link>
                </div>

                {/* 1. Header & Summary Row */}
                <div className="grid grid-cols-1 gap-6 mb-8">
                    <MeetingHeader
                        meeting={meeting}
                        hasTranscript={hasTranscript}
                        hasDocuments={documents.length > 0}
                    />

                    {hasTranscript && meeting.video_id && (
                        <MeetingSummaryWrapper
                            initialSummary={meetingSummary}
                            videoId={meeting.video_id}
                        />
                    )}
                </div>

                {/* 2. Primary Content: Video/Transcript & Sidebar */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
                    {/* Main Content Area (75%) */}
                    <div className="lg:col-span-3 space-y-8">
                        {/* Transcript Player - Primary Focus */}
                        {transcription?.status === 'completed' && meeting.video_id ? (
                            <div className="card overflow-hidden">
                                <div className="p-4 border-b border-foreground flex items-center justify-between bg-white">
                                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                        📺 Interactive Meeting Player
                                    </h2>
                                </div>
                                <TranscriptPlayer
                                    videoId={meeting.video_id}
                                    title={meeting.title}
                                    channelTitle={transcription.channel_title}
                                    publishedAt={transcription.published_at}
                                    segments={segments}
                                    legislatorMap={legislatorMap}
                                    agendaItems={agendaItems}
                                    initialTime={initialTime}
                                />
                            </div>
                        ) : (
                            /* Fallback Video Player if no transcript */
                            meeting.video_id && (
                                <div className="card overflow-hidden">
                                    <MeetingVideoSection
                                        videoId={meeting.video_id}
                                        videoUrl={meeting.video_url}
                                        title={meeting.title}
                                    />
                                    {!hasTranscript && (
                                        <div className="p-6 bg-gray-50 border-t border-foreground italic text-gray-500 text-sm">
                                            Transcript is not yet available for this meeting.
                                        </div>
                                    )}
                                </div>
                            )
                        )}

                        {/* Speaker Identification / Mapper */}
                        {transcription?.status === 'completed' && speakerLabels.length > 0 && meeting.video_id && (
                            <div className="card overflow-hidden">
                                <SpeakerMapperWrapper
                                    videoId={meeting.video_id}
                                    speakerLabels={speakerLabels}
                                    legislators={legislators}
                                />
                            </div>
                        )}

                        {/* Voting Section */}
                        {transcription?.status === 'completed' && agendaItems.some(item => item.vote_result) && (
                            <div className="card overflow-hidden">
                                <VotingSummary
                                    agendaItems={agendaItems}
                                    legislators={legislators.map(l => ({ id: l.id, display_name: l.display_name }))}
                                />
                            </div>
                        )}
                    </div>

                    {/* Sidebar Area (25%) */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Documents Section */}
                        <div className="card overflow-hidden">
                            <MeetingDocumentsSection
                                documents={documents}
                                agendaUrl={meeting.agenda_url}
                                minutesUrl={meeting.minutes_url}
                            />
                        </div>

                        {/* Attendees Section */}
                        {attendees.length > 0 && (
                            <div className="card overflow-hidden">
                                <MeetingAttendeesSection attendees={attendees} />
                            </div>
                        )}

                        {/* Quick Insight (Placeholder/Stats) */}
                        {transcription?.status === 'completed' && (
                            <div className="bg-capyred shadow-lg p-5 text-white">
                                <h3 className="font-bold flex items-center gap-2 mb-3">
                                    <span>🧠</span> Meeting Stats
                                </h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between border-b border-rose-800 pb-2">
                                        <span className="opacity-80">Duration</span>
                                        <span className="font-mono text-rose-200">{Math.round((meeting.video_duration_seconds || 0) / 60)} mins</span>
                                    </div>
                                    <div className="flex justify-between border-b border-indigo-500 pb-2">
                                        <span className="opacity-80">Topics</span>
                                        <span className="font-mono text-rose-200">{issueMetrics.length} detected</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="opacity-80">Speakers</span>
                                        <span className="font-mono text-rose-200">{speakerLabels.length} identified</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. Bottom Row: Intelligence & Deep Dive */}
                {transcription?.status === 'completed' && issueMetrics.length > 0 && (
                    <div className="mt-8 border-t border-gray-200 pt-8">
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                <span>🎯</span> Issue Focus Areas
                            </h2>
                            <p className="text-gray-500 text-sm">Key statements categorized by topic</p>
                        </div>
                        <IssueSpeakingDashboard issues={issueMetrics} />
                    </div>
                )}

                {/* No Video Message */}
                {!meeting.video_id && (
                    <div className="card p-8 text-center">
                        <div className="text-4xl mb-4 text-gray-300">📹</div>
                        <h3 className="font-bold text-xl text-gray-900 mb-2">No Video Available</h3>
                        <p className="text-gray-600 max-w-md mx-auto">
                            This meeting record exists but no video or transcript has been linked yet.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
