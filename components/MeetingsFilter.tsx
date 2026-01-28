'use client';

// Meetings Filter Component
// Client component for filter controls with URL-based state

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

interface MeetingsFilterProps {
    meetingTypes: string[];
    legislators: Array<{ id: string; display_name: string }>;
    currentFilters: {
        type?: string;
        from?: string;
        to?: string;
        attendee?: string;
    };
}

export default function MeetingsFilter({
    meetingTypes,
    legislators,
    currentFilters
}: MeetingsFilterProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [type, setType] = useState(currentFilters.type || '');
    const [from, setFrom] = useState(currentFilters.from || '');
    const [to, setTo] = useState(currentFilters.to || '');
    const [attendee, setAttendee] = useState(currentFilters.attendee || '');

    const applyFilters = () => {
        const params = new URLSearchParams();
        if (type) params.set('type', type);
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        if (attendee) params.set('attendee', attendee);

        router.push(`/meetings?${params.toString()}`);
    };

    const clearFilters = () => {
        setType('');
        setFrom('');
        setTo('');
        setAttendee('');
        router.push('/meetings');
    };

    const hasFilters = type || from || to || attendee;

    return (
        <div className="block bg-capyred text-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-wrap gap-4">
                {/* Meeting Type */}
                <div className="flex-1 min-w-[200px]">
                    <label className="font-medium text-white">
                        Meeting Type
                    </label>
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">All Types</option>
                        {meetingTypes.map((t) => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </div>

                {/* Date From */}
                <div className="flex-1 min-w-[150px]">
                    <label className="font-medium text-white">
                        From Date
                    </label>
                    <input
                        type="date"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* Date To */}
                <div className="flex-1 min-w-[150px]">
                    <label className="font-medium text-white">
                        To Date
                    </label>
                    <input
                        type="date"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* Attendee */}
                <div className="flex-1 min-w-[200px]">
                    <label className="font-medium text-white">
                        Council Member
                    </label>
                    <select
                        value={attendee}
                        onChange={(e) => setAttendee(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">All Members</option>
                        {legislators.map((l) => (
                            <option key={l.id} value={l.id}>{l.display_name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-4">
                <button
                    onClick={applyFilters}
                    className="px-4 py-2 border border-gray-300 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                    Apply Filters
                </button>
                {hasFilters && (
                    <button
                        onClick={clearFilters}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                        Clear Filters
                    </button>
                )}
            </div>
        </div>
    );
}
