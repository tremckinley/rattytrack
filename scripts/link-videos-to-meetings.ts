/**
 * Link Videos to Meetings Script
 * 
 * This script matches existing video_transcriptions to meetings records
 * by parsing dates from video titles and finding corresponding meetings.
 * 
 * Run with: npx tsx scripts/link-videos-to-meetings.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

/**
 * Parse date from video title
 * Handles formats like:
 * - "City Council Meeting - January 7, 2025"
 * - "Committee Meeting January 7 2025"
 * - "Regular Meeting 01/07/2025"
 */
function parseDateFromTitle(title: string): Date | null {
    // Try "Month Day, Year" format
    const monthDayYearMatch = title.match(
        /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})\b/i
    );

    if (monthDayYearMatch) {
        const monthNames = [
            'january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'
        ];
        const month = monthNames.indexOf(monthDayYearMatch[1].toLowerCase());
        const day = parseInt(monthDayYearMatch[2]);
        const year = parseInt(monthDayYearMatch[3]);

        if (month >= 0) {
            return new Date(year, month, day);
        }
    }

    // Try MM/DD/YYYY format
    const slashMatch = title.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);
    if (slashMatch) {
        const month = parseInt(slashMatch[1]) - 1;
        const day = parseInt(slashMatch[2]);
        const year = parseInt(slashMatch[3]);
        return new Date(year, month, day);
    }

    // Try MM-DD-YYYY format
    const dashMatch = title.match(/\b(\d{1,2})-(\d{1,2})-(\d{4})\b/);
    if (dashMatch) {
        const month = parseInt(dashMatch[1]) - 1;
        const day = parseInt(dashMatch[2]);
        const year = parseInt(dashMatch[3]);
        return new Date(year, month, day);
    }

    return null;
}

/**
 * Determine meeting type from video title
 */
function getMeetingTypeFromTitle(title: string): string {
    const lowerTitle = title.toLowerCase();

    if (lowerTitle.includes('committee')) {
        return 'Committee Meeting';
    }
    if (lowerTitle.includes('special')) {
        return 'Special Meeting';
    }
    if (lowerTitle.includes('public hearing')) {
        return 'Public Hearing';
    }
    // Default to Regular Meeting
    return 'Regular Meeting';
}

async function linkVideosToMeetings() {
    console.log('🔗 Starting video-to-meeting linking process...\n');

    // Fetch all video transcriptions
    const { data: videos, error: videosError } = await supabase
        .from('video_transcriptions')
        .select('video_id, title, published_at, status')
        .order('published_at', { ascending: false });

    if (videosError) {
        console.error('❌ Error fetching videos:', videosError);
        return;
    }

    console.log(`📹 Found ${videos.length} video transcriptions\n`);

    let linked = 0;
    let created = 0;
    let skipped = 0;

    for (const video of videos) {
        const parsedDate = parseDateFromTitle(video.title);

        if (!parsedDate) {
            console.log(`⚠️  Could not parse date from: "${video.title}"`);
            skipped++;
            continue;
        }

        const meetingType = getMeetingTypeFromTitle(video.title);
        const dateStr = parsedDate.toISOString().split('T')[0];

        // Look for existing meeting on this date
        const { data: existingMeeting } = await supabase
            .from('meetings')
            .select('id, video_id, title')
            .gte('scheduled_start', `${dateStr}T00:00:00`)
            .lt('scheduled_start', `${dateStr}T23:59:59`)
            .eq('meeting_type', meetingType)
            .single();

        if (existingMeeting) {
            if (existingMeeting.video_id === video.video_id) {
                console.log(`✓ Already linked: ${video.title}`);
                continue;
            }

            // Update existing meeting with video_id
            const { error: updateError } = await supabase
                .from('meetings')
                .update({
                    video_id: video.video_id,
                    video_url: `https://www.youtube.com/watch?v=${video.video_id}`,
                    video_platform: 'youtube'
                })
                .eq('id', existingMeeting.id);

            if (updateError) {
                console.error(`❌ Error updating meeting ${existingMeeting.id}:`, updateError);
            } else {
                console.log(`🔗 Linked video to existing meeting: ${existingMeeting.title}`);
                linked++;
            }
        } else {
            // Create new meeting record
            const meetingTitle = `Memphis City Council ${meetingType} - ${parsedDate.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            })}`;

            const { error: insertError } = await supabase
                .from('meetings')
                .insert({
                    meeting_type: meetingType,
                    title: meetingTitle,
                    scheduled_start: parsedDate.toISOString(),
                    video_id: video.video_id,
                    video_url: `https://www.youtube.com/watch?v=${video.video_id}`,
                    video_platform: 'youtube',
                    processing_status: 'completed',
                    transcription_status: video.status === 'completed' ? 'completed' : 'pending',
                    analysis_status: 'pending'
                });

            if (insertError) {
                console.error(`❌ Error creating meeting for "${video.title}":`, insertError);
            } else {
                console.log(`✨ Created new meeting: ${meetingTitle}`);
                created++;
            }
        }
    }

    console.log('\n📊 Summary:');
    console.log(`   Linked to existing meetings: ${linked}`);
    console.log(`   Created new meetings: ${created}`);
    console.log(`   Skipped (no date parsed): ${skipped}`);
}

// Run the script
linkVideosToMeetings()
    .then(() => {
        console.log('\n✅ Done!');
        process.exit(0);
    })
    .catch((err) => {
        console.error('Fatal error:', err);
        process.exit(1);
    });
