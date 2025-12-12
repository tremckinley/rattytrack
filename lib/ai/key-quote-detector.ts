// Key Quote Detector
// Identifies high-impact quotes from legislator speech for profile display

import type {
    QuoteDetectionResult,
    QuoteImpactLevel,
    QuoteType
} from '@/types/LegislatorIntelligence';
import type { SentimentAnalysis } from './transcript-analyzer';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    // Minimum confidence to extract a quote (0.3 per user preference)
    MIN_CONFIDENCE: 0.3,

    // Sentiment thresholds for impact classification
    SENTIMENT_CRITICAL_THRESHOLD: 0.8,
    SENTIMENT_HIGH_THRESHOLD: 0.6,
    SENTIMENT_MEDIUM_THRESHOLD: 0.4,

    // Optimal quote length range (words)
    MIN_QUOTE_WORDS: 10,
    MAX_QUOTE_WORDS: 75,
    IDEAL_MIN_WORDS: 15,
    IDEAL_MAX_WORDS: 50,

    // Context capture (sentences)
    CONTEXT_SENTENCES: 2
};

// ============================================================================
// CONTROVERSIAL KEYWORD DETECTION
// ============================================================================

const CONTROVERSIAL_KEYWORDS = {
    critical: [
        // Profanity and offensive terms
        /\b(damn|hell|crap)\b/i,
        /what the \w+/i,

        // Extreme accusations
        /\b(corrupt|criminal|fraud|lie|liar|stealing|theft)\b/i,
        /\b(rape|raping|assault)\b/i, // Per user example

        // Personal attacks
        /\b(incompetent|idiot|fool|stupid)\b/i,

        // Legal threats
        /\b(lawsuit|sue|legal action)\b/i
    ],

    high: [
        // Strong disagreement
        /\b(absolutely not|never|refuse|reject|oppose strongly)\b/i,
        /\b(unacceptable|outrageous|disgraceful|shameful)\b/i,

        // Dramatic language
        /\b(disaster|catastrophe|crisis|emergency|tragedy)\b/i,

        // Dismissive
        /\b(waste of time|pointless|ridiculous|absurd)\b/i
    ],

    medium: [
        // Moderate opposition
        /\b(disagree|concerned|worried|disappointed)\b/i,
        /\b(problematic|troubling|questionable)\b/i,

        // Policy critique
        /\b(ineffective|inefficient|wasteful)\b/i
    ]
};

// ============================================================================
// STANCE DETECTION PATTERNS
// ============================================================================

