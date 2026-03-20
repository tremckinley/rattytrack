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
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                            📋 Meeting Summary
                        </h2>
                        <p className="text-gray-600 mt-1">
                            No AI summary available for this meeting yet.
                        </p>
                    </div>
                    <button
                        onClick={onGenerateSummary}
                        disabled={isGenerating}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${isGenerating
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
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
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    📋 Meeting Summary
                    {summary.is_approved && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            ✓ Verified
                        </span>
                    )}
                </h2>
                <span className="text-xs text-gray-500">
                    Generated {formatDate(summary.generated_at)}
                </span>
            </div>

            {/* Brief Summary */}
            <p className="text-gray-700 leading-relaxed mb-4">
                {summary.summary_text}
            </p>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-3 mb-4">
                {summary.key_points.length > 0 && (
                    <span className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                        {summary.key_points.length} Key Points
                    </span>
                )}
                {summary.decisions.length > 0 && (
                    <span className="text-sm bg-purple-50 text-purple-700 px-3 py-1 rounded-full">
                        {summary.decisions.length} Decisions
                    </span>
                )}
                {summary.votes_overview.length > 0 && (
                    <span className="text-sm bg-amber-50 text-amber-700 px-3 py-1 rounded-full">
                        {summary.votes_overview.length} Votes
                    </span>
                )}
            </div>

            {/* Expand/Collapse Button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
            >
                {isExpanded ? '▲ Hide Details' : '▼ Read Full Summary'}
            </button>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="mt-6 space-y-6 border-t border-gray-200 pt-6">
                    {/* Key Points */}
                    {summary.key_points.length > 0 && (
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                💡 Key Discussion Points
                            </h3>
                            <ul className="space-y-2">
                                {summary.key_points.map((point, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                        <span className="text-blue-500 mt-1">•</span>
                                        <span className="text-gray-700">{point}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Decisions */}
                    {summary.decisions.length > 0 && (
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                ✅ Decisions Made
                            </h3>
                            <ul className="space-y-2">
                                {summary.decisions.map((decision, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                        <span className="text-green-500 mt-1">✓</span>
                                        <span className="text-gray-700">{decision}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Votes Overview */}
                    {summary.votes_overview.length > 0 && (
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                🗳️ Voting Outcomes
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {summary.votes_overview.map((vote, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-2 rounded border border-gray-200"
                                    >
                                        <span className="text-gray-700 text-sm truncate flex-1 mr-2">
                                            {vote.item}
                                        </span>
                                        <span
                                            className={`text-xs font-bold px-2 py-0.5 rounded ${vote.result === 'passed'
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-red-500 text-white'
                                                }`}
                                        >
                                            {vote.result.toUpperCase()}
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
