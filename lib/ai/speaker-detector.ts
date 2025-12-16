// Text-based speaker detection
// Parses transcript text for legislator name mentions to auto-link segments

import { createClient } from '@supabase/supabase-js';

// Inline type to avoid import path issues
interface Legislator {
    id: string;
    first_name: string;
    last_name: string;
    display_name: string;
    title?: string | null;
    district?: string | null;
    is_active?: boolean;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const getSupabase = () => createClient(supabaseUrl, supabaseServiceKey);

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    // Minimum confidence to apply a match
    MIN_CONFIDENCE: 0.6,

    // Titles to strip when matching
    TITLE_PREFIXES: [
        'mayor',
        'vice mayor',
        'council member',
        'councilmember',
        'councilman',
        'councilwoman',
        'commissioner',
        'chairman',
        'chairwoman',
        'chair',
        'president',
        'vice president',
        'alderman',
        'alderwoman',
        'representative',
        'senator',
        'delegate',
        'mr.',
        'mrs.',
        'ms.',
        'miss',
        'dr.',
        'honorable',
        'hon.'
    ],

    // Patterns that indicate someone is speaking
    SPEAKER_PATTERNS: [
        // "[SMITH]:" or "[MAYOR SMITH]:"
        /\[([^\]]+)\]\s*[:\-]/i,
        // "SMITH:" at start of text
        /^([A-Z][A-Z\s]+):\s/,
        // "Mayor Smith:" or "Council Member Johnson:"
        /(?:^|\.\s+)((?:mayor|council\s*member|councilmember|commissioner|chairman?|chairwoman)\s+[a-z]+(?:\s+[a-z]+)?)\s*[:\-]/i,
        // "Thank you, Mayor Smith" (speaker being addressed)
        /thank\s+you[,\s]+(?:mayor|council\s*member|councilmember|commissioner|chairman?|chairwoman)?\s*([a-z]+(?:\-[a-z]+)?)/i,
    ]
};

// ============================================================================
// TYPES
// ============================================================================

export interface SpeakerDetectionResult {
    segmentId: number;
    legislatorId: string;
    legislatorName: string;
    matchedText: string;
    confidence: number;
    matchType: 'speaker_indicator' | 'name_mention' | 'addressed';
}

export interface DetectionStats {
    segmentsAnalyzed: number;
    segmentsLinked: number;
    legislatorCounts: Record<string, number>;
}

// ============================================================================
// DETECTION FUNCTIONS
// ============================================================================

/**
 * Normalize a name for comparison
 */
