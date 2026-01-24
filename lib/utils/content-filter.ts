/**
 * Content filter for identifying and filtering procedural/irrelevant transcript content
 * Keeps only substantive policy discussions for legislator profiles
 */

// Patterns that identify procedural/roll call content
const PROCEDURAL_PATTERNS = [
    // Roll call responses (single word or very short)
    /^(here|present|aye|yes|no|abstain|absent)\.?$/i,
    /^(here|present)\.?$/i,

    // Short affirmations/responses
    /^(thank you|thanks)\.?$/i,
    /^(okay|ok|alright|right)\.?$/i,
    /^(yes|no|yeah|nope|yep)\.?$/i,

    // Procedural motions
    /\bmotion\s+to\s+(adjourn|recess|table|postpone)\b/i,
    /\bsecond\s+(the\s+)?motion\b/i,
    /\bmove\s+to\s+adjourn\b/i,
    /\bcall\s+(the\s+)?roll\b/i,
    /\ball\s+in\s+favor\b/i,
    /\bopposed\s+say\s+(nay|no)\b/i,

    // Meeting procedural
    /\bmeeting\s+(is\s+)?(adjourned|recessed)\b/i,
    /\bcome\s+to\s+order\b/i,
    /\bquorum\s+(is\s+)?present\b/i,
];

// Minimum content length for substantive comments
const MIN_SUBSTANTIVE_LENGTH = 50;

// Patterns that indicate substantive content (should NOT be filtered)
const SUBSTANTIVE_PATTERNS = [
    /\b(believe|think|propose|recommend|suggest)\b/i,
    /\b(budget|funding|tax|revenue)\b/i,
    /\b(ordinance|resolution|amendment)\b/i,
    /\b(community|residents|citizens|neighbors)\b/i,
    /\b(safety|crime|police|fire)\b/i,
    /\b(development|housing|infrastructure)\b/i,
    /\b(education|schools|students)\b/i,
    /\b(health|hospital|medical)\b/i,
    /\b(environment|climate|sustainability)\b/i,
];

export interface TranscriptSegment {
    id?: string;
    text: string;
    speaker_id?: string | null;
    speaker_name?: string | null;
    start_time?: number;
    end_time?: number;
}

/**
 * Check if a text segment is procedural/irrelevant content
 */
export function isProceduralContent(text: string): boolean {
    const trimmed = text.trim();

    // Very short responses are likely procedural
    if (trimmed.length < 20) {
        // Check if it matches roll call patterns
        for (const pattern of PROCEDURAL_PATTERNS.slice(0, 5)) {
            if (pattern.test(trimmed)) {
                return true;
            }
        }
    }

    // Check against all procedural patterns
    for (const pattern of PROCEDURAL_PATTERNS) {
        if (pattern.test(trimmed)) {
            // But if it also contains substantive content, keep it
            if (trimmed.length > MIN_SUBSTANTIVE_LENGTH) {
                for (const subPattern of SUBSTANTIVE_PATTERNS) {
                    if (subPattern.test(trimmed)) {
                        return false;
                    }
                }
            }
            return true;
        }
    }

    return false;
}

/**
 * Check if content is substantive enough to display
 */
export function isSubstantiveContent(text: string): boolean {
    const trimmed = text.trim();

    // Must meet minimum length
    if (trimmed.length < MIN_SUBSTANTIVE_LENGTH) {
        return false;
    }

    // Check if it's procedural
    if (isProceduralContent(trimmed)) {
        return false;
    }

    // Bonus: check for substantive patterns
    for (const pattern of SUBSTANTIVE_PATTERNS) {
        if (pattern.test(trimmed)) {
            return true;
        }
    }

    // Even without keyword matches, long enough content passes
    return trimmed.length >= 100;
}

/**
 * Filter transcript segments to only include relevant, substantive content
 */
export function filterRelevantSegments<T extends TranscriptSegment>(segments: T[]): T[] {
    return segments.filter(segment => isSubstantiveContent(segment.text));
}

/**
 * Get relevance score for content (0-1)
 * Higher score = more relevant/substantive
 */
export function getRelevanceScore(text: string): number {
    const trimmed = text.trim();

    // Base score on length
    let score = Math.min(trimmed.length / 500, 0.5);

    // Penalize procedural content
    if (isProceduralContent(trimmed)) {
        return 0;
    }

    // Bonus for substantive patterns
    let patternMatches = 0;
    for (const pattern of SUBSTANTIVE_PATTERNS) {
        if (pattern.test(trimmed)) {
            patternMatches++;
        }
    }

    score += Math.min(patternMatches * 0.1, 0.5);

    return Math.min(score, 1);
}
