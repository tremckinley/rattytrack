'use client';

/**
 * VotingRecordsCard - Displays legislator voting history
 * Shows how they voted on key bills with filtering options
 */

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faXmark, faMinus, faUserSlash, faFilter, faStar } from '@fortawesome/free-solid-svg-icons';

export interface VoteRecord {
    id: string;
    billNumber: string;
    billTitle: string;
    billDescription?: string;
    vote: 'yes' | 'no' | 'abstain' | 'absent';
    voteDate: string;
    billStatus: 'passed' | 'failed' | 'pending' | 'tabled';
    issueCategory?: string;
    isKeyVote?: boolean;
}

interface VotingRecordsCardProps {
    votes: VoteRecord[];
    maxVotes?: number;
}

const voteConfig = {
    yes: {
        icon: faCheck,
        label: 'Yes',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        textColor: 'text-green-700 dark:text-green-300',
        borderColor: 'border-green-500',
    },
    no: {
        icon: faXmark,
        label: 'No',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        textColor: 'text-red-700 dark:text-red-300',
        borderColor: 'border-red-500',
    },
    abstain: {
        icon: faMinus,
        label: 'Abstain',
        bgColor: 'bg-gray-100 dark:bg-gray-800',
        textColor: 'text-gray-700 dark:text-gray-300',
        borderColor: 'border-gray-400',
    },
    absent: {
        icon: faUserSlash,
        label: 'Absent',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
        textColor: 'text-yellow-700 dark:text-yellow-300',
        borderColor: 'border-yellow-500',
    },
};

const statusColors: Record<string, string> = {
    passed: 'bg-green-50 text-green-700 dark:bg-green-900/50 dark:text-green-300',
    failed: 'bg-red-50 text-red-700 dark:bg-red-900/50 dark:text-red-300',
    pending: 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    tabled: 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

const formatIssueName = (name: string) => {
    return name
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

export default function VotingRecordsCard({ votes, maxVotes = 10 }: VotingRecordsCardProps) {
    const [filter, setFilter] = useState<string>('all');
    const [showKeyOnly, setShowKeyOnly] = useState(false);

    if (!votes || votes.length === 0) {
        return (
            <div className="card">
                <h2 className="text-lg font-bold mb-4">Voting Record</h2>
                <p className="text-gray-500">No voting records available.</p>
            </div>
        );
    }

    // Get unique issue categories
    const issueCategories = [...new Set(votes.filter(v => v.issueCategory).map(v => v.issueCategory!))];

    // Apply filters
    let filteredVotes = votes;
    if (filter !== 'all') {
        filteredVotes = filteredVotes.filter(v => v.issueCategory === filter);
    }
    if (showKeyOnly) {
        filteredVotes = filteredVotes.filter(v => v.isKeyVote);
    }

    const displayVotes = filteredVotes.slice(0, maxVotes);

    // Calculate summary
    const yesCount = votes.filter(v => v.vote === 'yes').length;
    const noCount = votes.filter(v => v.vote === 'no').length;
    const abstainCount = votes.filter(v => v.vote === 'abstain').length;
    const absentCount = votes.filter(v => v.vote === 'absent').length;

    return (
        <div className="card">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Voting Record</h2>

                {/* Summary badges */}
                <div className="flex gap-2 text-xs">
                    <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 rounded-full">
                        {yesCount} Yes
                    </span>
                    <span className="px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 rounded-full">
                        {noCount} No
                    </span>
                    {abstainCount > 0 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded-full">
                            {abstainCount} Abstain
                        </span>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
                <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faFilter} className="text-gray-400 text-sm" />
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    >
                        <option value="all">All Issues</option>
                        {issueCategories.map(cat => (
                            <option key={cat} value={cat}>{formatIssueName(cat)}</option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={() => setShowKeyOnly(!showKeyOnly)}
                    className={`flex items-center gap-1 text-sm px-3 py-1 rounded-full transition-colors ${showKeyOnly
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}
                >
                    <FontAwesomeIcon icon={faStar} className="text-xs" />
                    Key Votes
                </button>
            </div>

            {/* Vote list */}
            <div className="space-y-3">
                {displayVotes.map((vote) => {
                    const config = voteConfig[vote.vote];

                    return (
                        <div
                            key={vote.id}
                            className={`border-l-4 ${config.borderColor} pl-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-mono text-gray-500">{vote.billNumber}</span>
                                        {vote.isKeyVote && (
                                            <FontAwesomeIcon icon={faStar} className="text-amber-500 text-xs" />
                                        )}
                                        <span className={`text-xs px-1.5 py-0.5 rounded ${statusColors[vote.billStatus]}`}>
                                            {vote.billStatus.charAt(0).toUpperCase() + vote.billStatus.slice(1)}
                                        </span>
                                    </div>
                                    <p className="text-sm font-medium text-foreground line-clamp-2">
                                        {vote.billTitle}
                                    </p>
                                    {vote.billDescription && (
                                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                                            {vote.billDescription}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                        <span>{new Date(vote.voteDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                        {vote.issueCategory && (
                                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
                                                {formatIssueName(vote.issueCategory)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Vote badge */}
                                <div className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full ${config.bgColor} ${config.textColor}`}>
                                    <FontAwesomeIcon icon={config.icon} className="text-sm" />
                                    <span className="text-sm font-medium">{config.label}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredVotes.length > maxVotes && (
                <p className="text-center text-sm text-gray-500 mt-4">
                    Showing {displayVotes.length} of {filteredVotes.length} votes
                </p>
            )}
        </div>
    );
}
