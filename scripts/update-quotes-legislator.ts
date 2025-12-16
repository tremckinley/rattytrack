// Update key_quotes with legislator_id from linked segments

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
    console.log('Updating key_quotes with legislator_id from linked segments...');

    // Get quotes without legislator_id that have segment_id
    const { data: quotes, error } = await supabase
        .from('key_quotes')
        .select('id, segment_id')
        .is('legislator_id', null)
        .not('segment_id', 'is', null);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Quotes without legislator_id: ${quotes?.length || 0}`);

    let updated = 0;
    for (const quote of quotes || []) {
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
                updated++;
            }
        }
    }

    console.log(`Updated quotes: ${updated}`);
}

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
