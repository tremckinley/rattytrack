#!/usr/bin/env tsx
/**
 * Diagnostic script to check data types in transcription_segments
 */

import { supabase } from '../lib/utils/supabase';

async function checkSchema() {
    console.log('Checking transcription_segments schema...\n');

    // Get a sample row to see the actual data types
    const { data, error } = await supabase
        .from('transcription_segments')
        .select('id, speaker_id, start_time, end_time')
        .limit(1)
        .single();

    if (error) {
        console.error('Error:', error);
        process.exit(1);
    }

    console.log('Sample row:', data);
    console.log('\nData types:');
    console.log('- id:', typeof data.id, '(', data.id, ')');
    console.log('- speaker_id:', typeof data.speaker_id, '(', data.speaker_id, ')');
    console.log('- start_time:', typeof data.start_time, '(', data.start_time, ')');
    console.log('- end_time:', typeof data.end_time, '(', data.end_time, ')');

    // Check a legislator ID
    const { data: legislator } = await supabase
        .from('legislators')
        .select('id')
        .limit(1)
        .single();

    if (legislator) {
        console.log('\nLegislator ID:', typeof legislator.id, '(', legislator.id, ')');
    }

    process.exit(0);
}

checkSchema();
