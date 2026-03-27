// AgendaTimeline - Displays transcript organized by agenda items
// Collapsible sections showing segments grouped by agenda item

'use client';

import { useState } from 'react';
import type { AgendaItem } from '@/types/LegislatorIntelligence';
import type { TranscriptSegment } from '@/lib/types/transcription';

interface AgendaTimelineProps {
    agendaItems: AgendaItem[];
    segments: TranscriptSegment[];
    legislatorMap?: Record<string, { display_name: string }>;
    onTimestampClick?: (seconds: number) => void;
    currentTime?: number;
}

// Item type icons
const itemTypeIcons: Record<string, string> = {
    motion: '📋',
    consent: '✅',
    public_hearing: '🎤',
    discussion: '💬',
    vote: '🗳️',
    procedural: '⚙️'
};

// Status badges
const statusStyles: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-700',
    discussed: 'bg-blue-100 text-blue-700',
    voted: 'bg-green-100 text-green-700',
    tabled: 'bg-yellow-100 text-yellow-700',
    deferred: 'bg-orange-100 text-orange-700'
};

// Vote result badges
const voteResultStyles: Record<string, string> = {
    passed: 'bg-green-500 text-white',
    failed: 'bg-red-500 text-white'
};

/**
 * Format timestamp for display (e.g., "1:23:45")
 */
function formatTimestamp(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export default function AgendaTimeline({
    agendaItems,
    segments,
    legislatorMap = {},
    onTimestampClick,
    currentTime = 0
}: AgendaTimelineProps) {
    // Track expanded/collapsed state for each agenda item
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(
        agendaItems.map(item => item.id) // All expanded by default
    ));

    const toggleItem = (id: string) => {
        setExpandedItems(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const expandAll = () => setExpandedItems(new Set(agendaItems.map(item => item.id)));
    const collapseAll = () => setExpandedItems(new Set());

    // Group segments by agenda item
    const segmentsByAgendaItem = new Map<string, TranscriptSegment[]>();
    const unmatchedSegments: TranscriptSegment[] = [];

    for (const segment of segments) {
        const agendaItemId = (segment as any).agenda_item_id;
        if (agendaItemId) {
            if (!segmentsByAgendaItem.has(agendaItemId)) {
                segmentsByAgendaItem.set(agendaItemId, []);
            }
            segmentsByAgendaItem.get(agendaItemId)!.push(segment);
        } else {
            unmatchedSegments.push(segment);
        }
    }

    // Check if segment is active
    const isActiveSegment = (segment: TranscriptSegment): boolean => {
        return currentTime >= segment.start_time && currentTime < segment.end_time;
    };

    // Find which agenda item is currently active
    const activeAgendaItem = agendaItems.find(item => {
        const startTime = item.start_time ?? 0;
        const endTime = item.end_time ?? Infinity;
        return currentTime >= startTime && currentTime < endTime;
    });

    if (agendaItems.length === 0) {
        return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-yellow-800 text-sm">
                    📋 No agenda items detected for this meeting.
                    Run the intelligence pipeline to segment this transcript.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header controls */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    📋 Agenda Timeline
                    <span className="text-sm font-normal text-gray-500">
                        ({agendaItems.length} items)
                    </span>
                </h3>
                <div className="flex gap-2">
                    <button
                        onClick={expandAll}
                        className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                        Expand All
                    </button>
                    <button
                        onClick={collapseAll}
                        className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                        Collapse All
                    </button>
                </div>
            </div>

            {/* Agenda items */}
            <div className="space-y-2">
                {agendaItems.map((item) => {
                    const isExpanded = expandedItems.has(item.id);
                    const isActive = activeAgendaItem?.id === item.id;
                    const itemSegments = segmentsByAgendaItem.get(item.id) || [];
                    const icon = itemTypeIcons[item.item_type] || '📌';

                    return (
                        <div
                            key={item.id}
                            className={`border rounded-lg overflow-hidden transition-all ${isActive ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                                }`}
                        >
                            {/* Agenda item header */}
                            <button
                                onClick={() => toggleItem(item.id)}
                                className={`w-full flex items-center justify-between p-4 text-left transition-colors ${isActive ? 'bg-blue-50' : 'bg-gray-50 hover:bg-gray-100'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-lg">{icon}</span>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">
                                                {item.item_number}. {item.title}
                                            </span>
                                            {item.vote_result && (
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${voteResultStyles[item.vote_result] || ''
                                                    }`}>
                                                    {item.vote_result.toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                            {item.start_time !== null && item.start_time !== undefined && (
                                                <span
                                                    className="cursor-pointer hover:text-blue-600"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onTimestampClick?.(item.start_time!);
                                                    }}
                                                >
                                                    {formatTimestamp(item.start_time)}
                                                </span>
                                            )}
                                            {item.start_time !== null && item.end_time !== null && (
                                                <span>→</span>
                                            )}
                                            {item.end_time !== null && item.end_time !== undefined && (
                                                <span>{formatTimestamp(item.end_time)}</span>
                                            )}
                                            <span className={`px-1.5 py-0.5 rounded text-xs ${statusStyles[item.status] || statusStyles.pending
                                                }`}>
                                                {item.status}
                                            </span>
                                            <span className="text-gray-400">
                                                {itemSegments.length} segments
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <span className="text-gray-400">
                                    {isExpanded ? '▼' : '▶'}
                                </span>
                            </button>

                            {/* Collapsed segment content */}
                            {isExpanded && itemSegments.length > 0 && (
                                <div className="border-t border-gray-200 p-4 space-y-3 max-h-[400px] overflow-y-auto bg-white">
                                    {itemSegments.map((segment) => (
                                        <div
                                            key={segment.id}
                                            className={`group cursor-pointer p-2 rounded transition-colors ${isActiveSegment(segment)
                                                    ? 'bg-blue-50 border border-blue-200'
                                                    : 'hover:bg-gray-50'
                                                }`}
                                            onClick={() => onTimestampClick?.(segment.start_time)}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="flex-shrink-0 flex items-center gap-2">
                                                    <button
                                                        className={`font-mono text-xs px-2 py-1 rounded transition-colors ${isActiveSegment(segment)
                                                                ? 'bg-blue-600 text-white'
                                                                : 'bg-gray-200 text-gray-700 group-hover:bg-blue-600 group-hover:text-white'
                                                            }`}
                                                    >
                                                        {formatTimestamp(segment.start_time)}
                                                    </button>
                                                    {segment.speaker_name && (
                                                        <span
                                                            className={`text-xs px-2 py-1 font-medium ${isActiveSegment(segment)
                                                                    ? 'bg-purple-100 text-purple-700'
                                                                    : 'bg-gray-100 text-gray-600'
                                                                }`}
                                                        >
                                                            {segment.speaker_id && legislatorMap[segment.speaker_id]
                                                                ? legislatorMap[segment.speaker_id].display_name
                                                                : segment.speaker_name}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className={`text-sm leading-relaxed ${isActiveSegment(segment) ? 'text-gray-900 font-medium' : 'text-gray-700'
                                                    }`}>
                                                    {segment.text}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Empty state */}
                            {isExpanded && itemSegments.length === 0 && (
                                <div className="border-t border-gray-200 p-4 text-center text-gray-500 text-sm bg-white">
                                    No segments linked to this agenda item
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Unmatched segments section */}
                {unmatchedSegments.length > 0 && (
                    <div className="border rounded-lg border-dashed border-gray-300 overflow-hidden">
                        <div className="p-4 bg-gray-50">
                            <span className="text-gray-500 text-sm">
                                📎 {unmatchedSegments.length} segments not linked to agenda items
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
