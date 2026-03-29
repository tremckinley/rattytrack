// RecentMeetingsFeed — Shows the 5 most recent meetings with status badges

import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faFileLines, faFile, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import type { Meeting } from '@/lib/data/meetings';

type MeetingWithFlags = Meeting & { has_transcript: boolean; has_documents: boolean };

interface RecentMeetingsFeedProps {
    meetings: MeetingWithFlags[];
}

function formatDate(dateString: string | null): string {
    if (!dateString) return 'Date TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });
}

export default function RecentMeetingsFeed({ meetings }: RecentMeetingsFeedProps) {
    if (!meetings || meetings.length === 0) {
        return (
            <div className="card p-6">
                <h3 className="text-lg font-bold mb-4">Recent Meetings</h3>
                <p className="text-gray-500">No meetings recorded yet.</p>
            </div>
        );
    }

    return (
        <div className="card p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Recent Meetings</h3>
                <Link href="/meetings" className="text-sm text-capyred hover:underline font-medium">
                    View All →
                </Link>
            </div>
            <div className="space-y-3">
                {meetings.map((meeting) => (
                    <Link
                        key={meeting.id}
                        href={`/meetings/${meeting.id}`}
                        className="flex items-center justify-between p-3 border border-transparent hover:border-foreground hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all mb-2 last:mb-0 group bg-white"
                    >
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate group-hover:text-capyred transition-colors">
                                {meeting.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-500">{formatDate(meeting.scheduled_start)}</span>
                                <span className="px-1.5 py-0.5 bg-rose-800 text-white text-[10px] font-medium border border-rose-900">
                                    {meeting.meeting_type}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 ml-3 shrink-0">
                            {meeting.video_id && (
                                <span className="text-blue-500" title="Video available">
                                    <FontAwesomeIcon icon={faPlay} className="text-xs" />
                                </span>
                            )}
                            {meeting.has_transcript && (
                                <span className="text-green-500" title="Transcribed">
                                    <FontAwesomeIcon icon={faFileLines} className="text-xs" />
                                </span>
                            )}
                            {meeting.has_documents && (
                                <span className="text-purple-500" title="Documents available">
                                    <FontAwesomeIcon icon={faFile} className="text-xs" />
                                </span>
                            )}
                            <FontAwesomeIcon icon={faArrowRight} className="text-xs text-gray-300 group-hover:text-capyred transition-colors ml-1" />
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
