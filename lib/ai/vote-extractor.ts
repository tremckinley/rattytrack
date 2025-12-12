// Vote Extraction Module
// Extracts explicit votes from meeting transcripts using diarization data

import type {
    VoteExtractionResult,
    RobertRulesEvent
} from '@/types/LegislatorIntelligence';
import { collectVoteResponses } from './robert-rules-parser';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    // Minimum confidence to record a vote (0.3 per user preference)
    MIN_VOTE_CONFIDENCE: 0.3,

    // Time window after "all in favor" to look for responses
    VOICE_VOTE_WINDOW_SECONDS: 15,

    // Time window for roll call votes
    ROLL_CALL_WINDOW_SECONDS: 120,

    // Patterns for detecting vote type
    UNANIMOUS_CONSENT_PATTERNS: [
        /without objection/i,
        /hearing no objection/i,
        /unanimous consent/i,
        /no objection/i
    ],

    ROLL_CALL_PATTERNS: [
        /roll call/i,
        /call the roll/i,
        /record(?:ed)? vote/i
    ]
};

// ============================================================================
// VOTE EXTRACTION
// ============================================================================

/**
 * Determine the type of vote from the vote call event
 */
function detectVoteType(
    voteCallEvent: RobertRulesEvent,
    followingText: string
): 'voice' | 'roll_call' | 'unanimous_consent' {
    const combinedText = voteCallEvent.triggerPhrase + ' ' + followingText;

    // Check for unanimous consent
    for (const pattern of CONFIG.UNANIMOUS_CONSENT_PATTERNS) {
        if (pattern.test(combinedText)) {
            return 'unanimous_consent';
        }
    }

    // Check for roll call
    for (const pattern of CONFIG.ROLL_CALL_PATTERNS) {
        if (pattern.test(combinedText)) {
            return 'roll_call';
        }
    }

    return 'voice';
}

/**
 * Convert vote response text to standardized vote value
 */
function parseVoteResponse(text: string): 'yes' | 'no' | 'abstain' | 'present' | null {
    const lowerText = text.toLowerCase();

    if (/\baye\b|\byes\b|\bi do\b|\bapprove\b/i.test(lowerText)) return 'yes';
    if (/\bnay\b|\bno\b|\boppose\b/i.test(lowerText)) return 'no';
    if (/\babstain\b/i.test(lowerText)) return 'abstain';
    if (/\bpresent\b/i.test(lowerText)) return 'present';

    return null;
}

/**
 * Determine vote result based on counts
 */
function determineResult(
    yesCount: number,
    noCount: number,
    requiredMajority: number = 0.5
): 'passed' | 'failed' | 'tabled' {
    const total = yesCount + noCount;
    if (total === 0) return 'tabled';

    const yesFraction = yesCount / total;
    return yesFraction > requiredMajority ? 'passed' : 'failed';
}

/**
 * Extract votes from a vote call event and following segments
 */
