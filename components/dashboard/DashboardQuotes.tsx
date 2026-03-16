// DashboardQuotes — High-impact quotes for the dashboard

import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuoteLeft } from '@fortawesome/free-solid-svg-icons';
import type { DashboardQuote } from '@/lib/data/key-quotes';

interface DashboardQuotesProps {
    quotes: DashboardQuote[];
}

const impactBadgeColors: Record<string, string> = {
    critical: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-gray-100 text-gray-700',
};

const quoteTypeLabels: Record<string, string> = {
    policy_stance: 'Policy',
    controversial: 'Controversial',
    emotional: 'Emotional',
    decisive: 'Decisive',
};

function formatTime(seconds: number | null): string {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function DashboardQuotes({ quotes }: DashboardQuotesProps) {
    if (!quotes || quotes.length === 0) {
        return (
            <div className="card p-6">
                <div className="flex items-center gap-2 mb-4">
                    <FontAwesomeIcon icon={faQuoteLeft} className="text-capyred" />
                    <h3 className="text-lg font-bold">Notable Quotes</h3>
                </div>
                <p className="text-gray-500 text-sm">No notable quotes recorded yet.</p>
            </div>
        );
    }

    return (
        <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
                <FontAwesomeIcon icon={faQuoteLeft} className="text-capyred" />
                <h3 className="text-lg font-bold">Notable Quotes</h3>
            </div>
            <div className="space-y-4">
                {quotes.map((quote) => {
                    const badgeColor = impactBadgeColors[quote.impact_level] || impactBadgeColors.low;

                    const content = (
                        <div
                            key={quote.id}
                            className="border-l-4 border-capyred pl-4 py-2 hover:bg-gray-50 transition-colors"
                        >
                            <p className="text-sm text-foreground leading-relaxed line-clamp-3">
                                &ldquo;{quote.quote_text}&rdquo;
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                {quote.speaker_name && (
                                    <span className="text-xs font-semibold text-foreground">
                                        — {quote.speaker_name}
                                    </span>
                                )}
                                {quote.video_title && (
                                    <span className="text-xs text-gray-500 truncate max-w-[150px]" title={quote.video_title}>
                                        {quote.video_title}
                                    </span>
                                )}
                                {quote.start_time !== null && (
                                    <span className="text-xs text-gray-400 font-mono">
                                        {formatTime(quote.start_time)}
                                    </span>
                                )}
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${badgeColor}`}>
                                    {quote.impact_level}
                                </span>
                                {quote.quote_type && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                                        {quoteTypeLabels[quote.quote_type] || quote.quote_type}
                                    </span>
                                )}
                            </div>
                        </div>
                    );

                    if (quote.video_id) {
                        const timestamp = quote.start_time ? `#t=${Math.floor(quote.start_time)}` : '';
                        return (
                            <Link
                                key={quote.id}
                                href={`/transcripts/${quote.video_id}${timestamp}`}
                                className="block"
                            >
                                {content}
                            </Link>
                        );
                    }

                    return content;
                })}
            </div>
        </div>
    );
}
