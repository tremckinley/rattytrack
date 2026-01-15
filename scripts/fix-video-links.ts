/**
 * Fix Video Links Script
 * 
 * This script clears incorrectly linked videos (recaps, etc.) 
 * and re-links with correct meeting videos.
 * 
 * Run with: npx tsx scripts/fix-video-links.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const CHANNEL_HANDLE = '@MemphisCityCouncil';

// Exclude keywords for non-meeting videos
const EXCLUDE_KEYWORDS = [
    'recap',
    'highlight',
    'preview',
    'announcement',
    'trailer',
    'promo',
    'interview',
    'update',
    'summary',
    'clip',
    'moment',
    'best of',
    'teaser',
    'budget hearing',
    'budget wrap',
    'impasse',
    'oversight',
];

// Required keywords for actual meeting videos
const REQUIRED_KEYWORDS = ['meeting', 'session', 'council'];

function isActualMeetingVideo(title: string): boolean {
    const lowerTitle = title.toLowerCase();

    for (const keyword of EXCLUDE_KEYWORDS) {
        if (lowerTitle.includes(keyword)) {
            return false;
        }
    }

    for (const keyword of REQUIRED_KEYWORDS) {
        if (lowerTitle.includes(keyword)) {
            return true;
        }
    }

    return false;
}

function parseDateFromTitle(title: string): Date | null {
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

    return null;
}

function getMeetingTypeFromTitle(title: string): string {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('committee')) return 'Committee Meeting';
    if (lowerTitle.includes('special')) return 'Special Meeting';
    if (lowerTitle.includes('public hearing')) return 'Public Hearing';
    return 'Regular Meeting';
}

async function getChannelId(handle: string): Promise<string | null> {
    const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(handle)}&type=channel&maxResults=1&key=${YOUTUBE_API_KEY}`
    );
    const data = await response.json();
    return data.items?.[0]?.id?.channelId || null;
}

async function fetchValidMeetingVideos(): Promise<Map<string, { videoId: string; title: string }>> {
    console.log('📺 Fetching valid meeting videos from YouTube...');

    const channelId = await getChannelId(CHANNEL_HANDLE);
    if (!channelId) {
        console.error('Could not find channel');
        return new Map();
    }

    const videos = new Map<string, { videoId: string; title: string }>();
    let nextPageToken: string | undefined;
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    do {
        const url = new URL('https://www.googleapis.com/youtube/v3/search');
        url.searchParams.set('part', 'snippet');
        url.searchParams.set('channelId', channelId);
        url.searchParams.set('order', 'date');
        url.searchParams.set('type', 'video');
        url.searchParams.set('maxResults', '50');
        url.searchParams.set('publishedAfter', twoYearsAgo.toISOString());
        url.searchParams.set('key', YOUTUBE_API_KEY);
        if (nextPageToken) {
            url.searchParams.set('pageToken', nextPageToken);
        }

        const response = await fetch(url.toString());
        const data = await response.json();

        for (const item of data.items || []) {
            const title = item.snippet.title;

            if (!isActualMeetingVideo(title)) continue;

            const parsedDate = parseDateFromTitle(title);
            if (!parsedDate) continue;

            const meetingType = getMeetingTypeFromTitle(title);
            const key = `${parsedDate.toISOString().split('T')[0]}-${meetingType}`;

            if (!videos.has(key)) {
                videos.set(key, { videoId: item.id.videoId, title });
            }
        }

        nextPageToken = data.nextPageToken;
    } while (nextPageToken);

    console.log(`   Found ${videos.size} valid meeting videos`);
    return videos;
}

async function fixVideoLinks() {
    // Fetch all meetings with videos
    const { data: meetings, error } = await supabase
        .from('meetings')
        .select('id, title, video_id, scheduled_start, meeting_type')
        .not('video_id', 'is', null);

    if (error) {
        console.error('Error fetching meetings:', error);
        return;
    }

    console.log(`\n📋 Found ${meetings.length} meetings with video links`);

    // Fetch valid videos
    const validVideos = await fetchValidMeetingVideos();

    let fixed = 0;
    let cleared = 0;
    let correct = 0;

    for (const meeting of meetings) {
        const date = new Date(meeting.scheduled_start);
        const dateStr = date.toISOString().split('T')[0];
        const key = `${dateStr}-${meeting.meeting_type}`;

        const validVideo = validVideos.get(key);

        if (validVideo) {
            if (meeting.video_id !== validVideo.videoId) {
                // Update with correct video
                await supabase
                    .from('meetings')
                    .update({
                        video_id: validVideo.videoId,
                        video_url: `https://www.youtube.com/watch?v=${validVideo.videoId}`,
                    })
                    .eq('id', meeting.id);

                console.log(`🔧 Fixed: ${meeting.title}`);
                console.log(`   Old: ${meeting.video_id} → New: ${validVideo.videoId}`);
                fixed++;
            } else {
                correct++;
            }
        } else {
            // No valid video found, clear the link
            await supabase
                .from('meetings')
                .update({
                    video_id: null,
                    video_url: null,
                    video_platform: null,
                })
                .eq('id', meeting.id);

            console.log(`🗑️  Cleared invalid video from: ${meeting.title}`);
            cleared++;
        }
    }

    console.log('\n📊 Summary:');
    console.log(`   Fixed with correct video: ${fixed}`);
    console.log(`   Cleared (no valid video): ${cleared}`);
    console.log(`   Already correct: ${correct}`);
}

fixVideoLinks()
    .then(() => {
        console.log('\n✅ Done!');
        process.exit(0);
    })
    .catch((err) => {
        console.error('Fatal error:', err);
        process.exit(1);
    });
