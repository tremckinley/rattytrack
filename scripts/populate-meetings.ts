/**
 * Populate Meetings Script
 * 
 * This script:
 * 1. Scrapes meeting data from the Memphis City Council website
 * 2. Fetches videos from the Memphis City Council YouTube channel
 * 3. Creates meeting records and links videos by matching dates
 * 
 * Run with: npx tsx scripts/populate-meetings.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as cheerio from 'cheerio';
import { scrapeAgendaPage, ScrapedDocument } from '../lib/data/agenda-scraper';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const MEMPHIS_AGENDA_URL = 'https://memphistn.gov/city-council-meeting-agenda/';
const CHANNEL_HANDLE = '@MemphisCityCouncil';

interface ParsedMeeting {
    date: Date;
    meetingType: 'Regular Meeting' | 'Committee Meeting';
    agendaUrl: string | null;
    documentsUrl: string | null;
    minutesUrl: string | null;
}

interface YouTubeVideo {
    videoId: string;
    title: string;
    publishedAt: string;
    parsedDate: Date | null;
    meetingType: string | null;
}

// ================== DATE PARSING ==================

/**
 * Parse date from URL filename
 */
function parseDateFromUrl(url: string): Date | null {
    // Try MM.DD.YYYY format
    const dotMatch = url.match(/(\d{2})\.(\d{2})\.(\d{4})/);
    if (dotMatch) {
        const month = parseInt(dotMatch[1]) - 1;
        const day = parseInt(dotMatch[2]);
        const year = parseInt(dotMatch[3]);
        return new Date(year, month, day);
    }

    // Try MM-DD-YYYY format
    const dashMatch = url.match(/(\d{2})-(\d{2})-(\d{4})/);
    if (dashMatch) {
        const month = parseInt(dashMatch[1]) - 1;
        const day = parseInt(dashMatch[2]);
        const year = parseInt(dashMatch[3]);
        return new Date(year, month, day);
    }

    // Try to find date like "January-7-2025"
    const monthNameMatch = url.match(
        /(January|February|March|April|May|June|July|August|September|October|November|December)[- ](\d{1,2})[- ](\d{4})/i
    );
    if (monthNameMatch) {
        const monthNames = [
            'january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'
        ];
        const month = monthNames.indexOf(monthNameMatch[1].toLowerCase());
        const day = parseInt(monthNameMatch[2]);
        const year = parseInt(monthNameMatch[3]);
        if (month >= 0) {
            return new Date(year, month, day);
        }
    }

    return null;
}

/**
 * Parse date from video title
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

    // Try MM/DD/YYYY or MM-DD-YYYY
    const slashMatch = title.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/);
    if (slashMatch) {
        const month = parseInt(slashMatch[1]) - 1;
        const day = parseInt(slashMatch[2]);
        const year = parseInt(slashMatch[3]);
        return new Date(year, month, day);
    }

    return null;
}

/**
 * Determine meeting type from link text or URL
 */
