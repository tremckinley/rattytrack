// Robert's Rules of Order Parser
// Detects procedural cues in civic meeting transcripts to segment by agenda item

import type {
    RobertRulesEvent,
    RobertRulesEventType,
    VoteValue,
    AgendaItemType
} from '@/types/LegislatorIntelligence';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    // Minimum confidence to emit an event (0.3 per user preference for low threshold)
    MIN_CONFIDENCE: 0.3,

    // Time window (seconds) to look for a "second" after a motion
    SECOND_WINDOW_SECONDS: 30,

    // Time window (seconds) to collect vote responses after a vote call
    VOTE_RESPONSE_WINDOW_SECONDS: 60,

    // Minimum word count for a segment to be analyzed
    MIN_WORDS: 3,

    // === CONSENT AGENDA DETECTION ===
    // Maximum gap between items to be considered "rapid-fire listing" (not actual discussion)
    RAPID_FIRE_MAX_GAP_SECONDS: 30,

    // Minimum duration (seconds) for an item to be considered actual discussion
    MIN_ITEM_DURATION_SECONDS: 45,

    // Maximum items in rapid succession to trigger "consent agenda listing" detection
    CONSENT_LISTING_THRESHOLD: 3
};

// ============================================================================
// DETECTION PATTERNS
// ============================================================================

interface PatternDefinition {
    patterns: RegExp[];
    confidence: number;  // Base confidence for this pattern type
    extract?: (match: RegExpMatchArray, text: string) => Record<string, any>;
}

