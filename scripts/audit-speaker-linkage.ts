// Audit script for speaker linkage - writes to file
// Run with: npx tsx scripts/audit-speaker-linkage.ts

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

const lines: string[] = [];
function log(msg: string) {
    lines.push(msg);
    console.log(msg);
}

async function main() {
    log('SPEAKER LINKAGE AUDIT');
    log('='.repeat(60));
    log('');

    // 1. Total segments
    const { count: totalSegments } = await supabase
        .from('transcription_segments')
        .select('*', { count: 'exact', head: true });

    log('TRANSCRIPTION SEGMENTS');
    log(`Total segments: ${totalSegments}`);

    // 2. Segments with speaker_id
    const { count: linkedSegments } = await supabase
        .from('transcription_segments')
        .select('*', { count: 'exact', head: true })
        .not('speaker_id', 'is', null);

    const linkedPct = totalSegments ? ((linkedSegments || 0) / totalSegments * 100).toFixed(1) : '0';
    log(`With speaker_id (linked): ${linkedSegments} (${linkedPct}%)`);

    // 3. Segments with speaker_name but no speaker_id
    const { count: namedButUnlinked } = await supabase
        .from('transcription_segments')
        .select('*', { count: 'exact', head: true })
        .not('speaker_name', 'is', null)
        .is('speaker_id', null);

    log(`With speaker_name but no speaker_id: ${namedButUnlinked}`);

    // 4. Unique speaker_names that aren't linked
    const { data: unlinkedSpeakers } = await supabase
        .from('transcription_segments')
        .select('speaker_name')
        .not('speaker_name', 'is', null)
        .is('speaker_id', null)
        .limit(1000);

    const uniqueUnlinkedNames = [...new Set(unlinkedSpeakers?.map(s => s.speaker_name) || [])];
    log(`Unique unlinked speaker names: ${uniqueUnlinkedNames.length}`);
    if (uniqueUnlinkedNames.length > 0) {
        log(`Names: ${uniqueUnlinkedNames.slice(0, 20).join(', ')}`);
    }

    log('');
    log('='.repeat(60));
    log('');

    // 5. Key quotes linkage
    const { count: totalQuotes } = await supabase
        .from('key_quotes')
        .select('*', { count: 'exact', head: true });

    log('KEY QUOTES');
    log(`Total quotes: ${totalQuotes}`);

    const { count: linkedQuotes } = await supabase
        .from('key_quotes')
        .select('*', { count: 'exact', head: true })
        .not('legislator_id', 'is', null);

    const quoteLinkPct = totalQuotes ? ((linkedQuotes || 0) / totalQuotes * 100).toFixed(1) : '0';
    log(`With legislator_id: ${linkedQuotes} (${quoteLinkPct}%)`);

    log('');
    log('='.repeat(60));
    log('');

    // 6. Legislators
    const { data: legislators, count: legislatorCount } = await supabase
        .from('legislators')
        .select('id, display_name', { count: 'exact' });

    log('LEGISLATORS');
    log(`Total legislators: ${legislatorCount}`);

    // 7. Legislators with linked segments
    if (legislators && legislators.length > 0) {
        const legislatorIds = legislators.map(l => l.id);

        const { data: segmentCounts } = await supabase
            .from('transcription_segments')
            .select('speaker_id')
            .in('speaker_id', legislatorIds);

        const speakerIdCounts: Record<string, number> = {};
        segmentCounts?.forEach(s => {
            if (s.speaker_id) {
                speakerIdCounts[s.speaker_id] = (speakerIdCounts[s.speaker_id] || 0) + 1;
            }
        });

        const legislatorsWithSegments = Object.keys(speakerIdCounts).length;
        log(`Legislators with linked segments: ${legislatorsWithSegments}`);

        const sortedSpeakers = Object.entries(speakerIdCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        if (sortedSpeakers.length > 0) {
            log('');
            log('Top 5 speakers by segment count:');
            for (const [speakerId, count] of sortedSpeakers) {
                const leg = legislators.find(l => l.id === speakerId);
                log(`  ${leg?.display_name || 'Unknown'}: ${count} segments`);
            }
        }
    }

    log('');
    log('='.repeat(60));
    log('');

    // Summary
    if ((linkedSegments || 0) < (totalSegments || 0) * 0.5) {
        log('RECOMMENDATION: Less than 50% of segments are linked.');
        log('Consider improving speaker mapping before running intelligence pipeline.');
    } else {
        log('GOOD: Most segments are linked to legislators.');
    }

    log('');
    log('Audit complete!');

    // Write to file
    fs.writeFileSync('speaker-audit-results.md', lines.join('\n'));
    console.log('\nResults written to: speaker-audit-results.md');
}

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
