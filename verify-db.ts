
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const meetingId = 'fce618f3-f8eb-4caf-9afd-ebf5d49fd213';
    const { data: meeting } = await supabase.from('meetings').select('*').eq('id', meetingId).single();

    const dateStr = new Date(meeting.scheduled_start).toISOString().split('T')[0];
    const { data: docs } = await supabase.from('meeting_documents').select('*').eq('meeting_date', dateStr);

    const results = {
        meeting: {
            title: meeting.title,
            type: meeting.meeting_type,
            start: meeting.scheduled_start
        },  
        documents: docs
    };

    fs.writeFileSync('verify-results.json', JSON.stringify(results, null, 2));
    console.log(`Results written to verify-results.json. Found ${docs.length} docs.`);
}

check();