const STANCE_PATTERNS = {
    strong_for: [
        /i (?:strongly |fully )?support/i,
        /i (?:am |'m )?in favor/i,
        /this is (?:exactly )?what we need/i,
        /i (?:will |'ll )?vote (?:yes|aye)/i,
        /i believe (?:in |this is)/i
    ],

    strong_against: [
        /i (?:strongly |firmly )?oppose/i,
        /i (?:am |'m )?against/i,
        /i (?:will |'ll )?vote (?:no|nay)/i,
        /i cannot (?:support|vote for)/i,
        /this is (?:wrong|a mistake)/i
    ],

    emotional: [
        /i feel/i,
        /breaks my heart/i,
        /i(?:'m| am) (?:frustrated|angry|outraged|disappointed)/i,
        /deeply (?:concerned|troubled|worried)/i
    ],

    decisive: [
        /my decision is/i,
        /i(?:'ve| have) decided/i,
        /i(?:'m| am) voting/i,
        /my vote (?:is|will be)/i
    ]
};

// ============================================================================
// DETECTION FUNCTIONS
// ============================================================================

/**
 * Check for controversial keywords in text
 */
function detectControversialLevel(text: string): QuoteImpactLevel | null {
    for (const pattern of CONTROVERSIAL_KEYWORDS.critical) {
        if (pattern.test(text)) return 'critical';
    }
    for (const pattern of CONTROVERSIAL_KEYWORDS.high) {
        if (pattern.test(text)) return 'high';
    }
    for (const pattern of CONTROVERSIAL_KEYWORDS.medium) {
        if (pattern.test(text)) return 'medium';
    }
    return null;
}

/**
 * Detect quote type based on content patterns
 */
function detectQuoteType(text: string): QuoteType | null {
    // Check for stance declarations
    for (const pattern of STANCE_PATTERNS.strong_for) {
        if (pattern.test(text)) return 'policy_stance';
    }
    for (const pattern of STANCE_PATTERNS.strong_against) {
        if (pattern.test(text)) return 'policy_stance';
    }

    // Check for emotional content
    for (const pattern of STANCE_PATTERNS.emotional) {
        if (pattern.test(text)) return 'emotional';
    }

    // Check for decisive statements
    for (const pattern of STANCE_PATTERNS.decisive) {
        if (pattern.test(text)) return 'decisive';
    }

    // Controversial detected earlier
    const controversialLevel = detectControversialLevel(text);
    if (controversialLevel === 'critical' || controversialLevel === 'high') {
        return 'controversial';
    }

    return null;
}

/**
 * Calculate impact level based on multiple factors
 */
function calculateImpactLevel(
    text: string,
    sentiment: SentimentAnalysis
): { level: QuoteImpactLevel; confidence: number } {
    let score = 0;
    const factors: string[] = [];

    // Factor 1: Controversial keywords (30% weight)
    const controversialLevel = detectControversialLevel(text);
    if (controversialLevel === 'critical') {
        score += 30;
        factors.push('critical_keywords');
    } else if (controversialLevel === 'high') {
        score += 22;
        factors.push('high_keywords');
    } else if (controversialLevel === 'medium') {
        score += 15;
        factors.push('medium_keywords');
    }

    // Factor 2: Sentiment intensity (25% weight)
    const sentimentIntensity = Math.abs(sentiment.score);
    if (sentimentIntensity >= CONFIG.SENTIMENT_CRITICAL_THRESHOLD) {
        score += 25;
        factors.push('extreme_sentiment');
    } else if (sentimentIntensity >= CONFIG.SENTIMENT_HIGH_THRESHOLD) {
        score += 18;
        factors.push('high_sentiment');
    } else if (sentimentIntensity >= CONFIG.SENTIMENT_MEDIUM_THRESHOLD) {
        score += 12;
        factors.push('moderate_sentiment');
    }

    // Factor 3: First-person stance (20% weight)
    const hasStance = /\bi (believe|think|feel|support|oppose|vote)\b/i.test(text);
    if (hasStance) {
        score += 20;
        factors.push('first_person_stance');
    }

    // Factor 4: Rhetorical devices (15% weight)
    const hasQuestion = /\?/.test(text);
    const hasExclamation = /!/.test(text);
    const hasRepetition = /(\b\w+\b)(?:\s+\w+){0,3}\s+\1\b/i.test(text);
    if (hasQuestion || hasExclamation || hasRepetition) {
        score += 15;
        factors.push('rhetorical');
    }

    // Factor 5: Quotability (10% weight)
    const wordCount = text.split(/\s+/).length;
    if (wordCount >= CONFIG.IDEAL_MIN_WORDS && wordCount <= CONFIG.IDEAL_MAX_WORDS) {
        score += 10;
        factors.push('ideal_length');
    } else if (wordCount >= CONFIG.MIN_QUOTE_WORDS && wordCount <= CONFIG.MAX_QUOTE_WORDS) {
        score += 5;
        factors.push('acceptable_length');
    }

    // Determine level
    let level: QuoteImpactLevel;
    if (score >= 70 || controversialLevel === 'critical') {
        level = 'critical';
    } else if (score >= 50) {
        level = 'high';
    } else if (score >= 30) {
        level = 'medium';
    } else {
        level = 'low';
    }

    // Confidence is based on how many factors contributed
    const confidence = Math.min(1, factors.length * 0.2 + 0.3);

    return { level, confidence };
}

/**
 * Detect quotes from a segment
 */
export function detectQuotes(
    segment: {
        id: string;
        text: string;
        speaker_id?: string | null;
    },
    sentiment: SentimentAnalysis,
    primaryIssueId?: string | null
): QuoteDetectionResult | null {
    const text = segment.text.trim();
    const wordCount = text.split(/\s+/).length;

    // Skip if too short or too long
    if (wordCount < CONFIG.MIN_QUOTE_WORDS || wordCount > CONFIG.MAX_QUOTE_WORDS * 1.5) {
        return null;
    }

    // Calculate impact
    const { level, confidence } = calculateImpactLevel(text, sentiment);

    // Skip low-impact quotes unless they have significant sentiment
    if (level === 'low' && Math.abs(sentiment.score) < CONFIG.SENTIMENT_MEDIUM_THRESHOLD) {
        return null;
    }

    // Must meet minimum confidence (0.3 per user preference)
    if (confidence < CONFIG.MIN_CONFIDENCE) {
        return null;
    }

    const quoteType = detectQuoteType(text);

    return {
        segmentId: segment.id,
        legislatorId: segment.speaker_id ?? undefined,
        quoteText: text,
        impactLevel: level,
        quoteType: quoteType ?? undefined,
        sentimentScore: sentiment.score,
        sentimentIntensity: Math.abs(sentiment.score),
        confidence,
        primaryIssueId: primaryIssueId ?? undefined
    };
}

/**
 * Batch process segments for quote detection
 */
export async function detectQuotesFromSegments(
    segments: Array<{
        id: string;
        text: string;
        speaker_id?: string | null;
        sentiment_score?: number | null;
    }>,
    analyzeSentiment: (text: string) => Promise<SentimentAnalysis>,
    getIssueId?: (segmentId: string) => Promise<string | null>
): Promise<QuoteDetectionResult[]> {
    const results: QuoteDetectionResult[] = [];

    for (const segment of segments) {
        // Get or compute sentiment
        let sentiment: SentimentAnalysis;
        if (segment.sentiment_score !== null && segment.sentiment_score !== undefined) {
            sentiment = {
                label: segment.sentiment_score > 0.2 ? 'positive' :
                    segment.sentiment_score < -0.2 ? 'negative' : 'neutral',
                score: segment.sentiment_score,
                confidence: 0.8
            };
        } else {
            sentiment = await analyzeSentiment(segment.text);
        }

        // Get primary issue if available
        const issueId = getIssueId ? await getIssueId(segment.id) : null;

        const quote = detectQuotes(segment, sentiment, issueId);
        if (quote) {
            results.push(quote);
        }
    }

    // Sort by impact level (critical first)
    const levelOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    results.sort((a, b) => levelOrder[a.impactLevel] - levelOrder[b.impactLevel]);

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
