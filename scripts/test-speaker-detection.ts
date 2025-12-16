// Inline test script for text-based speaker detection
// All code in one file to avoid tsx path resolution issues

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface Legislator {
    id: string;
    first_name: string;
    last_name: string;
    display_name: string;
    title?: string | null;
}

const CONFIG = {
    MIN_CONFIDENCE: 0.6,
    TITLE_PREFIXES: [
        'mayor', 'vice mayor', 'council member', 'councilmember',
        'commissioner', 'chairman', 'chairwoman', 'chair', 'president'
    ],
    SPEAKER_PATTERNS: [
        /\[([^\]]+)\]\s*[:\-]/i,
        /^([A-Z][A-Z\s]+):\s/,
        /(?:^|\.\s+)((?:mayor|council\s*member|councilmember|commissioner|chairman?|chairwoman)\s+[a-z]+(?:\s+[a-z]+)?)\s*[:\-]/i,
        /thank\s+you[,\s]+(?:mayor|council\s*member|councilmember|commissioner|chairman?|chairwoman)?\s*([a-z]+(?:\-[a-z]+)?)/i,
    ]
};

function normalizeName(name: string): string {
    let normalized = name.toLowerCase().trim();
    for (const title of CONFIG.TITLE_PREFIXES) {
        if (normalized.startsWith(title + ' ')) {
            normalized = normalized.substring(title.length + 1).trim();
        }
    }
    return normalized.replace(/[.,;:!?'"]/g, '');
}

function calculateMatchScore(detectedName: string, legislator: Legislator): number {
    const detected = normalizeName(detectedName);
    const lastName = legislator.last_name.toLowerCase();
    const firstName = legislator.first_name?.toLowerCase() || '';
    const displayName = legislator.display_name.toLowerCase();

    if (detected === lastName) return 0.9;
    if (displayName.includes(detected) && detected.length >= 3) return 0.85;
    if (lastName.includes(detected) && detected.length >= 4) return 0.7;
    if (detected.includes(lastName) && detected.includes(firstName)) return 0.95;
    if (lastName.includes('-')) {
        const parts = lastName.split('-');
        for (const part of parts) {
            if (detected === part || detected.includes(part)) return 0.85;
        }
    }
    return 0;
}

function findMatch(text: string, legislators: Legislator[]): { legislator: Legislator; confidence: number; matchedText: string } | null {
    // Try speaker patterns
    for (const pattern of CONFIG.SPEAKER_PATTERNS) {
        const match = text.match(pattern);
        if (match && match[1]) {
            const detectedName = match[1].trim();
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
                return { legislator: bestMatch, confidence: bestScore, matchedText: match[0] };
            }
        }
    }

    // Also check for direct name mentions
    const textLower = text.toLowerCase();
    for (const leg of legislators) {
        const lastName = leg.last_name.toLowerCase();
        if (textLower.includes(lastName) && lastName.length >= 4) {
            const regex = new RegExp(`\\b${lastName}\\b`, 'i');
            if (regex.test(text)) {
                return { legislator: leg, confidence: 0.65, matchedText: lastName };
            }
        }
    }

    return null;
}

async function main() {
    console.log('='.repeat(60));
    console.log('TEXT-BASED SPEAKER DETECTION');
    console.log('='.repeat(60));
    console.log('');

    // Get all legislators
    const { data: legislators, error: legError } = await supabase
        .from('legislators')
        .select('id, first_name, last_name, display_name, title')
        .or('is_active.eq.true,is_active.is.null');

    if (legError || !legislators) {
        console.error('Error fetching legislators:', legError);
        return;
    }

    console.log(`Loaded ${legislators.length} legislators`);

    // Get all completed videos
    const { data: videos } = await supabase
        .from('video_transcriptions')
        .select('video_id, title')
        .eq('status', 'completed');

    if (!videos || videos.length === 0) {
        console.log('No completed videos found');
        return;
    }

    console.log(`Processing ${videos.length} videos...`);
    console.log('');

    let totalLinked = 0;
    const legislatorCounts: Record<string, number> = {};

    for (const video of videos) {
        console.log(`\n${video.title?.slice(0, 50)}...`);

        // Get unlinked segments for this video
        const { data: segments, error: segError } = await supabase
            .from('transcription_segments')
            .select('id, text, speaker_id')
            .eq('video_id', video.video_id)
            .is('speaker_id', null);

        if (segError || !segments) {
            console.log('  Error fetching segments');
            continue;
        }

        console.log(`  ${segments.length} unlinked segments`);

        let videoLinked = 0;
        for (const segment of segments) {
            const match = findMatch(segment.text, legislators);

            if (match) {
                const { error: updateError } = await supabase
                    .from('transcription_segments')
                    .update({ speaker_id: match.legislator.id })
                    .eq('id', segment.id);

                if (!updateError) {
                    videoLinked++;
                    legislatorCounts[match.legislator.display_name] =
                        (legislatorCounts[match.legislator.display_name] || 0) + 1;
                }
            }
        }

        console.log(`  Linked: ${videoLinked}`);
        totalLinked += videoLinked;
    }

    console.log('');
    console.log('='.repeat(60));
    console.log('RESULTS');
    console.log('='.repeat(60));
    console.log(`Total segments linked: ${totalLinked}`);
    console.log('');
    console.log('By legislator:');
    for (const [name, count] of Object.entries(legislatorCounts).sort((a, b) => b[1] - a[1])) {
        console.log(`  ${name}: ${count}`);
    }
}

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
