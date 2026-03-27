/**
 * Transcribe Pending Meetings Script
 * 
 * This script identifies meetings that have a video_id (clipId) but 
 * no transcription, and enqueues them into the QStash pipeline.
 * 
 * Run with: npx tsx scripts/transcribe-pending-meetings.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { publishQueueEvent } from '../lib/queue/qstash';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

export async function transcribePendingMeetings(limit: number = 2) {
    console.log(`🚀 Searching for up to ${limit} pending transcriptions (Safety Limit: 2)...`);

    // 1. Find meetings with video_id but no completed transcription
    const { data: meetings, error } = await supabase
        .from('meetings')
        .select('id, video_id, title, transcription_status')
        .not('video_id', 'is', null)
        .neq('video_id', '')
        .not('transcription_status', 'eq', 'completed')
        .not('transcription_status', 'eq', 'processing')
        .not('transcription_status', 'eq', 'queued')
        .order('scheduled_start', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching pending meetings:', error);
        return { success: false, error: error.message };
    }

    if (!meetings || meetings.length === 0) {
        console.log('✅ No pending transcriptions found.');
        return { success: true, stats: { queued: 0 } };
    }

    console.log(`📦 Found ${meetings.length} meetings to enqueue.`);

    let queuedCount = 0;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${process.env.VERCEL_URL}`;
    const queueUrl = `${baseUrl}/api/webhooks/queue`;

    for (const meeting of meetings) {
        try {
            console.log(`  - Enqueueing: "${meeting.title}" (clip: ${meeting.video_id})`);

            // Update status to 'queued' to prevent double-processing
            await supabase
                .from('meetings')
                .update({ transcription_status: 'queued' })
                .eq('id', meeting.id);

            // Publish to QStash
            await publishQueueEvent({
                url: queueUrl,
                payload: {
                    eventType: 'transcribe-video',
                    videoId: meeting.video_id
                }
            });

            queuedCount++;
        } catch (err) {
            console.error(`  ❌ Failed to enqueue ${meeting.id}:`, err);
        }
    }

    console.log(`\n🎉 Enqueued ${queuedCount} meetings successfully.`);
    return { success: true, stats: { queued: queuedCount } };
}

// Standalone execution support
if (require.main === module) {
    transcribePendingMeetings()
        .then(() => process.exit(0))
        .catch(err => {
            console.error(err);
            process.exit(1);
        });
}
