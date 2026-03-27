import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

export async function stopTranscriptions() {
    console.log('🛑 Stopping all queued transcriptions...');
    const { data, error } = await supabase
        .from('meetings')
        .update({ transcription_status: 'pending' })
        .eq('transcription_status', 'queued')
        .select();

    if (error) {
        console.error('Error stopping transcriptions:', error);
        return { success: false, error: error.message };
    } else {
        console.log(`✅ Reset ${data?.length || 0} meetings to 'pending' status.`);
        return { success: true, stats: { reset: data?.length || 0 } };
    }
}

// Standalone support
if (require.main === module) {
    stopTranscriptions().then(() => process.exit(0));
}
