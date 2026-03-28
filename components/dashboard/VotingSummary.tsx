'use client';

// VotingSummary - Displays a summary of all votes taken during a meeting
// Shows pass/fail outcomes and individual legislator votes when available

import { useState, useMemo } from 'react';
import type { AgendaItem } from '@/types/LegislatorIntelligence';

interface VotingSummaryProps {
    agendaItems: AgendaItem[];
    legislatorVotes?: Array<{
        agendaItemId: string;
        legislatorId: string;
        legislatorName: string;
        vote: 'yes' | 'no' | 'abstain' | 'absent' | 'present';
    }>;
    legislators?: Array<{
        id: string;
        display_name: string;
    }>;
}

// Vote styling
const voteStyles = {
    yes: 'bg-green-100 text-[#528148] border-[#528148]',
    no: 'bg-red-100 text-rose-900 border-rose-900',
    abstain: 'bg-gray-100 text-gray-700 border-gray-700',
    absent: 'bg-yellow-50 text-yellow-800 border-yellow-800',
    present: 'bg-blue-50 text-indigo-800 border-indigo-800',
};

const resultStyles = {
    passed: 'bg-green-100 text-[#528148] border-[#528148]',
    failed: 'bg-red-100 text-rose-900 border-rose-900',
};

export default function VotingSummary({
    agendaItems,
    legislatorVotes = [],
    legislators = [],
}: VotingSummaryProps) {
    const [filterLegislatorId, setFilterLegislatorId] = useState<string | null>(null);
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

    // Filter agenda items that have votes
    const votedItems = useMemo(() => {
        return agendaItems.filter(item => item.vote_result);
    }, [agendaItems]);

    // Group legislator votes by agenda item
    const votesByItem = useMemo(() => {
        const grouped: Record<string, typeof legislatorVotes> = {};
        for (const vote of legislatorVotes) {
            if (!grouped[vote.agendaItemId]) {
                grouped[vote.agendaItemId] = [];
            }
            grouped[vote.agendaItemId].push(vote);
        }
        return grouped;
    }, [legislatorVotes]);

    // Filter votes by selected legislator
    const filteredVotes = useMemo(() => {
        if (!filterLegislatorId) return votesByItem;

        const filtered: Record<string, typeof legislatorVotes> = {};
        for (const [itemId, votes] of Object.entries(votesByItem)) {
            const filteredItemVotes = votes.filter(v => v.legislatorId === filterLegislatorId);
            if (filteredItemVotes.length > 0) {
                filtered[itemId] = filteredItemVotes;
            }
        }
        return filtered;
    }, [votesByItem, filterLegislatorId]);

    // Toggle expanded state for an item
    const toggleExpanded = (itemId: string) => {
        setExpandedItems(prev => {
            const next = new Set(prev);
            if (next.has(itemId)) {
                next.delete(itemId);
            } else {
                next.add(itemId);
            }
            return next;
        });
    };

    // Calculate vote tallies
    const getVoteTally = (itemId: string) => {
        const votes = votesByItem[itemId] || [];
        return {
            yes: votes.filter(v => v.vote === 'yes').length,
            no: votes.filter(v => v.vote === 'no').length,
            abstain: votes.filter(v => v.vote === 'abstain').length,
        };
    };

    if (votedItems.length === 0) {
        return null;
    }

    return (
        <div className="card p-6 mb-6">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-foreground">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    🗳️ Voting Summary
                </h2>
                <div className="flex items-center gap-4">
                    <span className="text-sm font-mono opacity-80 uppercase tracking-widest hidden sm:inline-block">
                        {votedItems.filter(i => i.vote_result === 'passed').length} passed,{' '}
                        {votedItems.filter(i => i.vote_result === 'failed').length} failed
                    </span>
                    {legislators.length > 0 && (
                        <select
                            value={filterLegislatorId || ''}
                            onChange={(e) => setFilterLegislatorId(e.target.value || null)}
                            className="text-sm border border-foreground bg-white text-foreground px-3 py-1.5 focus:ring-0 focus:outline-none focus:border-capyred shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer appearance-none"
                        >
                            <option value="">All Legislators</option>
                            {legislators.map(leg => (
                                <option key={leg.id} value={leg.id}>
                                    {leg.display_name}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            {/* Vote Summary Cards */}
            <div className="space-y-3">
                {votedItems.map(item => {
                    const itemVotes = filteredVotes[item.id] || [];
                    const tally = getVoteTally(item.id);
                    const isExpanded = expandedItems.has(item.id);
                    const hasDetailedVotes = itemVotes.length > 0;

                    return (
                        <div
                            key={item.id}
                            className="border border-foreground bg-white mb-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform"
                        >
                            {/* Vote Header */}
                            <button
                                onClick={() => hasDetailedVotes && toggleExpanded(item.id)}
                                className={`w-full flex items-center justify-between p-4 text-left ${hasDetailedVotes ? 'hover:bg-gray-50 cursor-pointer' : ''
                                    } transition-colors`}
                                disabled={!hasDetailedVotes}
                            >
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <span className={`text-xs font-bold px-2 py-1 uppercase tracking-wider border ${resultStyles[item.vote_result!] || 'bg-gray-200 text-gray-700 border-gray-700'
                                        }`}>
                                        {item.vote_result}
                                    </span>
                                    <span className="text-sm font-bold truncate">
                                        {item.title}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 border-l border-foreground pl-4 ml-4">
                                    {tally.yes > 0 || tally.no > 0 ? (
                                        <span className="text-sm font-mono flex items-center gap-2">
                                            <span className="text-[#528148] font-bold px-1">{tally.yes} YEA</span>
                                            <span className="text-foreground opacity-30">|</span>
                                            <span className="text-rose-900 font-bold px-1">{tally.no} NAY</span>
                                            {tally.abstain > 0 && (
                                                <span className="opacity-60 text-xs ml-1">({tally.abstain} ABS)</span>
                                            )}
                                        </span>
                                    ) : null}
                                    {hasDetailedVotes && (
                                        <span className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''
                                            }`}>
                                            ▼
                                        </span>
                                    )}
                                </div>
                            </button>

                            {/* Expanded Vote Details */}
                            {isExpanded && hasDetailedVotes && (
                                <div className="border-t border-foreground bg-gray-50 p-4">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                        {itemVotes
                                            .sort((a, b) => a.legislatorName.localeCompare(b.legislatorName))
                                            .map(vote => (
                                                <div
                                                    key={`${item.id}-${vote.legislatorId}`}
                                                    className={`text-xs px-2 py-1.5 border font-bold uppercase tracking-wide flex justify-between ${voteStyles[vote.vote]
                                                        }`}
                                                >
                                                    <span className="truncate mr-2">{vote.legislatorName.split(' ').pop()}</span>
                                                    <span className="opacity-80">
                                                        {vote.vote === 'yes' ? 'YEA' : vote.vote === 'no' ? 'NAY' : vote.vote.substring(0,3)}
                                                    </span>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* No votes message when filtered */}
            {filterLegislatorId && votedItems.every(item => !(filteredVotes[item.id]?.length)) && (
                <p className="text-center text-gray-500 py-4 mt-4">
                    No votes found for the selected legislator.
                </p>
            )}
        </div>
    );
}
