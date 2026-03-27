'use client';

/**
 * IssueSpeakingDashboard - Shows what issues a legislator speaks on
 * with expandable sections containing relevant quotes/statements
 */

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronRight, faQuoteLeft, faArrowUp, faArrowDown, faMinus } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';

export interface IssueStatement {
    id: string;
    text: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    videoId?: string;
    videoTitle?: string;
    timestamp?: number;
    date?: string;
}

export interface IssueCategory {
    issueId: string;
    issueName: string;
    totalMentions: number;
    positiveMentions: number;
    negativeMentions: number;
    neutralMentions: number;
    speakingTimeSeconds: number;
    statements: IssueStatement[];
}

interface IssueSpeakingDashboardProps {
    issues: IssueCategory[];
    maxStatementsPerIssue?: number;
}

const formatIssueName = (name: string) => {
    return name
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    return `${mins}m`;
};

const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const sentimentConfig = {
    positive: { icon: faArrowUp, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
    negative: { icon: faArrowDown, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
    neutral: { icon: faMinus, color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-800' },
};

// Generate mock statements for demo purposes
function generateMockStatements(issueName: string): IssueStatement[] {
    const mockStatements: Record<string, IssueStatement[]> = {
        budget: [
            { id: '1', text: "We need to prioritize funding for essential services while being fiscally responsible to our taxpayers.", sentiment: 'positive', videoTitle: 'Budget Committee Meeting', date: '2024-06-15' },
            { id: '2', text: "I'm concerned about the proposed cuts to public works - these services affect every resident.", sentiment: 'negative', videoTitle: 'City Council Regular Session', date: '2024-05-20' },
        ],
        housing: [
            { id: '3', text: "Affordable housing is the most pressing issue facing our community right now.", sentiment: 'positive', videoTitle: 'Housing Committee', date: '2024-05-10' },
            { id: '4', text: "We must balance development with preserving neighborhood character.", sentiment: 'neutral', videoTitle: 'Planning Commission', date: '2024-04-25' },
        ],
        public_safety: [
            { id: '5', text: "Community policing is essential - we need officers who know our neighborhoods.", sentiment: 'positive', videoTitle: 'Public Safety Committee', date: '2024-04-15' },
            { id: '6', text: "The body camera policy will increase transparency and accountability.", sentiment: 'positive', videoTitle: 'City Council Session', date: '2024-03-28' },
        ],
        infrastructure: [
            { id: '7', text: "Our roads and bridges need immediate attention before they become safety hazards.", sentiment: 'negative', videoTitle: 'Infrastructure Committee', date: '2024-03-15' },
        ],
        environment: [
            { id: '8', text: "We have a responsibility to future generations to address climate change now.", sentiment: 'positive', videoTitle: 'Special Session', date: '2024-02-20' },
        ],
    };

    return mockStatements[issueName.toLowerCase()] || [
        { id: 'default', text: `Discussion about ${formatIssueName(issueName)} and its impact on our community.`, sentiment: 'neutral' as const, videoTitle: 'Council Meeting', date: '2024-01-15' },
    ];
}

export default function IssueSpeakingDashboard({
    issues,
    maxStatementsPerIssue = 3
}: IssueSpeakingDashboardProps) {
    const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set());

    // Enhance issues with mock statements if empty
    const enhancedIssues = issues.map(issue => ({
        ...issue,
        statements: issue.statements.length > 0
            ? issue.statements
            : generateMockStatements(issue.issueName),
    }));

    if (!enhancedIssues || enhancedIssues.length === 0) {
        return (
            <div className="card">
                <h2 className="text-lg font-bold mb-4">Issue Focus Areas</h2>
                <p className="text-gray-500">No issue speaking data available.</p>
            </div>
        );
    }

    const toggleIssue = (issueId: string) => {
        setExpandedIssues(prev => {
            const next = new Set(prev);
            if (next.has(issueId)) {
                next.delete(issueId);
            } else {
                next.add(issueId);
            }
            return next;
        });
    };

    const maxMentions = Math.max(...enhancedIssues.map(i => i.totalMentions));

    return (
        <div className="card">
            <h2 className="text-lg font-bold mb-4">Issue Focus Areas</h2>
            <p className="text-xs text-gray-500 mb-4">
                Click an issue to see relevant statements
            </p>

            <div className="space-y-2">
                {enhancedIssues.map((issue) => {
                    const isExpanded = expandedIssues.has(issue.issueId);
                    const percentage = maxMentions > 0 ? (issue.totalMentions / maxMentions) * 100 : 0;

                    // Calculate sentiment distribution
                    const total = issue.totalMentions || 1;
                    const posPercent = Math.round((issue.positiveMentions / total) * 100);
                    const negPercent = Math.round((issue.negativeMentions / total) * 100);

                    return (
                        <div key={issue.issueId} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                            {/* Issue Header - Clickable */}
                            <button
                                onClick={() => toggleIssue(issue.issueId)}
                                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <FontAwesomeIcon
                                        icon={isExpanded ? faChevronDown : faChevronRight}
                                        className="text-gray-400 text-sm w-3"
                                    />
                                    <div className="text-left">
                                        <span className="font-medium text-foreground">
                                            {formatIssueName(issue.issueName)}
                                        </span>
                                        <div className="flex gap-2 mt-0.5 text-xs">
                                            <span className="text-green-600">↑{posPercent}%</span>
                                            <span className="text-red-600">↓{negPercent}%</span>
                                            {issue.speakingTimeSeconds > 0 && (
                                                <span className="text-gray-500">
                                                    {formatTime(issue.speakingTimeSeconds)} speaking
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    {/* Mini progress bar */}
                                    <div className="w-20 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-capyred rounded-full transition-all"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                    <span className="text-sm text-gray-600 w-16 text-right">
                                        {issue.totalMentions} mentions
                                    </span>
                                </div>
                            </button>

                            {/* Expanded Content - Statements */}
                            {isExpanded && (
                                <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 px-4 py-3">
                                    <div className="space-y-3">
                                        {issue.statements.slice(0, maxStatementsPerIssue).map((statement) => {
                                            const config = sentimentConfig[statement.sentiment];

                                            return (
                                                <div
                                                    key={statement.id}
                                                    className={`${config.bg} rounded-lg p-3 border-l-3 ${statement.sentiment === 'positive' ? 'border-l-green-500' : statement.sentiment === 'negative' ? 'border-l-red-500' : 'border-l-gray-400'}`}
                                                >
                                                    <div className="flex items-start gap-2">
                                                        <FontAwesomeIcon
                                                            icon={faQuoteLeft}
                                                            className="text-gray-300 dark:text-gray-600 mt-1 text-sm"
                                                        />
                                                        <div className="flex-1">
                                                            <p className="text-sm text-foreground">
                                                                {statement.text}
                                                            </p>
                                                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                                                <FontAwesomeIcon icon={config.icon} className={config.color} />
                                                                {statement.videoTitle && (
                                                                    <span>{statement.videoTitle}</span>
                                                                )}
                                                                {statement.date && (
                                                                    <span>{new Date(statement.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                                                )}
                                                                {statement.videoId && (
                                                                    <Link
                                                                        href={`/meetings/${statement.videoId}${statement.timestamp ? `#t=${statement.timestamp}` : ''}`}
                                                                        className="text-blue-600 hover:underline"
                                                                    >
                                                                        View in transcript →
                                                                    </Link>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {issue.statements.length > maxStatementsPerIssue && (
                                            <p className="text-xs text-gray-500 text-center">
                                                + {issue.statements.length - maxStatementsPerIssue} more statements
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
