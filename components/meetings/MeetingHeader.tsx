// Meeting Header Component
// Displays meeting title, date, type, and status badges

import { Meeting } from '@/lib/data/meetings';

interface MeetingHeaderProps {
    meeting: Meeting;
    hasTranscript: boolean;
    hasDocuments: boolean;
}

/**
 * Format date to readable format
 */
function formatDate(dateString: string | null): string {
    if (!dateString) return 'Date TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

/**
 * Format time from ISO string
 */
function formatTime(dateString: string | null): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
}

export default function MeetingHeader({ meeting, hasTranscript, hasDocuments }: MeetingHeaderProps) {
    return (
        <div className="bg-rose-950 text-white shadow-lg p-6 mb-6">
            {/* Meeting Type Badge */}
            <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-3 py-1 bg-rose-800 text-white text-sm font-medium">
                    {meeting.meeting_type}
                </span>

                {/* Status Badges */}
                {meeting.video_id && (
                    <span className="px-3 py-1 bg-blue-600 text-white text-sm font-medium">
                        📹 Video
                    </span>
                )}
                {hasTranscript && (
                    <span className="px-3 py-1 bg-green-600 text-white text-sm font-medium">
                        📝 Transcribed
                    </span>
                )}
                {hasDocuments && (
                    <span className="px-3 py-1 bg-purple-600 text-white text-sm font-medium">
                        📄 Documents
                    </span>
                )}
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold mb-2">{meeting.title}</h1>

            {/* Date and Time */}
            <div className="flex items-center gap-4 text-gray-200">
                <span>{formatDate(meeting.scheduled_start)}</span>
                {meeting.scheduled_start && (
                    <>
                        <span>•</span>
                        <span>{formatTime(meeting.scheduled_start)}</span>
                    </>
                )}
                {meeting.location && (
                    <>
                        <span>•</span>
                        <span>{meeting.location}</span>
                    </>
                )}
            </div>

            {/* Description */}
            {meeting.description && (
                <p className="mt-3 text-gray-300">{meeting.description}</p>
            )}
        </div>
    );
}
