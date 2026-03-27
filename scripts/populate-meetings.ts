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
import { scrapeAgendaPage } from '../lib/data/agenda-scraper';
import { fetchGranicusMeetings } from '../lib/utils/meeting-video-downloader';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

interface ParsedMeeting {
    date: Date;
    meetingType: 'Regular Meeting' | 'Committee Meeting';
    agendaUrl: string | null;
    documentsUrl: string | null;
    minutesUrl: string | null;
    clipId: string | null;
    granicusTitle: string | null;
}

// ================== SCRAPE CITY WEBSITE =============

async function fetchAndParseMeetings(): Promise<ParsedMeeting[]> {
    console.log('📥 Fetching meeting data from city website...');

    try {
        const scrapedDocs = await scrapeAgendaPage();
        const meetingsMap = new Map<string, ParsedMeeting>();

        for (const doc of scrapedDocs) {
            if (!doc.meetingDate) continue;

            const dateStr = doc.meetingDate.toISOString().split('T')[0];

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
                    clipId: null,
                    granicusTitle: null
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

        // Now fetch Granicus meetings and match them by date
        console.log('📺 Fetching videos from Granicus archive...');
        const granicusMeetings = await fetchGranicusMeetings();
        console.log(`   Found ${granicusMeetings.length} Granicus videos`);

        for (const granMeeting of granicusMeetings) {
            const dateStr = granMeeting.date.toISOString().split('T')[0];
            
            // Try to find a matching meeting in our map
            // Note: Granicus often combines committee meetings or calls them "City Council Committee"
            // We search for both Regular and Committee matches on the same day.
            const regKey = `${dateStr}-Regular Meeting`;
            const comKey = `${dateStr}-Committee Meeting`;

            if (meetingsMap.has(regKey) && granMeeting.title.toLowerCase().includes('council')) {
                meetingsMap.get(regKey)!.clipId = granMeeting.clipId;
                meetingsMap.get(regKey)!.granicusTitle = granMeeting.title;
            } else if (meetingsMap.has(comKey) && granMeeting.title.toLowerCase().includes('committee')) {
                meetingsMap.get(comKey)!.clipId = granMeeting.clipId;
                meetingsMap.get(comKey)!.granicusTitle = granMeeting.title;
            }
        }

        console.log(`   Found ${meetingsMap.size} meetings from combined sources`);
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
            .select('id, agenda_url, video_id')
            .gte('scheduled_start', `${dateStr}T00:00:00`)
            .lt('scheduled_start', `${dateStr}T23:59:59`)
            .eq('meeting_type', meeting.meetingType)
            .single();

        if (existing) {
            // Update with document URLs or Granicus ID if missing
            const updates: Record<string, unknown> = {};

            if (!existing.agenda_url && meeting.agendaUrl) {
                updates.agenda_url = meeting.agendaUrl;
                updates.minutes_url = meeting.minutesUrl;
            }

            if (!existing.video_id && meeting.clipId) {
                updates.video_id = meeting.clipId;
                updates.video_url = `https://memphis.granicus.com/MediaPlayer.php?view_id=6&clip_id=${meeting.clipId}`;
                updates.video_platform = 'granicus';
            }

            if (Object.keys(updates).length > 0) {
                await supabase
                    .from('meetings')
                    .update(updates)
                    .eq('id', existing.id);

                console.log(`📄 Updated: ${title} ${updates.video_id ? '(linked video)' : ''}`);
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
                video_id: meeting.clipId,
                video_url: meeting.clipId ? `https://memphis.granicus.com/MediaPlayer.php?view_id=6&clip_id=${meeting.clipId}` : null,
                video_platform: meeting.clipId ? 'granicus' : null,
                processing_status: 'pending',
                transcription_status: 'pending',
                analysis_status: 'pending',
                location: 'Memphis City Hall, Council Chamber'
            };

            const { error } = await supabase.from('meetings').insert(insertData);

            if (error) {
                console.error(`❌ Error creating meeting "${title}":`, JSON.stringify(error, null, 2));
            } else {
                console.log(`✨ Created: ${title} ${meeting.clipId ? '(with video)' : ''}`);
                created++;
            }
        }
    }

    console.log('\n📊 Summary:');
    console.log(`   Created new meetings: ${created}`);
    console.log(`   Updated meetings: ${updated}`);
    console.log(`   Skipped (already exist): ${skipped}`);
    
    return { created, updated, skipped };
}

// ================== MAIN EXPORT ==================

export async function populateMeetings() {
    try {
        const meetings = await fetchAndParseMeetings();
        const stats = await createMeetingRecords(meetings);
        return { success: true, stats };
    } catch (error: any) {
        console.error('Fatal error in populateMeetings:', error);
        return { success: false, error: error.message };
    }
}

