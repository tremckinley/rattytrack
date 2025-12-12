// Position Aggregator
// Combines voting records and deliberation sentiment into legislator positions

import type {
    PositionAggregationResult,
    PositionValue,
    PositionSource,
    VoteExtractionResult
} from '@/types/LegislatorIntelligence';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    // Minimum confidence threshold (0.3 per user preference - favor recall over precision)
    MIN_CONFIDENCE: 0.3,

    // Sentiment thresholds for position inference
    STRONG_FOR_THRESHOLD: 0.4,
    WEAK_FOR_THRESHOLD: 0.2,
    NEUTRAL_THRESHOLD: 0.1,
    WEAK_AGAINST_THRESHOLD: -0.2,
    STRONG_AGAINST_THRESHOLD: -0.4,

    // Minimum segments required for deliberation-based position
    MIN_SEGMENTS_FOR_DELIBERATION: 1,

    // Weight for explicit votes vs deliberation
    VOTE_WEIGHT: 1.0,
    DELIBERATION_WEIGHT: 0.7
};

// ============================================================================
// POSITION INFERENCE
// ============================================================================

/**
 * Infer position from vote value
 */
function voteToPosition(vote: string): PositionValue {
    switch (vote) {
        case 'yes':
        case 'aye':
            return 'for';
        case 'no':
        case 'nay':
            return 'against';
        case 'abstain':
        case 'present':
            return 'neutral';
        default:
            return 'undecided';
    }
}

/**
 * Infer position from average sentiment score
 */
function sentimentToPosition(avgSentiment: number): { position: PositionValue; strength: number } {
    if (avgSentiment >= CONFIG.STRONG_FOR_THRESHOLD) {
        return { position: 'for', strength: Math.min(1, avgSentiment) };
    } else if (avgSentiment >= CONFIG.WEAK_FOR_THRESHOLD) {
        return { position: 'for', strength: avgSentiment / CONFIG.STRONG_FOR_THRESHOLD };
    } else if (avgSentiment > -CONFIG.NEUTRAL_THRESHOLD && avgSentiment < CONFIG.NEUTRAL_THRESHOLD) {
        return { position: 'neutral', strength: 0.5 };
    } else if (avgSentiment <= CONFIG.STRONG_AGAINST_THRESHOLD) {
        return { position: 'against', strength: Math.min(1, Math.abs(avgSentiment)) };
    } else if (avgSentiment <= CONFIG.WEAK_AGAINST_THRESHOLD) {
        return { position: 'against', strength: Math.abs(avgSentiment) / Math.abs(CONFIG.STRONG_AGAINST_THRESHOLD) };
    } else {
        return { position: 'undecided', strength: 0.3 };
    }
}

// ============================================================================
// AGGREGATION FUNCTIONS
// ============================================================================

/**
 * Create position from explicit vote
 */
export function positionFromVote(
    legislatorId: string,
    billId: string,
    agendaItemId: string | null,
    vote: VoteExtractionResult['votes'][0]
): PositionAggregationResult {
    return {
        legislatorId,
        billId,
        agendaItemId: agendaItemId ?? undefined,
        position: voteToPosition(vote.vote),
        positionStrength: 1.0, // Explicit votes are full strength
        source: 'explicit_vote',
        supportingSegmentIds: vote.segmentId ? [vote.segmentId] : [],
        confidence: Math.max(vote.confidence, CONFIG.MIN_CONFIDENCE),
        isFinal: true // Votes are final positions
    };
}

/**
 * Create position from motion making
 */
export function positionFromMotion(
    legislatorId: string,
    billId: string,
    agendaItemId: string | null,
    motionSegmentId: string,
    confidence: number
): PositionAggregationResult {
    return {
        legislatorId,
        billId,
        agendaItemId: agendaItemId ?? undefined,
        position: 'for', // Making a motion implies support
        positionStrength: 0.9,
        source: 'motion_made',
        supportingSegmentIds: [motionSegmentId],
        confidence: Math.max(confidence, CONFIG.MIN_CONFIDENCE),
        isFinal: false // Not final until voted
    };
}

/**
 * Create position from seconding a motion
 */
export function positionFromSecond(
    legislatorId: string,
    billId: string,
    agendaItemId: string | null,
    secondSegmentId: string,
    confidence: number
): PositionAggregationResult {
    return {
        legislatorId,
        billId,
        agendaItemId: agendaItemId ?? undefined,
        position: 'for', // Seconding implies at least procedural support
        positionStrength: 0.7,
        source: 'seconded',
        supportingSegmentIds: [secondSegmentId],
        confidence: Math.max(confidence, CONFIG.MIN_CONFIDENCE),
        isFinal: false
    };
}

