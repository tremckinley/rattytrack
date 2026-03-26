import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function check() {
    console.log('--- Current Transcription Status ---');
    
    // Check meetings table
    const { data: meetings } = await supabase
        .from('meetings')
        .select('transcription_status')
        .order('transcription_status');
    
    const meetingCounts = meetings?.reduce((acc: any, m) => {
        acc[m.transcription_status || 'null'] = (acc[m.transcription_status || 'null'] || 0) + 1;
        return acc;
    }, {});
    
    console.log('Meetings by Status:', meetingCounts);

    // Check video_transcriptions table
    const { data: trans } = await supabase
        .from('video_transcriptions')
        .select('status')
        .order('status');
        
    const transCounts = trans?.reduce((acc: any, t) => {
        acc[t.status || 'null'] = (acc[t.status || 'null'] || 0) + 1;
        return acc;
    }, {});
    
    console.log('Transcriptions by Status:', transCounts);
}

check();