const DETECTION_PATTERNS: Record<RobertRulesEventType, PatternDefinition> = {
    topic_transition: {
        patterns: [
            /moving (?:on )?to item (\d+)/i,
            /next on the agenda/i,
            /item number (\d+)/i,
            /let'?s proceed to/i,
            /turning to item/i,
            /moving to the next item/i,
            /agenda item (\d+)/i,
            /item (\d+)[,:]?\s+(.{10,50})/i,  // "Item 4, Budget Discussion"
            /we(?:'ll| will) now (?:move to|consider|discuss)/i
        ],
        confidence: 0.8,
        extract: (match, text) => {
            const itemNumber = match[1] ? parseInt(match[1], 10) : undefined;
            return { itemNumber };
        }
    },

    motion: {
        patterns: [
            /i (?:move|would move) (?:to|that)/i,
            /motion to (approve|deny|table|defer|adopt|accept|reject)/i,
            /i make a motion/i,
            /i(?:'d| would) like to (?:move|make a motion)/i,
            /move(?:d)? for (?:approval|adoption)/i,
            /i move we/i
        ],
        confidence: 0.85,
        extract: (match, text) => {
            // Try to extract what the motion is about
            const motionMatch = text.match(/motion to (\w+)/i);
            const motionDescription = motionMatch ? motionMatch[1] : undefined;
            return { motionDescription };
        }
    },

    second: {
        patterns: [
            /\bsecond(?:ed)?\b/i,
            /i(?:'ll| will) second (?:that|the motion)/i,
            /second(?:ed)? by/i
        ],
        confidence: 0.75,
        extract: () => ({})
    },

    vote_call: {
        patterns: [
            /all (?:those )?in favor/i,
            /roll call vote/i,
            /voice vote/i,
            /let'?s (?:take a|have a) vote/i,
            /we(?:'ll| will) now vote/i,
            /(?:please )?cast your vote/i,
            /voting is (?:now )?open/i,
            /all in favor say (?:aye|yes)/i,
            /those opposed/i
        ],
        confidence: 0.9,
        extract: () => ({})
    },

    vote_response: {
        patterns: [
            /\baye\b/i,
            /\bnay\b/i,
            /\babstain\b/i,
            /\bpresent\b/i,
            /\byes\b/i,
            /\bno\b/i,
            /i vote (?:aye|yes|no|nay|abstain)/i
        ],
        confidence: 0.7,
        extract: (match, text) => {
            let voteValue: VoteValue | undefined;
            const lowerText = text.toLowerCase();

            if (/\baye\b|\byes\b/i.test(lowerText)) voteValue = 'aye';
            else if (/\bnay\b|\bno\b/i.test(lowerText)) voteValue = 'nay';
            else if (/\babstain\b/i.test(lowerText)) voteValue = 'abstain';
            else if (/\bpresent\b/i.test(lowerText)) voteValue = 'present';

            return { voteValue };
        }
    },

    tabling: {
        patterns: [
            /motion to table/i,
            /(?:defer|postpone) (?:to|until) (?:the )?next (?:meeting|session)/i,
            /table(?:d)? (?:the|this) (?:item|motion|matter)/i,
            /lay on the table/i,
            /send (?:back )?to committee/i
        ],
        confidence: 0.85,
        extract: () => ({})
    },

    public_comment: {
        patterns: [
            /open(?:ing)? (?:for |the )?public comment/i,
            /(?:any )?public (?:input|testimony|comment)/i,
            /citizen(?:s')? comment/i,
            /hear from the public/i,
            /public hearing (?:is )?now open/i
        ],
        confidence: 0.8,
        extract: () => ({})
    },

    adjournment: {
        patterns: [
            /motion to adjourn/i,
            /meeting (?:is )?adjourned/i,
            /we(?:'re| are) adjourned/i,
            /adjourn(?:ed)? (?:at|the meeting)/i,
            /stand adjourned/i
        ],
        confidence: 0.95,
        extract: () => ({})
    }
};

// ============================================================================
// PARSER FUNCTIONS
// ============================================================================

/**
 * Parse a single transcript segment for Robert's Rules events
 */
export function parseSegment(
    text: string,
    timestampSeconds: number,
    speakerId?: string | null
): RobertRulesEvent[] {
    const events: RobertRulesEvent[] = [];

    // Skip very short segments
    const wordCount = text.trim().split(/\s+/).length;
    if (wordCount < CONFIG.MIN_WORDS) {
        return events;
    }

    // Check each pattern type
    for (const [eventType, definition] of Object.entries(DETECTION_PATTERNS)) {
        for (const pattern of definition.patterns) {
            const match = text.match(pattern);

            if (match) {
                const metadata = definition.extract ? definition.extract(match, text) : {};

                // Calculate confidence (base confidence adjusted by match quality)
                let confidence = definition.confidence;

                // Boost confidence for longer, more specific matches
                if (match[0].length > 20) confidence = Math.min(1, confidence + 0.05);

                // Reduce confidence for very short segments
                if (wordCount < 10) confidence = Math.max(CONFIG.MIN_CONFIDENCE, confidence - 0.1);

                if (confidence >= CONFIG.MIN_CONFIDENCE) {
                    events.push({
                        type: eventType as RobertRulesEventType,
                        confidence,
                        triggerPhrase: match[0],
                        timestampSeconds,
                        speakerId: speakerId ?? undefined,
                        metadata: Object.keys(metadata).length > 0 ? metadata : undefined
                    });
                }

                // Only match first pattern per type per segment
                break;
            }
        }
    }

    return events;
}

/**
 * Parse multiple segments and correlate events (e.g., motion + second)
 */
export function parseTranscript(
    segments: Array<{
        id: string;
        text: string;
        start_time_seconds: number;
        speaker_id?: string | null;
    }>
): RobertRulesEvent[] {
    const allEvents: RobertRulesEvent[] = [];

    for (const segment of segments) {
        const events = parseSegment(
            segment.text,
            segment.start_time_seconds,
            segment.speaker_id
        );
        allEvents.push(...events);
    }

    // Sort by timestamp
    allEvents.sort((a, b) => a.timestampSeconds - b.timestampSeconds);

    return allEvents;
}

/**
 * Detect agenda item boundaries from Robert's Rules events
 * Filters out rapid-fire item listings (consent agenda reading) and groups them
 */
export function detectAgendaItemBoundaries(
    events: RobertRulesEvent[]
): Array<{
    startTimestamp: number;
    endTimestamp: number | null;
    itemNumber?: number;
    itemType: AgendaItemType;
    triggerEvent: RobertRulesEvent;
}> {
    // Events that could start new agenda items
    const boundaryEvents = events.filter(e =>
        e.type === 'topic_transition' ||
        e.type === 'public_comment' ||
        e.type === 'adjournment'
    );

    if (boundaryEvents.length === 0) {
        return [];
    }

    // Step 1: Identify rapid-fire listing sequences (consent agenda reading)
    // These are consecutive topic transitions with very short gaps
    const rapidFireGroups: RobertRulesEvent[][] = [];
    let currentGroup: RobertRulesEvent[] = [];

    for (let i = 0; i < boundaryEvents.length; i++) {
        const event = boundaryEvents[i];
        const prevEvent = boundaryEvents[i - 1];

        // Check if this is part of a rapid-fire sequence
        if (event.type === 'topic_transition') {
            if (prevEvent &&
                prevEvent.type === 'topic_transition' &&
                event.timestampSeconds - prevEvent.timestampSeconds <= CONFIG.RAPID_FIRE_MAX_GAP_SECONDS) {
                // Continue current group
                if (currentGroup.length === 0) {
                    currentGroup.push(prevEvent); // Add the first item of the group
                }
                currentGroup.push(event);
            } else if (currentGroup.length > 0) {
                // End current group
                rapidFireGroups.push(currentGroup);
                currentGroup = [];
            }
        } else if (currentGroup.length > 0) {
            // Non-transition event ends the group
            rapidFireGroups.push(currentGroup);
            currentGroup = [];
        }
    }
    if (currentGroup.length > 0) {
        rapidFireGroups.push(currentGroup);
    }

    // Create a set of events to skip (rapid-fire items that are just being read)
    const skipEvents = new Set<RobertRulesEvent>();

    for (const group of rapidFireGroups) {
        if (group.length >= CONFIG.CONSENT_LISTING_THRESHOLD) {
            // This is a consent agenda listing - skip all individual items
            // They're just being read out, not actually discussed
            for (const event of group) {
                skipEvents.add(event);
            }
        }
    }

    // Step 2: Build boundaries, skipping rapid-fire listings
    const boundaries: Array<{
        startTimestamp: number;
        endTimestamp: number | null;
        itemNumber?: number;
        itemType: AgendaItemType;
        triggerEvent: RobertRulesEvent;
    }> = [];

    // Filter to non-skipped events
    const validBoundaryEvents = boundaryEvents.filter(e => !skipEvents.has(e));

    for (let i = 0; i < validBoundaryEvents.length; i++) {
        const event = validBoundaryEvents[i];
        const nextEvent = validBoundaryEvents[i + 1];

        // Calculate duration of this item
        const duration = nextEvent
            ? nextEvent.timestampSeconds - event.timestampSeconds
            : null;

        // Skip very short items (likely just announcements)
        if (duration !== null && duration < CONFIG.MIN_ITEM_DURATION_SECONDS) {
            continue;
        }

        let itemType: AgendaItemType = 'discussion';
        if (event.type === 'public_comment') itemType = 'public_hearing';
        if (event.type === 'adjournment') itemType = 'procedural';

        // Check if there's a vote in this item's time range
        const itemEndTime = nextEvent ? nextEvent.timestampSeconds : Infinity;
        const votesInRange = events.filter(e =>
            e.type === 'vote_call' &&
            e.timestampSeconds >= event.timestampSeconds &&
            e.timestampSeconds < itemEndTime
        );

        if (votesInRange.length > 0) {
            itemType = 'vote';
        }

        // Check if there's a motion in this item
        const motionsInRange = events.filter(e =>
            e.type === 'motion' &&
            e.timestampSeconds >= event.timestampSeconds &&
            e.timestampSeconds < itemEndTime
        );

        if (motionsInRange.length > 0 && itemType !== 'vote') {
            itemType = 'motion';
        }

        boundaries.push({
            startTimestamp: event.timestampSeconds,
            endTimestamp: nextEvent ? nextEvent.timestampSeconds : null,
            itemNumber: event.metadata?.itemNumber,
            itemType,
            triggerEvent: event
        });
    }

    // Step 3: Add a single "Consent Agenda" item for each rapid-fire group
    for (const group of rapidFireGroups) {
        if (group.length >= CONFIG.CONSENT_LISTING_THRESHOLD) {
            const firstEvent = group[0];
            const lastEvent = group[group.length - 1];

            // Find the next non-rapid-fire event after this group
            const groupEndTime = lastEvent.timestampSeconds;
            const nextNonGroupEvent = boundaryEvents.find(e =>
                e.timestampSeconds > groupEndTime && !skipEvents.has(e)
            );

            boundaries.push({
                startTimestamp: firstEvent.timestampSeconds,
                endTimestamp: nextNonGroupEvent?.timestampSeconds ?? null,
                itemNumber: undefined, // Consent agenda covers multiple items
                itemType: 'consent',
                triggerEvent: {
                    ...firstEvent,
                    triggerPhrase: `Consent Agenda (Items ${group.length} listed)`,
                    metadata: {
                        consentItemCount: group.length,
                        firstItemNumber: firstEvent.metadata?.itemNumber,
                        lastItemNumber: lastEvent.metadata?.itemNumber
                    }
                }
            });
        }
    }

    // Sort by start time
    boundaries.sort((a, b) => a.startTimestamp - b.startTimestamp);

    return boundaries;
}

/**
 * Correlate motion and second events
 */
export function correlateMotionSecond(
    events: RobertRulesEvent[]
): Array<{
    motion: RobertRulesEvent;
    second: RobertRulesEvent | null;
}> {
    const motions = events.filter(e => e.type === 'motion');
    const seconds = events.filter(e => e.type === 'second');

    return motions.map(motion => {
        // Find a second within the time window after this motion
        const matchingSecond = seconds.find(s =>
            s.timestampSeconds > motion.timestampSeconds &&
            s.timestampSeconds <= motion.timestampSeconds + CONFIG.SECOND_WINDOW_SECONDS
        );

        return {
            motion,
            second: matchingSecond || null
        };
    });
}

/**
 * Collect vote responses after a vote call
 */
export function collectVoteResponses(
    events: RobertRulesEvent[],
    voteCall: RobertRulesEvent
): RobertRulesEvent[] {
    return events.filter(e =>
        e.type === 'vote_response' &&
        e.timestampSeconds > voteCall.timestampSeconds &&
        e.timestampSeconds <= voteCall.timestampSeconds + CONFIG.VOTE_RESPONSE_WINDOW_SECONDS
    );
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
