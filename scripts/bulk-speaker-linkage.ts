// Bulk speaker linkage script
// This script:
// 1. Finds all existing speaker->legislator mappings that have worked
// 2. Propagates them to all matching segments across videos
// 3. Updates key_quotes with legislator_id based on linked segments

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface SpeakerMapping {
    speakerName: string;
    legislatorId: string;
    legislatorName: string;
    segmentCount: number;
}

const log: string[] = [];
function logMsg(msg: string) {
    log.push(msg);
    console.log(msg);
}

async function main() {
    logMsg('='.repeat(60));
    logMsg('BULK SPEAKER LINKAGE');
    logMsg('='.repeat(60));
    logMsg('');

    // Step 1: Learn existing mappings from segments that ARE linked
    logMsg('STEP 1: Learning existing speaker->legislator mappings...');

    const { data: linkedSegments, error: linkedError } = await supabase
        .from('transcription_segments')
        .select('speaker_name, speaker_id')
        .not('speaker_id', 'is', null)
        .not('speaker_name', 'is', null);

    if (linkedError) {
        logMsg(`Error fetching linked segments: ${linkedError.message}`);
        process.exit(1);
    }

    // Build mapping: speaker_name -> legislator_id
    const speakerToLegislator = new Map<string, string>();
    const speakerCounts = new Map<string, number>();

    for (const seg of linkedSegments || []) {
        if (seg.speaker_name && seg.speaker_id) {
            speakerToLegislator.set(seg.speaker_name, seg.speaker_id);
            speakerCounts.set(seg.speaker_name, (speakerCounts.get(seg.speaker_name) || 0) + 1);
        }
    }

    logMsg(`Found ${speakerToLegislator.size} unique speaker->legislator mappings`);

    // Get legislator names for display
    const { data: legislators } = await supabase
        .from('legislators')
        .select('id, display_name');

    const legislatorNames = new Map<string, string>();
    legislators?.forEach(l => legislatorNames.set(l.id, l.display_name));

    // Display learned mappings
    logMsg('');
    logMsg('Learned mappings:');
    for (const [speaker, legId] of speakerToLegislator) {
        const count = speakerCounts.get(speaker) || 0;
        logMsg(`  ${speaker} -> ${legislatorNames.get(legId) || legId} (${count} segments)`);
    }

    // Step 2: Find unlinked segments that match known speaker names
    logMsg('');
    logMsg('STEP 2: Finding unlinked segments to update...');

    const speakerNames = [...speakerToLegislator.keys()];

    if (speakerNames.length === 0) {
        logMsg('No existing mappings found. Please use the SpeakerMapper UI to create initial mappings.');
        return;
    }

    // Count how many unlinked segments we can fix
    const { count: unlinkedCount } = await supabase
        .from('transcription_segments')
        .select('*', { count: 'exact', head: true })
        .in('speaker_name', speakerNames)
        .is('speaker_id', null);

    logMsg(`Found ${unlinkedCount} unlinked segments with matching speaker names`);

    if ((unlinkedCount || 0) === 0) {
        logMsg('No segments to update.');
    } else {
        // Step 3: Update segments in batches
        logMsg('');
        logMsg('STEP 3: Updating segments...');

        let totalUpdated = 0;

        for (const [speakerName, legislatorId] of speakerToLegislator) {
            const { count, error } = await supabase
                .from('transcription_segments')
                .update({ speaker_id: legislatorId })
                .eq('speaker_name', speakerName)
                .is('speaker_id', null);

            if (error) {
                logMsg(`  Error updating ${speakerName}: ${error.message}`);
            } else {
                const updated = count || 0;
                if (updated > 0) {
                    logMsg(`  Updated ${updated} segments: ${speakerName} -> ${legislatorNames.get(legislatorId)}`);
                    totalUpdated += updated;
                }
            }
        }

        logMsg(`Total segments updated: ${totalUpdated}`);
    }

    // Step 4: Update key_quotes with legislator_id from their segments
    logMsg('');
    logMsg('STEP 4: Updating key_quotes with legislator_id...');

    // Get quotes without legislator_id that have segment_id
    const { data: quotesWithoutLeg, error: quotesError } = await supabase
        .from('key_quotes')
        .select('id, segment_id')
        .is('legislator_id', null)
        .not('segment_id', 'is', null);

    if (quotesError) {
        logMsg(`Error fetching quotes: ${quotesError.message}`);
    } else {
        let quotesUpdated = 0;

        for (const quote of quotesWithoutLeg || []) {
            // Get speaker_id from the segment
            const { data: segment } = await supabase
                .from('transcription_segments')
                .select('speaker_id')
                .eq('id', quote.segment_id)
                .single();

            if (segment?.speaker_id) {
                const { error: updateError } = await supabase
                    .from('key_quotes')
                    .update({ legislator_id: segment.speaker_id })
                    .eq('id', quote.id);

                if (!updateError) {
                    quotesUpdated++;
                }
            }
        }

        logMsg(`Updated ${quotesUpdated} key_quotes with legislator_id`);
    }

    // Summary
    logMsg('');
    logMsg('='.repeat(60));
    logMsg('COMPLETE');
    logMsg('='.repeat(60));

    // Write log to file
    fs.writeFileSync('bulk-speaker-linkage-results.md', log.join('\n'));
    logMsg('\nResults written to: bulk-speaker-linkage-results.md');
}

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
