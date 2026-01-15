// Meetings List Page - Server Component
// Displays all council meetings with filters

import { getMeetings, getMeetingTypes, getLegislatorsForFilter } from '@/lib/data/meetings';
import Link from 'next/link';
import MeetingsFilter from '@/components/MeetingsFilter';

interface PageProps {
    searchParams: Promise<{
        type?: string;
        from?: string;
        to?: string;
        attendee?: string;
        page?: string;
    }>;
}

/**
 * Format date for display
 */
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

export default async function MeetingsPage({ searchParams }: PageProps) {
    const params = await searchParams;

    // Parse filters from URL
    const filters = {
        meetingType: params.type,
        dateFrom: params.from ? new Date(params.from) : undefined,
        dateTo: params.to ? new Date(params.to) : undefined,
        attendeeId: params.attendee,
        limit: 20,
        offset: params.page ? (parseInt(params.page) - 1) * 20 : 0,
    };

    // Fetch data
    const [{ meetings, total }, meetingTypes, legislators] = await Promise.all([
        getMeetings(filters),
        getMeetingTypes(),
        getLegislatorsForFilter(),
    ]);

    const currentPage = params.page ? parseInt(params.page) : 1;
    const totalPages = Math.ceil(total / 20);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/"
                        className="text-blue-600 hover:text-blue-700 font-medium mb-4 inline-block"
                    >
                        ← Back to Dashboard
                    </Link>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        City Council Meetings
                    </h1>
                    <p className="text-gray-600">
                        Browse all council meetings with video, documents, and transcripts
                    </p>
                </div>

                {/* Filters */}
                <MeetingsFilter
                    meetingTypes={meetingTypes}
                    legislators={legislators}
                    currentFilters={{
                        type: params.type,
                        from: params.from,
                        to: params.to,
                        attendee: params.attendee,
                    }}
                />

                {/* Results Count */}
                <div className="mb-4 text-sm text-gray-600">
                    Showing {meetings.length} of {total} meetings
                </div>

                {/* Meetings Grid */}
                {meetings.length > 0 ? (
                    <div className="grid gap-4">
                        {meetings.map((meeting) => (
                            <Link
                                key={meeting.id}
                                href={`/meetings/${meeting.id}`}
                                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow block"
                            >
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    {/* Meeting Info */}
                                    <div className="flex-1">
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            <span className="px-2 py-1 bg-rose-100 text-rose-800 text-xs font-medium rounded">
                                                {meeting.meeting_type}
                                            </span>
                                            {meeting.video_id && (
                                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                                                    📹 Video
                                                </span>
                                            )}
                                            {meeting.transcription_status === 'completed' && (
                                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                                                    📝 Transcribed
                                                </span>
                                            )}
                                        </div>
                                        <h2 className="text-lg font-semibold text-gray-900 mb-1">
                                            {meeting.title}
                                        </h2>
                                        <p className="text-gray-600 text-sm">
                                            {formatDate(meeting.scheduled_start)}
                                            {meeting.location && ` • ${meeting.location}`}
                                        </p>
                                    </div>

                                    {/* Arrow indicator */}
                                    <div className="text-gray-400 text-2xl">
                                        →
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-md p-8 text-center">
                        <p className="text-gray-600">No meetings found matching your filters.</p>
                        <Link
                            href="/meetings"
                            className="text-blue-600 hover:underline mt-2 inline-block"
                        >
                            Clear filters
                        </Link>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-8 flex justify-center gap-2">
                        {currentPage > 1 && (
                            <Link
                                href={buildFilterUrl(params, currentPage - 1)}
                                className="px-4 py-2 bg-white rounded-lg shadow hover:bg-gray-50"
                            >
                                Previous
                            </Link>
                        )}
                        <span className="px-4 py-2 text-gray-600">
                            Page {currentPage} of {totalPages}
                        </span>
                        {currentPage < totalPages && (
                            <Link
                                href={buildFilterUrl(params, currentPage + 1)}
                                className="px-4 py-2 bg-white rounded-lg shadow hover:bg-gray-50"
                            >
                                Next
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Build URL with current filters and new page number
 */
function buildFilterUrl(params: Record<string, string | undefined>, page: number): string {
    const searchParams = new URLSearchParams();
    if (params.type) searchParams.set('type', params.type);
    if (params.from) searchParams.set('from', params.from);
    if (params.to) searchParams.set('to', params.to);
    if (params.attendee) searchParams.set('attendee', params.attendee);
    if (page > 1) searchParams.set('page', page.toString());

    const query = searchParams.toString();
    return `/meetings${query ? `?${query}` : ''}`;
}
