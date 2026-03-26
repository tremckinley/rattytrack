import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function stop() {
    console.log('🗑️ Deleting all queued transcription records...');
    const { data, error } = await supabase
        .from('video_transcriptions')
        .delete()
        .eq('status', 'queued')
        .select();

    if (error) {
        console.error('Error deleting transcriptions:', error);
    } else {
        console.log(`✅ Deleted ${data?.length || 0} queued transcription records.`);
    }
}

stop();
