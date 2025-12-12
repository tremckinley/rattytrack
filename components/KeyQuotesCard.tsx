// KeyQuotesCard - Displays high-impact quotes for legislator profiles
// Styled to match the original StatementCard with links to transcripts

import Link from 'next/link';
import type { KeyQuote } from '@/types/LegislatorIntelligence';

type KeyQuoteWithVideo = KeyQuote & {
    video_id?: string | null;
    start_time?: number | null;
    video_title?: string | null;
    video_published_at?: string | null;
};

type KeyQuotesCardProps = {
    quotes: KeyQuoteWithVideo[];
    maxQuotes?: number;
};

// Impact level styles (subtle border colors)
const impactBorderColors: Record<string, string> = {
    critical: 'border-red-500',
    high: 'border-orange-400',
    medium: 'border-yellow-400',
    low: 'border-accent-foreground/30'
};

// Quote type labels
const quoteTypeLabels: Record<string, string> = {
    policy_stance: 'Policy',
    controversial: 'Controversial',
    emotional: 'Emotional',
    decisive: 'Decisive'
};

export default function KeyQuotesCard({ quotes, maxQuotes = 10 }: KeyQuotesCardProps) {
    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return 'Unknown date';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (seconds: number | null | undefined) => {
        if (!seconds) return '';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Filter to only show approved quotes and limit
    const displayQuotes = quotes
        .filter(q => q.is_approved)
        .slice(0, maxQuotes);

    if (displayQuotes.length === 0) {
        return (
            <div className="card">
                <h2 className="text-lg font-bold mb-4">Key Quotes</h2>
                <p className="text-gray-500">No notable quotes recorded yet.</p>
            </div>
        );
    }

    return (
        <div className="card overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">Key Quotes</h2>
            <div className="space-y-4">
                {displayQuotes.map((quote) => {
                    const borderColor = impactBorderColors[quote.impact_level] || impactBorderColors.low;
                    const hasLink = quote.video_id;

                    const content = (
                        <div
                            key={quote.id}
                            className={`border-l-4 ${borderColor} pl-4 py-2 hover:bg-sidebar-foreground/5 transition-colors ${hasLink ? 'cursor-pointer' : ''}`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="text-xs text-gray-600">
                                    {formatDate(quote.video_published_at)} - <span className="font-semibold text-gray-700">{quote.video_title || 'Unknown video'}</span>
                                </div>
                                {quote.start_time !== null && quote.start_time !== undefined && (
                                    <div className="text-xs text-gray-500">
                                        {formatTime(quote.start_time)}
                                    </div>
                                )}
                            </div>

                            <p className="text-sm text-foreground mb-2 line-clamp-3 hover:line-clamp-none active:line-clamp-none">
                                {quote.quote_text}
                            </p>

                            {/* Tags row: quote type and impact level */}
                            <div className="flex flex-wrap gap-2 mt-2">
                                {quote.quote_type && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-accent-foreground/10 text-accent-foreground">
                                        {quoteTypeLabels[quote.quote_type] || quote.quote_type}
                                    </span>
                                )}
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${quote.impact_level === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' :
                                        quote.impact_level === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300' :
                                            quote.impact_level === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300' :
                                                'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                    }`}>
                                    {quote.impact_level}
                                </span>
                            </div>
                        </div>
                    );

                    // Wrap with link if video_id is available
                    if (hasLink) {
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
