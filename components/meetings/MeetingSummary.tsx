'use client';

// MeetingSummary - Displays AI-generated summary at top of meeting page
// Shows brief summary with expandable section for key points, decisions, and votes

import { useState } from 'react';

interface MeetingSummaryProps {
    summary: {
        id: string;
        summary_text: string;
        key_points: string[];
        decisions: string[];
        votes_overview: Array<{
            item: string;
            result: 'passed' | 'failed';
        }>;
        generated_at: string;
        is_approved: boolean;
    } | null;
    videoId: string;
    onGenerateSummary?: () => Promise<void>;
    isGenerating?: boolean;
}

export default function MeetingSummary({
    summary,
    videoId,
    onGenerateSummary,
    isGenerating = false,
}: MeetingSummaryProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // If no summary exists and we can generate one
    if (!summary && onGenerateSummary) {
        return (
            <div className="card p-6 mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            📋 Meeting Summary
                        </h2>
                        <p className="mt-1 opacity-80">
                            No AI summary available for this meeting yet.
                        </p>
                    </div>
                    <button
                        onClick={onGenerateSummary}
                        disabled={isGenerating}
                        className={`px-4 py-2 font-bold transition-colors border border-foreground ${isGenerating
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : 'bg-capyred text-white hover:bg-rose-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                            }`}
                    >
                        {isGenerating ? (
                            <span className="flex items-center gap-2">
                                <span className="animate-spin">⏳</span>
                                Generating...
                            </span>
                        ) : (
                            '✨ Generate Summary'
                        )}
                    </button>
                </div>
            </div>
        );
    }

    // If no summary and no generator function, don't render anything
    if (!summary) {
        return null;
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="card p-6 mb-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4 pb-4 border-b border-foreground">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    📋 Executive Summary
                    {summary.is_approved && (
                        <span className="text-xs bg-green-100 text-green-800 border border-green-800 px-2 py-0.5 ml-2 font-bold uppercase tracking-wider shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                            Verified
                        </span>
                    )}
                </h2>
                <span className="text-xs opacity-70 font-mono">
                    Generated: {formatDate(summary.generated_at)}
                </span>
            </div>

            {/* Brief Summary */}
            <p className="text-base leading-relaxed mb-6 font-medium">
                {summary.summary_text}
            </p>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-4 mb-6">
                {summary.key_points.length > 0 && (
                    <span className="text-sm border-l-4 border-capyred pl-2 font-bold uppercase tracking-wider">
                        {summary.key_points.length} Key Points
                    </span>
                )}
                {summary.decisions.length > 0 && (
                    <span className="text-sm border-l-4 border-indigo-600 pl-2 font-bold uppercase tracking-wider">
                        {summary.decisions.length} Decisions
                    </span>
                )}
                {summary.votes_overview.length > 0 && (
                    <span className="text-sm border-l-4 border-amber-500 pl-2 font-bold uppercase tracking-wider">
                        {summary.votes_overview.length} Votes
                    </span>
                )}
            </div>

            {/* Expand/Collapse Button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-capyred hover:text-rose-900 font-bold text-sm flex items-center gap-1 uppercase tracking-wider"
            >
                {isExpanded ? '▲ Hide Details' : '▼ Read Full Summary'}
            </button>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="mt-8 space-y-8 border-t border-foreground pt-8 bg-gray-50 -mx-6 px-6 pb-6 border-b">
                    {/* Key Points */}
                    {summary.key_points.length > 0 && (
                        <div>
                            <h3 className="font-bold mb-4 flex items-center gap-2 uppercase tracking-wide border-b border-foreground pb-2">
                                💡 Key Discussion Points
                            </h3>
                            <ul className="space-y-3">
                                {summary.key_points.map((point, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 bg-capyred mt-2 flex-shrink-0"></div>
                                        <span className="leading-relaxed">{point}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Decisions */}
                    {summary.decisions.length > 0 && (
                        <div>
                            <h3 className="font-bold mb-4 flex items-center gap-2 uppercase tracking-wide border-b border-foreground pb-2">
                                ✅ Decisions Made
                            </h3>
                            <ul className="space-y-3">
                                {summary.decisions.map((decision, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 bg-indigo-600 mt-2 flex-shrink-0"></div>
                                        <span className="leading-relaxed">{decision}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Votes Overview */}
                    {summary.votes_overview.length > 0 && (
                        <div>
                            <h3 className="font-bold mb-4 flex items-center gap-2 uppercase tracking-wide border-b border-foreground pb-2">
                                🗳️ Voting Outcomes
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {summary.votes_overview.map((vote, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 border border-foreground bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform"
                                    >
                                        <span className="font-medium text-sm truncate flex-1 mr-3">
                                            {vote.item}
                                        </span>
                                        <span
                                            className={`text-xs font-bold px-2 py-1 uppercase tracking-wider border ${vote.result === 'passed'
                                                    ? 'bg-green-100 text-[#528148] border-[#528148]'
                                                    : 'bg-red-100 text-rose-900 border-rose-900'
                                                }`}
                                        >
                                            {vote.result}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
