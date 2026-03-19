// QuotesList — Unified component for displaying key quotes
// Used on: legislator profile (variant="profile") and dashboard (variant="dashboard")

import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuoteLeft } from '@fortawesome/free-solid-svg-icons';
import { formatTime } from '@/lib/utils/format';
import type { KeyQuote } from '@/types/LegislatorIntelligence';
import type { DashboardQuote } from '@/lib/data/key-quotes';

// Extended type for profile variant (includes video join data)
type KeyQuoteWithVideo = KeyQuote & {
    video_id?: string | null;
    start_time?: number | null;
    video_title?: string | null;
    video_published_at?: string | null;
};

// Shared constants
const impactBadgeColors: Record<string, string> = {
    critical: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-gray-100 text-gray-700',
};

const impactBorderColors: Record<string, string> = {
    critical: 'border-red-500',
    high: 'border-orange-400',
    medium: 'border-yellow-400',
    low: 'border-accent-foreground/30',
};

const quoteTypeLabels: Record<string, string> = {
    policy_stance: 'Policy',
    controversial: 'Controversial',
    emotional: 'Emotional',
    decisive: 'Decisive',
};

// ─── Profile Variant ─────────────────────────────────────────────────────────

interface ProfileQuotesListProps {
    variant: 'profile';
    quotes: KeyQuoteWithVideo[];
    maxQuotes?: number;
}

function ProfileQuotesList({ quotes, maxQuotes = 10 }: ProfileQuotesListProps) {
    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return 'Unknown date';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

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

                            <div className="flex flex-wrap gap-2 mt-2">
                                {quote.quote_type && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-accent-foreground/10 text-accent-foreground">
                                        {quoteTypeLabels[quote.quote_type] || quote.quote_type}
                                    </span>
                                )}
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${impactBadgeColors[quote.impact_level] || impactBadgeColors.low}`}>
                                    {quote.impact_level}
                                </span>
                            </div>
                        </div>
                    );

                    if (hasLink) {
                        const timestamp = quote.start_time ? `#t=${Math.floor(quote.start_time)}` : '';
                        return (
                            <Link key={quote.id} href={`/transcripts/${quote.video_id}${timestamp}`} className="block">
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

// ─── Dashboard Variant ───────────────────────────────────────────────────────

interface DashboardQuotesListProps {
    variant: 'dashboard';
    quotes: DashboardQuote[];
}

function DashboardQuotesList({ quotes }: DashboardQuotesListProps) {
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
                            <Link key={quote.id} href={`/transcripts/${quote.video_id}${timestamp}`} className="block">
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

// ─── Unified Export ──────────────────────────────────────────────────────────

type QuotesListProps = ProfileQuotesListProps | DashboardQuotesListProps;

export default function QuotesList(props: QuotesListProps) {
    if (props.variant === 'profile') {
        return <ProfileQuotesList {...props} />;
    }
    return <DashboardQuotesList {...props} />;
}
