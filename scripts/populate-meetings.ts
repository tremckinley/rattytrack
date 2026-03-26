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

async function createMeetingRecords(meetings: ParsedMeeting[]) {
    console.log(`\n📝 Processing ${meetings.length} meetings...\n`);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const meeting of meetings) {
        const dateStr = meeting.date.toISOString().split('T')[0];
        const title = `Memphis City Council ${meeting.meetingType} - ${meeting.date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        })}`;

        // Check if meeting already exists
        const { data: existing } = await supabase
            .from('meetings')
            .select('id, agenda_url')
            .gte('scheduled_start', `${dateStr}T00:00:00`)
            .lt('scheduled_start', `${dateStr}T23:59:59`)
            .eq('meeting_type', meeting.meetingType)
            .single();

        if (existing) {
            // Update with document URLs if missing
            const updates: Record<string, unknown> = {};

            if (!existing.agenda_url && meeting.agendaUrl) {
                updates.agenda_url = meeting.agendaUrl;
                updates.minutes_url = meeting.minutesUrl;
            }

            if (Object.keys(updates).length > 0) {
                await supabase
                    .from('meetings')
                    .update(updates)
                    .eq('id', existing.id);

                console.log(`📄 Updated documents for: ${title}`);
                updated++;
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

            const { error } = await supabase.from('meetings').insert(insertData);

            if (error) {
                console.error(`❌ Error creating meeting "${title}":`, JSON.stringify(error, null, 2));
            } else {
                console.log(`✨ Created: ${title}`);
                created++;
            }
        }
    }

    console.log('\n📊 Summary:');
    console.log(`   Created new meetings: ${created}`);
    console.log(`   Updated with documents: ${updated}`);
    console.log(`   Skipped (already exist): ${skipped}`);
    
    return { created, updated, skipped };
}

// ================== MAIN EXPORT ==================

export async function populateMeetings() {
    try {
        // Fetch data from Memphis City Council agenda website natively
        const meetings = await fetchAndParseMeetings();

        // Create/update meeting records
        const stats = await createMeetingRecords(meetings);
        return { success: true, stats };
    } catch (error: any) {
        console.error('Fatal error in populateMeetings:', error);
        return { success: false, error: error.message };
    }
}
