/**
 * Migration Script: YouTube to Granicus
 * 
 * This script identifies meetings with legacy YouTube IDs and attempts to
 * find their corresponding Granicus clip IDs by matching dates in the archive.
 * 
 * Run with: npx tsx scripts/migrate-youtube-to-granicus.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fetchGranicusMeetings } from '../lib/utils/meeting-video-downloader';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function migrate() {
    console.log('🚀 Starting YouTube to Granicus migration...');

    // 1. Fetch all meetings that have a YouTube ID or suspicious platform
    const { data: meetings, error } = await supabase
        .from('meetings')
        .select('id, title, scheduled_start, video_id, video_platform')
        .or('video_platform.eq.youtube,video_platform.is.null');

    if (error) {
        console.error('Error fetching meetings:', error);
        return;
    }

    // Filter for those that actually look like YouTube IDs (usually 11 chars) or meet previous criteria
    const legacyMeetings = meetings.filter(m => 
        m.video_id && (m.video_id.length === 11 || m.video_platform === 'youtube')
    );

    console.log(`🔍 Found ${legacyMeetings.length} meetings with legacy YouTube IDs.`);

    if (legacyMeetings.length === 0) {
        console.log('✅ No legacy meetings found. Migration complete!');
        return;
    }

    // 2. Fetch all available Granicus meetings
    console.log('📥 Fetching Granicus archive...');
    const granicusMeetings = await fetchGranicusMeetings();
    console.log(`📦 Found ${granicusMeetings.length} Granicus clips available.`);

    let migratedCount = 0;

    // 3. Attempt to match
    for (const meeting of legacyMeetings) {
        const meetingDate = new Date(meeting.scheduled_start).toISOString().split('T')[0];
        
        // Find a matching Granicus meeting on the same date with a similar title
        const match = granicusMeetings.find(gm => {
            const gmDate = gm.date.toISOString().split('T')[0];
            if (gmDate !== meetingDate) return false;

            // Title matching (Regular vs Committee)
            const mTitle = meeting.title.toLowerCase();
            const gmTitle = gm.title.toLowerCase();

            if (mTitle.includes('committee') && gmTitle.includes('committee')) return true;
            if (mTitle.includes('regular') && gmTitle.includes('council')) return true;
            if (!mTitle.includes('committee') && gmTitle.includes('council')) return true;

            return false;
        });

        if (match) {
            console.log(`✨ Matched: "${meeting.title}" -> Granicus Clip ${match.clipId}`);
            
            const { error: updateError } = await supabase
                .from('meetings')
                .update({
                    video_id: match.clipId,
                    video_url: `https://memphis.granicus.com/MediaPlayer.php?view_id=6&clip_id=${match.clipId}`,
                    video_platform: 'granicus'
                })
                .eq('id', meeting.id);

            if (updateError) {
                console.error(`❌ Failed to update ${meeting.id}:`, updateError);
            } else {
                migratedCount++;
            }
        } else {
            console.log(`⚠️ No match found for: "${meeting.title}" (${meetingDate})`);
        }
    }

    console.log(`\n🎉 Migration finished! Migrated ${migratedCount} meetings.`);
}

migrate().catch(console.error);
