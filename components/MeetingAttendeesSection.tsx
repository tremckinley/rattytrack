// Meeting Attendees Section Component
// Displays council members who attended the meeting

import { MeetingAttendee } from '@/lib/data/meetings';
import Link from 'next/link';

interface MeetingAttendeesSectionProps {
    attendees: MeetingAttendee[];
}

// Status display styling
const STATUS_STYLES: Record<string, { label: string; className: string }> = {
    'present': { label: 'Present', className: 'bg-green-100 text-green-800' },
    'absent': { label: 'Absent', className: 'bg-red-100 text-red-800' },
    'excused': { label: 'Excused', className: 'bg-yellow-100 text-yellow-800' },
    'late': { label: 'Late', className: 'bg-orange-100 text-orange-800' },
};

export default function MeetingAttendeesSection({ attendees }: MeetingAttendeesSectionProps) {
    if (attendees.length === 0) {
        return null;
    }

    // Sort by status (present first) then by name
    const sortedAttendees = [...attendees].sort((a, b) => {
        const statusOrder = { 'present': 0, 'late': 1, 'excused': 2, 'absent': 3 };
        const aOrder = statusOrder[a.attendance_status as keyof typeof statusOrder] ?? 4;
        const bOrder = statusOrder[b.attendance_status as keyof typeof statusOrder] ?? 4;

        if (aOrder !== bOrder) return aOrder - bOrder;

        // Then by name
        const aName = a.legislator?.display_name || '';
        const bName = b.legislator?.display_name || '';
        return aName.localeCompare(bName);
    });

    const presentCount = attendees.filter(a => a.attendance_status === 'present' || a.attendance_status === 'late').length;

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Attendance</h3>
                <span className="text-sm text-gray-600">
                    {presentCount} of {attendees.length} present
                </span>
            </div>

            <div className="space-y-2">
                {sortedAttendees.map(attendee => {
                    const statusInfo = STATUS_STYLES[attendee.attendance_status] ||
                        { label: attendee.attendance_status, className: 'bg-gray-100 text-gray-800' };

                    return (
                        <div
                            key={attendee.id}
                            className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                        >
                            <div className="flex items-center gap-3">
                                {attendee.legislator?.photo_url ? (
                                    <img
                                        src={attendee.legislator.photo_url}
                                        alt={attendee.legislator.display_name}
                                        className="w-8 h-8 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                                        {attendee.legislator?.display_name?.charAt(0) || '?'}
                                    </div>
                                )}
                                <div>
                                    {attendee.legislator ? (
                                        <Link
                                            href={`/legislators/${attendee.legislator_id}`}
                                            className="text-sm font-medium text-gray-900 hover:text-blue-600"
                                        >
                                            {attendee.legislator.display_name}
                                        </Link>
                                    ) : (
                                        <span className="text-sm font-medium text-gray-900">Unknown</span>
                                    )}
                                    {attendee.legislator?.district && (
                                        <p className="text-xs text-gray-500">{attendee.legislator.district}</p>
                                    )}
                                </div>
                            </div>

                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusInfo.className}`}>
                                {statusInfo.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