function getMeetingTypeFromUrl(linkText: string, url: string): 'Regular Meeting' | 'Committee Meeting' | null {
    const text = linkText.toLowerCase();
    const urlLower = url.toLowerCase();

    if (text.includes('committee') || urlLower.includes('committee')) {
        return 'Committee Meeting';
    }
    if (text.includes('regular') || urlLower.includes('regular') || urlLower.includes('/ag-')) {
        return 'Regular Meeting';
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
    return 'Regular Meeting';
}

/**
 * Check if a video title indicates an actual full meeting recording
 * Returns false for recaps, highlights, previews, announcements, etc.
 */
function isActualMeetingVideo(title: string): boolean {
    const lowerTitle = title.toLowerCase();

    // Exclude non-meeting content
    const excludeKeywords = [
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
    ];

    for (const keyword of excludeKeywords) {
        if (lowerTitle.includes(keyword)) {
            return false;
        }
    }

    // Must contain meeting-related keywords
    const requiredKeywords = [
        'meeting',
        'session',
        'council',
    ];

    for (const keyword of requiredKeywords) {
        if (lowerTitle.includes(keyword)) {
            return true;
        }
    }

    // If no required keyword found, it's probably not a meeting video
    return false;
}

// ================== YOUTUBE API ==================

/**
 * Get channel ID from channel handle
 */
async function getChannelId(handle: string): Promise<string | null> {
    try {
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(handle)}&type=channel&maxResults=1&key=${YOUTUBE_API_KEY}`
        );
        const data = await response.json();
        return data.items?.[0]?.id?.channelId || null;
    } catch (error) {
        console.error('Error fetching channel ID:', error);
        return null;
    }
}

/**
 * Fetch all videos from the channel (up to 2 years back)
 */
async function fetchAllChannelVideos(): Promise<YouTubeVideo[]> {
    if (!YOUTUBE_API_KEY) {
        console.log('⚠️  YOUTUBE_API_KEY not set, skipping video fetch');
        return [];
    }

    console.log('📺 Fetching videos from YouTube channel...');

    const channelId = await getChannelId(CHANNEL_HANDLE);
    if (!channelId) {
        console.log('⚠️  Could not find YouTube channel');
        return [];
    }

    const videos: YouTubeVideo[] = [];
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

        if (!response.ok) {
            const error = await response.json();
            console.error('YouTube API error:', error.error?.message);
            break;
        }

        const data = await response.json();

        for (const item of data.items || []) {
            const title = item.snippet.title;

            // Skip non-meeting videos (recaps, highlights, etc.)
            if (!isActualMeetingVideo(title)) {
                console.log(`   ⏭️  Skipping non-meeting video: "${title}"`);
                continue;
            }

            const parsedDate = parseDateFromTitle(title);
            const meetingType = getMeetingTypeFromTitle(title);

            videos.push({
                videoId: item.id.videoId,
                title,
                publishedAt: item.snippet.publishedAt,
                parsedDate,
                meetingType: parsedDate ? meetingType : null,
            });

            if (title.includes('January 27') || title.includes('February 3')) {
                console.log(`[DEBUG] Found YouTube video: "${title}", parsedDate=${parsedDate?.toISOString().split('T')[0]}, meetingType=${meetingType}`);
            }
        }

        nextPageToken = data.nextPageToken;
    } while (nextPageToken);

    console.log(`   Found ${videos.length} meeting videos (filtered)`);
    return videos;
}

// ================== SCRAPE CITY WEBSITE ==================

async function fetchAndParseMeetings(): Promise<ParsedMeeting[]> {
    console.log('📥 Fetching meeting data from city website...');

    try {
        const scrapedDocs = await scrapeAgendaPage();
        const meetingsMap = new Map<string, ParsedMeeting>();

        for (const doc of scrapedDocs) {
            if (!doc.meetingDate) continue;

            const dateStr = doc.meetingDate.toISOString().split('T')[0];

            // Map granular document types to meeting types
            let meetingType: 'Regular Meeting' | 'Committee Meeting' | null = null;
            if (doc.documentType === 'regular_agenda' || doc.documentType === 'regular_docs' || doc.documentType === 'pz_regular_docs') {
                meetingType = 'Regular Meeting';
            } else if (doc.documentType === 'committee_agenda' || doc.documentType === 'committee_docs' || doc.documentType === 'pz_committee_docs') {
                meetingType = 'Committee Meeting';
            }

            if (!meetingType) continue;

            const key = `${dateStr}-${meetingType}`;

            if (!meetingsMap.has(key)) {
                meetingsMap.set(key, {
                    date: doc.meetingDate,
                    meetingType,
                    agendaUrl: null,
                    documentsUrl: null,
                    minutesUrl: null,
                });
            }

            const meeting = meetingsMap.get(key)!;

            if (doc.documentType === 'regular_agenda' || doc.documentType === 'committee_agenda') {
                meeting.agendaUrl = doc.url;
            } else if (doc.documentType === 'regular_docs' || doc.documentType === 'committee_docs' || doc.documentType === 'pz_regular_docs' || doc.documentType === 'pz_committee_docs') {
                meeting.documentsUrl = doc.url;
            } else if (doc.documentType === 'minutes') {
                meeting.minutesUrl = doc.url;
            }
        }

        console.log(`   Found ${meetingsMap.size} meetings from website`);
        return Array.from(meetingsMap.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch (error) {
        console.error('Error fetching/parsing meetings:', error);
        return [];
    }
}

// ================== DATABASE OPERATIONS ==================

async function createMeetingRecords(meetings: ParsedMeeting[], videos: YouTubeVideo[]) {
    console.log(`\n📝 Processing ${meetings.length} meetings...\n`);

    // Build video lookup by date
    const videosByDate = new Map<string, YouTubeVideo>();
    for (const video of videos) {
        if (video.parsedDate && video.meetingType) {
            const key = `${video.parsedDate.toISOString().split('T')[0]}-${video.meetingType}`;
            if (!videosByDate.has(key)) {
                videosByDate.set(key, video);
            }
        }
    }

    let created = 0;
    let updated = 0;
    let linked = 0;
    let skipped = 0;

    for (const meeting of meetings) {
        const dateStr = meeting.date.toISOString().split('T')[0];
        const title = `Memphis City Council ${meeting.meetingType} - ${meeting.date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        })}`;

        // Check for matching video
        const videoKey = `${dateStr}-${meeting.meetingType}`;
        const matchingVideo = videosByDate.get(videoKey);

        // Check if meeting already exists
        const { data: existing } = await supabase
            .from('meetings')
            .select('id, agenda_url, video_id')
            .gte('scheduled_start', `${dateStr}T00:00:00`)
            .lt('scheduled_start', `${dateStr}T23:59:59`)
            .eq('meeting_type', meeting.meetingType)
            .single();

        if (dateStr === '2026-01-27' || dateStr === '2026-02-03') {
            const { count } = await supabase
                .from('meetings')
                .select('*', { count: 'exact', head: true })
                .gte('scheduled_start', `${dateStr}T00:00:00`)
                .lt('scheduled_start', `${dateStr}T23:59:59`);

            console.log(`[DEBUG] ${dateStr} ${meeting.meetingType}: count=${count}, existing=${existing ? 'YES' : 'NO'}`);
        }

        if (existing) {
            // Update with document URLs or video if missing
            const updates: Record<string, unknown> = {};

            if (!existing.agenda_url && meeting.agendaUrl) {
                updates.agenda_url = meeting.agendaUrl;
                updates.minutes_url = meeting.minutesUrl;
            }

            if (!existing.video_id && matchingVideo) {
                updates.video_id = matchingVideo.videoId;
                updates.video_url = `https://www.youtube.com/watch?v=${matchingVideo.videoId}`;
                updates.video_platform = 'youtube';
            }

            if (Object.keys(updates).length > 0) {
                await supabase
                    .from('meetings')
                    .update(updates)
                    .eq('id', existing.id);

                if (updates.video_id) {
                    console.log(`🔗 Linked video to: ${title}`);
                    linked++;
                } else {
                    console.log(`📄 Updated documents for: ${title}`);
                    updated++;
                }
            } else {
                skipped++;
            }
        } else {
            // Create new meeting
            const insertData: Record<string, unknown> = {
                meeting_type: meeting.meetingType,
                title,
                scheduled_start: meeting.date.toISOString(),
                agenda_url: meeting.agendaUrl,
                minutes_url: meeting.minutesUrl,
                processing_status: 'pending',
                transcription_status: 'pending',
                analysis_status: 'pending',
                location: 'Memphis City Hall, Council Chamber'
            };

            if (matchingVideo) {
                insertData.video_id = matchingVideo.videoId;
                insertData.video_url = `https://www.youtube.com/watch?v=${matchingVideo.videoId}`;
                insertData.video_platform = 'youtube';
                insertData.processing_status = 'completed';
            }

            const { error } = await supabase.from('meetings').insert(insertData);

            if (error) {
                console.error(`❌ Error creating meeting "${title}":`, JSON.stringify(error, null, 2));
            } else {
                console.log(`[DEBUG] Successfully created meeting: ${title}`);
                if (matchingVideo) {
                    console.log(`✨ Created with video: ${title}`);
                } else {
                    console.log(`✨ Created: ${title}`);
                }
                created++;
            }
        }
    }

    console.log('\n📊 Summary:');
    console.log(`   Created new meetings: ${created}`);
    console.log(`   Linked videos: ${linked}`);
    console.log(`   Updated with documents: ${updated}`);
    console.log(`   Skipped (already exist): ${skipped}`);
}

// ================== MAIN ==================

async function populateMeetings() {
    try {
        // Fetch data from both sources
        const [meetings, videos] = await Promise.all([
            fetchAndParseMeetings(),
            fetchAllChannelVideos(),
        ]);

        // Create/update meeting records
        await createMeetingRecords(meetings, videos);

    } catch (error) {
        console.error('Fatal error:', error);
        throw error;
    }
}

populateMeetings()
    .then(() => {
        console.log('\n✅ Done!');
        process.exit(0);
    })
    .catch((err) => {
        console.error('Fatal error:', err);
        process.exit(1);
    });
