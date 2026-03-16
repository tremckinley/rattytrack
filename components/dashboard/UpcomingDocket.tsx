// UpcomingDocket — Shows upcoming scheduled meetings

import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar, faFileLines, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import type { Meeting } from '@/lib/data/meetings';

interface UpcomingDocketProps {
    meetings: Meeting[];
}

function formatDate(dateString: string | null): string {
    if (!dateString) return 'Date TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function getRelativeDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return `In ${diffDays} days`;
    if (diffDays <= 14) return 'Next week';
    return `In ${Math.ceil(diffDays / 7)} weeks`;
}

export default function UpcomingDocket({ meetings }: UpcomingDocketProps) {
    return (
        <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
                <FontAwesomeIcon icon={faCalendar} className="text-capyred" />
                <h3 className="text-lg font-bold">Upcoming Docket</h3>
            </div>

            {(!meetings || meetings.length === 0) ? (
                <div className="text-center py-6">
                    <p className="text-gray-500 text-sm">No upcoming meetings scheduled.</p>
                    <p className="text-gray-400 text-xs mt-1">Check back later for updates.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {meetings.map((meeting) => (
                        <Link
                            key={meeting.id}
                            href={`/meetings/${meeting.id}`}
                            className="block p-3 border border-gray-200 hover:border-capyred hover:bg-gray-50 transition-all group"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-foreground truncate group-hover:text-capyred transition-colors">
                                        {meeting.title}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {formatDate(meeting.scheduled_start)}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-medium rounded">
                                            {meeting.meeting_type}
                                        </span>
                                        {meeting.agenda_url && (
                                            <span className="text-purple-500 text-[10px]" title="Agenda available">
                                                <FontAwesomeIcon icon={faFileLines} className="mr-0.5" /> Agenda
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="ml-3 shrink-0">
                                    {meeting.scheduled_start && (
                                        <span className="text-xs font-medium text-capyred bg-rose-50 px-2 py-1 rounded">
                                            {getRelativeDate(meeting.scheduled_start)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