export function extractVotesFromEvent(
    voteCallEvent: RobertRulesEvent,
    allEvents: RobertRulesEvent[],
    segments: Array<{
        id: string;
        text: string;
        start_time_seconds: number;
        speaker_id?: string | null;
    }>,
    agendaItemId: string,
    billId?: string | null
): VoteExtractionResult {
    // Collect vote response events
    const responseEvents = collectVoteResponses(allEvents, voteCallEvent);

    // Also check segments directly for votes (may not have been detected as events)
    const voteWindowEnd = voteCallEvent.timestampSeconds +
        (detectVoteType(voteCallEvent, '') === 'roll_call'
            ? CONFIG.ROLL_CALL_WINDOW_SECONDS
            : CONFIG.VOICE_VOTE_WINDOW_SECONDS);

    const votingSegments = segments.filter(s =>
        s.start_time_seconds > voteCallEvent.timestampSeconds &&
        s.start_time_seconds <= voteWindowEnd
    );

    // Combine detected events with direct segment analysis
    const votes: VoteExtractionResult['votes'] = [];
    const processedSpeakers = new Set<string>();

    // First, process detected vote response events
    for (const event of responseEvents) {
        if (event.metadata?.voteValue && event.speakerId) {
            if (!processedSpeakers.has(event.speakerId)) {
                votes.push({
                    legislatorId: event.speakerId,
                    vote: event.metadata.voteValue === 'aye' ? 'yes' :
                        event.metadata.voteValue === 'nay' ? 'no' :
                            event.metadata.voteValue,
                    confidence: event.confidence,
                    segmentId: '' // Will need to match to segment
                });
                processedSpeakers.add(event.speakerId);
            }
        }
    }

    // Then, check segments directly for any missed votes
    for (const segment of votingSegments) {
        if (segment.speaker_id && !processedSpeakers.has(segment.speaker_id)) {
            const voteValue = parseVoteResponse(segment.text);
            if (voteValue && segment.text.trim().length < 50) { // Short responses only
                votes.push({
                    legislatorId: segment.speaker_id,
                    vote: voteValue,
                    confidence: 0.6, // Lower confidence for pattern-based detection
                    segmentId: segment.id
                });
                processedSpeakers.add(segment.speaker_id);
            }
        }
    }

    // Calculate totals
    const yesCount = votes.filter(v => v.vote === 'yes').length;
    const noCount = votes.filter(v => v.vote === 'no').length;
    const abstainCount = votes.filter(v => v.vote === 'abstain').length;

    // Get following text for vote type detection
    const followingTexts = votingSegments.map(s => s.text).join(' ');
    const voteType = detectVoteType(voteCallEvent, followingTexts);

    return {
        agendaItemId,
        billId: billId ?? undefined,
        voteType,
        votes,
        result: determineResult(yesCount, noCount),
        yesCount,
        noCount,
        abstainCount
    };
}

/**
 * Handle unanimous consent (implied all-yes votes)
 */
export function createUnanimousConsentResult(
    agendaItemId: string,
    attendeeIds: string[],
    billId?: string | null
): VoteExtractionResult {
    return {
        agendaItemId,
        billId: billId ?? undefined,
        voteType: 'unanimous_consent',
        votes: attendeeIds.map(id => ({
            legislatorId: id,
            vote: 'yes' as const,
            confidence: 0.9,
            segmentId: ''
        })),
        result: 'passed',
        yesCount: attendeeIds.length,
        noCount: 0,
        abstainCount: 0
    };
}

/**
 * Extract all votes from a meeting transcript
 */
export function extractAllVotes(
    events: RobertRulesEvent[],
    segments: Array<{
        id: string;
        text: string;
        start_time_seconds: number;
        speaker_id?: string | null;
    }>,
    agendaBoundaries: Array<{
        agendaItemId: string;
        startTimestamp: number;
        endTimestamp: number | null;
        billId?: string | null;
    }>
): VoteExtractionResult[] {
    const results: VoteExtractionResult[] = [];
    const voteCallEvents = events.filter(e => e.type === 'vote_call');

    for (const voteCall of voteCallEvents) {
        // Find which agenda item this vote belongs to
        const agendaItem = agendaBoundaries.find(b =>
            voteCall.timestampSeconds >= b.startTimestamp &&
            (b.endTimestamp === null || voteCall.timestampSeconds < b.endTimestamp)
        );

        if (agendaItem) {
            const result = extractVotesFromEvent(
                voteCall,
                events,
                segments,
                agendaItem.agendaItemId,
                agendaItem.billId
            );

            // Only include if we detected votes or it's a clear vote call
            if (result.votes.length > 0 || voteCall.confidence >= 0.8) {
                results.push(result);
            }
        }
    }

    return results;
}

// ============================================================================
// EXPORTS
// ============================================================================

export function getConfig() {
    return { ...CONFIG };
}

export function updateConfig(updates: Partial<typeof CONFIG>) {
    Object.assign(CONFIG, updates);
}