function normalizeName(name: string): string {
    let normalized = name.toLowerCase().trim();

    // Remove common titles
    for (const title of CONFIG.TITLE_PREFIXES) {
        if (normalized.startsWith(title + ' ')) {
            normalized = normalized.substring(title.length + 1).trim();
        }
    }

    // Remove punctuation
    normalized = normalized.replace(/[.,;:!?'"]/g, '');

    return normalized;
}

/**
 * Calculate match score between detected name and legislator
 */
function calculateMatchScore(
    detectedName: string,
    legislator: Legislator
): number {
    const detected = normalizeName(detectedName);
    const lastName = legislator.last_name.toLowerCase();
    const firstName = legislator.first_name?.toLowerCase() || '';
    const displayName = legislator.display_name.toLowerCase();

    // Exact last name match
    if (detected === lastName) {
        return 0.9;
    }

    // Display name contains detected name
    if (displayName.includes(detected) && detected.length >= 3) {
        return 0.85;
    }

    // Last name contains detected name (partial match)
    if (lastName.includes(detected) && detected.length >= 4) {
        return 0.7;
    }

    // First + Last name match
    if (detected.includes(lastName) && detected.includes(firstName)) {
        return 0.95;
    }

    // Hyphenated name match (e.g., "Washington" matches "Swearengen-Washington")
    if (lastName.includes('-')) {
        const parts = lastName.split('-');
        for (const part of parts) {
            if (detected === part || detected.includes(part)) {
                return 0.85;
            }
        }
    }

    return 0;
}

/**
 * Find legislator matches in text
 */
function findLegislatorMentions(
    text: string,
    legislators: Legislator[]
): Array<{ legislator: Legislator; confidence: number; matchedText: string; matchType: SpeakerDetectionResult['matchType'] }> {
    const matches: Array<{ legislator: Legislator; confidence: number; matchedText: string; matchType: SpeakerDetectionResult['matchType'] }> = [];

    // Try speaker patterns first (highest confidence)
    for (const pattern of CONFIG.SPEAKER_PATTERNS) {
        const match = text.match(pattern);
        if (match && match[1]) {
            const detectedName = match[1].trim();

            // Find best matching legislator
            let bestMatch: Legislator | null = null;
            let bestScore = 0;

            for (const leg of legislators) {
                const score = calculateMatchScore(detectedName, leg);
                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = leg;
                }
            }

            if (bestMatch && bestScore >= CONFIG.MIN_CONFIDENCE) {
                matches.push({
                    legislator: bestMatch,
                    confidence: bestScore,
                    matchedText: match[0],
                    matchType: 'speaker_indicator'
                });
            }
        }
    }

    // Also check for direct name mentions in text
    const textLower = text.toLowerCase();
    for (const leg of legislators) {
        const lastName = leg.last_name.toLowerCase();

        // Check if last name appears in text
        if (textLower.includes(lastName) && lastName.length >= 4) {
            // Make sure it's a word boundary match
            const regex = new RegExp(`\\b${lastName}\\b`, 'i');
            if (regex.test(text)) {
                matches.push({
                    legislator: leg,
                    confidence: 0.65,
                    matchedText: lastName,
                    matchType: 'name_mention'
                });
            }
        }
    }

    // Deduplicate - keep highest confidence per legislator
    const uniqueMatches = new Map<string, typeof matches[0]>();
    for (const match of matches) {
        const existing = uniqueMatches.get(match.legislator.id);
        if (!existing || match.confidence > existing.confidence) {
            uniqueMatches.set(match.legislator.id, match);
        }
    }

    return [...uniqueMatches.values()];
}

/**
 * Detect speakers in a batch of segments
 */
export async function detectSpeakersInSegments(
    segments: Array<{
        id: number;
        text: string;
        speaker_id?: string | null;
    }>
): Promise<SpeakerDetectionResult[]> {
    const supabase = getSupabase();

    // Get all active legislators
    const { data: legislators, error } = await supabase
        .from('legislators')
        .select('*')
        .or('is_active.eq.true,is_active.is.null');

    if (error || !legislators) {
        console.error('Error fetching legislators:', error);
        return [];
    }

    const results: SpeakerDetectionResult[] = [];

    for (const segment of segments) {
        // Skip if already linked
        if (segment.speaker_id) {
            continue;
        }

        const matches = findLegislatorMentions(segment.text, legislators);

        // Take the highest confidence match
        if (matches.length > 0) {
            const best = matches.sort((a, b) => b.confidence - a.confidence)[0];

            results.push({
                segmentId: segment.id,
                legislatorId: best.legislator.id,
                legislatorName: best.legislator.display_name,
                matchedText: best.matchedText,
                confidence: best.confidence,
                matchType: best.matchType
            });
        }
    }

    return results;
}

/**
 * Run speaker detection on a video and update segments
 */
export async function runSpeakerDetectionForVideo(
    videoId: string
): Promise<DetectionStats> {
    const supabase = getSupabase();

    console.log(`Running speaker detection for video ${videoId}...`);

    // Get all segments for video
    const { data: segments, error: segError } = await supabase
        .from('transcription_segments')
        .select('id, text, speaker_id')
        .eq('video_id', videoId)
        .order('start_time');

    if (segError || !segments) {
        console.error('Error fetching segments:', segError);
        return { segmentsAnalyzed: 0, segmentsLinked: 0, legislatorCounts: {} };
    }

    // Detect speakers
    const detections = await detectSpeakersInSegments(segments);

    console.log(`Found ${detections.length} speaker detections in ${segments.length} segments`);

    // Update segments with detected speakers
    const legislatorCounts: Record<string, number> = {};
    let linked = 0;

    for (const detection of detections) {
        const { error: updateError } = await supabase
            .from('transcription_segments')
            .update({ speaker_id: detection.legislatorId })
            .eq('id', detection.segmentId);

        if (!updateError) {
            linked++;
            legislatorCounts[detection.legislatorName] = (legislatorCounts[detection.legislatorName] || 0) + 1;
            console.log(`  Linked segment ${detection.segmentId} to ${detection.legislatorName} (${detection.matchType}, ${(detection.confidence * 100).toFixed(0)}%)`);
        }
    }

    return {
        segmentsAnalyzed: segments.length,
        segmentsLinked: linked,
        legislatorCounts
    };
}

/**
 * Run speaker detection on all videos
 */
export async function runSpeakerDetectionForAllVideos(): Promise<{
    videosProcessed: number;
    totalLinked: number;
}> {
    const supabase = getSupabase();

    // Get all completed videos
    const { data: videos } = await supabase
        .from('video_transcriptions')
        .select('video_id')
        .eq('status', 'completed');

    if (!videos) {
        return { videosProcessed: 0, totalLinked: 0 };
    }

    let totalLinked = 0;

    for (const video of videos) {
        const stats = await runSpeakerDetectionForVideo(video.video_id);
        totalLinked += stats.segmentsLinked;
    }

    return {
        videosProcessed: videos.length,
        totalLinked
    };
}
