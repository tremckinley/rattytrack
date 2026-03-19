"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faCalendar, faUser, faClock, faChevronRight, faFilter, faXmark } from '@fortawesome/free-solid-svg-icons';
import { formatDate, formatTime } from '@/lib/utils/format';

interface SearchResult {
    id: number;
    meetingId: string;
    startTime: number;
    endTime: number;
    text: string;
    speakerName: string | null;
    speakerId: string | null;
    meetingTitle: string;
    publishedAt: string;
    thumbnailUrl: string | null;
}

function SearchContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const q = searchParams.get('q') || '';
    const initialSpeakerId = searchParams.get('speakerId') || '';
    const initialStartDate = searchParams.get('startDate') || '';
    const initialEndDate = searchParams.get('endDate') || '';

    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [legislators, setLegislators] = useState<any[]>([]);

    // Local filter state
    const [speakerId, setSpeakerId] = useState(initialSpeakerId);
    const [startDate, setStartDate] = useState(initialStartDate);
    const [endDate, setEndDate] = useState(initialEndDate);

    useEffect(() => {
        async function fetchLegislators() {
            try {
                const res = await fetch('/api/legislators');
                const data = await res.json();
                setLegislators(data.legislators || []);
            } catch (err) {
                console.error('Error fetching legislators:', err);
            }
        }
        fetchLegislators();
    }, []);

    useEffect(() => {
        if (!q) {
            setResults([]);
            return;
        }

        async function performSearch() {
            setLoading(true);
            setError(null);
            try {
                const params = new URLSearchParams();
                params.set('q', q);
                if (speakerId) params.set('speakerId', speakerId);
                if (startDate) params.set('startDate', startDate);
                if (endDate) params.set('endDate', endDate);

                const res = await fetch(`/api/search?${params.toString()}`);
                if (!res.ok) throw new Error('Search failed');
                const data = await res.json();
                setResults(data.results || []);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        performSearch();
    }, [q, speakerId, startDate, endDate]);

    const applyFilters = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams(searchParams.toString());
        if (speakerId) params.set('speakerId', speakerId); else params.delete('speakerId');
        if (startDate) params.set('startDate', startDate); else params.delete('startDate');
        if (endDate) params.set('endDate', endDate); else params.delete('endDate');
        router.push(`/search?${params.toString()}`);
    };

    const clearFilters = () => {
        setSpeakerId('');
        setStartDate('');
        setEndDate('');
        const params = new URLSearchParams();
        params.set('q', q);
        router.push(`/search?${params.toString()}`);
    };



    return (
        <div className="min-h-screen pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar Filters */}
                    <div className="w-full md:w-64 flex-shrink-0">
                        <div className="card p-6 sticky top-24">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <FontAwesomeIcon icon={faFilter} className="text-lg" />
                                    Filters
                                </h2>
                                {(speakerId || startDate || endDate) && (
                                    <button
                                        onClick={clearFilters}
                                        className="text-xs text-capyred hover:text-rose-800 font-medium"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>

                            <form onSubmit={applyFilters} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Speaker</label>
                                    <select
                                        value={speakerId}
                                        onChange={(e) => setSpeakerId(e.target.value)}
                                        className="w-full border border-foreground text-sm focus:ring-capyred focus:border-capyred text-black"
                                    >
                                        <option value="">All Speakers</option>
                                        {legislators.map((leg) => (
                                            <option key={leg.id} value={leg.id}>
                                                {leg.display_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">From Date</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full border border-foreground text-sm focus:ring-capyred focus:border-capyred"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">To Date</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full border border-foreground text-sm focus:ring-capyred focus:border-capyred"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-capyred text-white py-2 text-sm font-bold hover:bg-rose-900 transition-colors shadow-sm"
                                >
                                    Apply Filters
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Search Results */}
                    <div className="flex-1">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    Search Results for "{q}"
                                </h1>
                                <p className="text-gray-500 text-sm mt-1">
                                    {loading ? 'Searching...' : `Found ${results.length} matches across all meetings`}
                                </p>
                            </div>
                        </div>

                        {loading ? (
                            <div className="space-y-4">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="card h-32 animate-pulse" />
                                ))}
                            </div>
                        ) : error ? (
                            <div className="bg-red-50 border border-red-200 p-6 text-red-700">
                                <p className="font-bold">Error</p>
                                <p className="text-sm">{error}</p>
                            </div>
                        ) : results.length > 0 ? (
                            <div className="space-y-4">
                                {results.map((result) => (
                                    <Link
                                        key={result.id}
                                        href={`/meetings/${result.meetingId}?t=${Math.floor(result.startTime)}`}
                                        className="block card overflow-hidden hover:border-capyred hover:shadow-md transition-all group"
                                    >
                                        <div className="flex items-start p-5 gap-4">
                                            {result.thumbnailUrl && (
                                                <div className="hidden sm:block flex-shrink-0 w-32 aspect-video relative overflow-hidden border border-foreground">
                                                    <Image
                                                        src={result.thumbnailUrl}
                                                        alt={result.meetingTitle}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                                                    <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
                                                        <FontAwesomeIcon icon={faClock} className="text-[10px]" />
                                                        {formatTime(result.startTime)}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-bold text-capyred uppercase tracking-wider truncate max-w-[200px]">
                                                        {result.meetingTitle}
                                                    </span>
                                                    <span className="text-gray-300 text-xs">•</span>
                                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                                        <FontAwesomeIcon icon={faCalendar} className="text-xs" />
                                                        {formatDate(result.publishedAt)}
                                                    </span>
                                                </div>

                                                <p className="text-gray-800 text-sm leading-relaxed line-clamp-2 md:line-clamp-3 mb-2">
                                                    {/* Highlight keywords? For now just show snippet */}
                                                    ...{result.text}...
                                                </p>

                                                <div className="flex items-center justify-between mt-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center text-capyred">
                                                            <FontAwesomeIcon icon={faUser} className="text-xs" />
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-700">
                                                            {result.speakerName || 'Unknown Speaker'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center text-xs font-bold text-capyred opacity-0 group-hover:opacity-100 transition-opacity">
                                                        PLAY FROM HERE
                                                        <FontAwesomeIcon icon={faChevronRight} className="text-sm" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="card p-12 text-center">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                    <FontAwesomeIcon icon={faSearch} className="text-3xl" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">No results found</h3>
                                <p className="text-gray-500 mt-2 max-w-sm mx-auto">
                                    Try adjusting your keywords or filters to find what you're looking for.
                                </p>
                                <button
                                    onClick={clearFilters}
                                    className="mt-6 text-capyred font-bold hover:underline"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-capyred"></div>
            </div>
        }>
            <SearchContent />
        </Suspense>
    );
}