/**
 * Create position from deliberation analysis (sentiment across segments)
 */
export function positionFromDeliberation(
    legislatorId: string,
    billId: string,
    agendaItemId: string | null,
    segments: Array<{
        id: string;
        sentiment_score: number | null;
    }>
): PositionAggregationResult | null {
    // Filter segments with sentiment scores
    const scoredSegments = segments.filter(s =>
        s.sentiment_score !== null && s.sentiment_score !== undefined
    );

    if (scoredSegments.length < CONFIG.MIN_SEGMENTS_FOR_DELIBERATION) {
        return null;
    }

    // Calculate average sentiment
    const avgSentiment = scoredSegments.reduce((sum, s) => sum + (s.sentiment_score ?? 0), 0)
        / scoredSegments.length;

    const { position, strength } = sentimentToPosition(avgSentiment);

    // Confidence increases with more segments
    const baseConfidence = 0.5;
    const segmentBonus = Math.min(0.3, scoredSegments.length * 0.05);
    const confidence = Math.min(1, baseConfidence + segmentBonus);

    // Skip if below threshold
    if (confidence < CONFIG.MIN_CONFIDENCE) {
        return null;
    }

    return {
        legislatorId,
        billId,
        agendaItemId: agendaItemId ?? undefined,
        position,
        positionStrength: strength,
        source: 'deliberation_analysis',
        supportingSegmentIds: scoredSegments.map(s => s.id),
        confidence,
        isFinal: false // Deliberation positions are not final
    };
}

/**
 * Aggregate all positions for a legislator on a bill
 * Combines multiple sources with appropriate weighting
 */
export function aggregatePositions(
    positions: PositionAggregationResult[]
): PositionAggregationResult | null {
    if (positions.length === 0) return null;

    // Separate by source type
    const votePositions = positions.filter(p => p.source === 'explicit_vote');
    const motionPositions = positions.filter(p => p.source === 'motion_made');
    const secondPositions = positions.filter(p => p.source === 'seconded');
    const deliberationPositions = positions.filter(p => p.source === 'deliberation_analysis');

    // If there's an explicit vote, that's the final answer
    if (votePositions.length > 0) {
        // Take the most recent/confident vote
        votePositions.sort((a, b) => b.confidence - a.confidence);
        return votePositions[0];
    }

    // Otherwise, combine all available evidence
    let forScore = 0;
    let againstScore = 0;
    let totalWeight = 0;

    const allNonVotePositions = [...motionPositions, ...secondPositions, ...deliberationPositions];

    for (const pos of allNonVotePositions) {
        const weight = pos.source === 'deliberation_analysis'
            ? CONFIG.DELIBERATION_WEIGHT
            : CONFIG.VOTE_WEIGHT;

        if (pos.position === 'for') {
            forScore += pos.positionStrength * pos.confidence * weight;
        } else if (pos.position === 'against') {
            againstScore += pos.positionStrength * pos.confidence * weight;
        }

        totalWeight += weight;
    }

    if (totalWeight === 0) return null;

    const normalizedFor = forScore / totalWeight;
    const normalizedAgainst = againstScore / totalWeight;

    let finalPosition: PositionValue;
    let finalStrength: number;

    if (normalizedFor > normalizedAgainst + 0.1) {
        finalPosition = 'for';
        finalStrength = normalizedFor;
    } else if (normalizedAgainst > normalizedFor + 0.1) {
        finalPosition = 'against';
        finalStrength = normalizedAgainst;
    } else if (normalizedFor > 0.3 || normalizedAgainst > 0.3) {
        finalPosition = 'undecided';
        finalStrength = 0.5;
    } else {
        finalPosition = 'neutral';
        finalStrength = 0.5;
    }

    // Combine all supporting segments
    const allSegments = allNonVotePositions.flatMap(p => p.supportingSegmentIds);
    const uniqueSegments = [...new Set(allSegments)];

    return {
        legislatorId: positions[0].legislatorId,
        billId: positions[0].billId,
        agendaItemId: positions[0].agendaItemId,
        position: finalPosition,
        positionStrength: finalStrength,
        source: deliberationPositions.length > 0 ? 'deliberation_analysis' :
            motionPositions.length > 0 ? 'motion_made' : 'seconded',
        supportingSegmentIds: uniqueSegments,
        confidence: Math.min(1, allNonVotePositions.reduce((sum, p) => sum + p.confidence, 0) / allNonVotePositions.length),
        isFinal: false
    };
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
