// Database operations for council meetings
// Provides data access for meeting pages with filters for date, type, and attendees

import { createClient } from '@supabase/supabase-js';

// Use service role key for server-side operations with Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Types
export interface Meeting {
    id: string;
    legislative_body_id: string | null;
    meeting_type: string;
    title: string;
    description: string | null;
    scheduled_start: string | null;
    scheduled_end: string | null;
    actual_start: string | null;
    actual_end: string | null;
    video_url: string | null;
    video_platform: string | null;
    video_id: string | null;
    video_duration_seconds: number | null;
    processing_status: string;
    transcription_status: string;
    analysis_status: string;
    location: string | null;
    is_virtual: boolean;
    agenda_url: string | null;
    minutes_url: string | null;
    attendance_count: number | null;
    metadata: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
}

export interface MeetingDocument {
    id: string;
    meeting_id: string | null;
    meeting_date: string;
    document_type: string;
    title: string;
    source_url: string;
    file_path: string | null;
    file_size_bytes: number | null;
    extracted_text: string | null;
    text_extraction_status: string;
    page_count: number | null;
    scraped_at: string;
    metadata: Record<string, unknown> | null;
}

export interface MeetingAttendee {
    id: string;
    meeting_id: string;
    legislator_id: string;
    attendance_status: string;
    arrival_time: string | null;
    departure_time: string | null;
    notes: string | null;
    legislator?: {
        id: string;
        display_name: string;
        title: string | null;
        district: string | null;
        photo_url: string | null;
    };
}

export interface MeetingsFilterOptions {
    limit?: number;
    offset?: number;
    meetingType?: string;
    dateFrom?: Date;
    dateTo?: Date;
    attendeeId?: string;
}

/**
 * Get meetings with optional filters
 * Also checks video_transcriptions for actual transcript status
 */
export async function getMeetings(options: MeetingsFilterOptions = {}): Promise<{
    meetings: (Meeting & { has_transcript: boolean })[];
    total: number;
}> {
    const { limit = 50, offset = 0, meetingType, dateFrom, dateTo, attendeeId } = options;

    let query = supabase
        .from('meetings')
        .select('*', { count: 'exact' });

    // Apply filters
    if (meetingType) {
        query = query.eq('meeting_type', meetingType);
    }

    if (dateFrom) {
        query = query.gte('scheduled_start', dateFrom.toISOString());
    }

    if (dateTo) {
        query = query.lte('scheduled_start', dateTo.toISOString());
    }

    // Filter by attendee requires a subquery via meeting_attendees
    if (attendeeId) {
        // Get meeting IDs where this legislator attended
        const { data: attendeeData } = await supabase
            .from('meeting_attendees')
            .select('meeting_id')
            .eq('legislator_id', attendeeId);

        if (attendeeData && attendeeData.length > 0) {
            const meetingIds = attendeeData.map(a => a.meeting_id);
            query = query.in('id', meetingIds);
        } else {
            // No meetings found for this attendee
            return { meetings: [], total: 0 };
        }
    }

    // Order and paginate
    query = query
        .order('scheduled_start', { ascending: false })
        .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
        console.error('Error fetching meetings:', error);
        return { meetings: [], total: 0 };
    }

    const meetingsData = data as Meeting[];

    // Get video IDs that have completed transcriptions
    const videoIds = meetingsData
        .map(m => m.video_id)
        .filter((id): id is string => id !== null);

    let transcribedVideoIds: Set<string> = new Set();

    if (videoIds.length > 0) {
        const { data: transcriptions } = await supabase
            .from('video_transcriptions')
            .select('video_id')
            .in('video_id', videoIds)
            .eq('status', 'completed');

        if (transcriptions) {
            transcribedVideoIds = new Set(transcriptions.map(t => t.video_id));
        }
    }

    // Add has_transcript flag to each meeting
    const meetingsWithTranscriptFlag = meetingsData.map(meeting => ({
        ...meeting,
        has_transcript: meeting.video_id ? transcribedVideoIds.has(meeting.video_id) : false,
    }));

    return {
        meetings: meetingsWithTranscriptFlag,
        total: count || 0,
    };
}

/**
 * Get a single meeting by ID
 */
export async function getMeetingById(meetingId: string): Promise<Meeting | null> {
    const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('id', meetingId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            return null;
        }
        console.error('Error fetching meeting:', error);
        return null;
    }

    return data as Meeting;
}

/**
 * Get a meeting by its associated video ID
 */
export async function getMeetingByVideoId(videoId: string): Promise<Meeting | null> {
    const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('video_id', videoId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            return null;
        }
        console.error('Error fetching meeting by video ID:', error);
        return null;
    }

    return data as Meeting;
}

/**
 * Get documents associated with a meeting
 */
export async function getMeetingDocuments(meetingId: string): Promise<MeetingDocument[]> {
    const { data, error } = await supabase
        .from('meeting_documents')
        .select('*')
        .eq('meeting_id', meetingId)
        .order('document_type', { ascending: true });

    if (error) {
        console.error('Error fetching meeting documents:', error);
        return [];
    }

    return data as MeetingDocument[];
}

/**
 * Get attendees for a meeting with legislator details
 */
export async function getMeetingAttendees(meetingId: string): Promise<MeetingAttendee[]> {
    const { data, error } = await supabase
        .from('meeting_attendees')
        .select(`
      *,
      legislator:legislators(
        id,
        display_name,
        title,
        district,
        photo_url
      )
    `)
        .eq('meeting_id', meetingId)
        .order('arrival_time', { ascending: true });

    if (error) {
        console.error('Error fetching meeting attendees:', error);
        return [];
    }

    return data as MeetingAttendee[];
}

/**
 * Get all meeting data in one call - meeting, documents, attendees, and linked transcription
 */
export async function getFullMeetingData(meetingId: string): Promise<{
    meeting: Meeting | null;
    documents: MeetingDocument[];
    attendees: MeetingAttendee[];
    hasTranscript: boolean;
}> {
    const meeting = await getMeetingById(meetingId);

    if (!meeting) {
        return {
            meeting: null,
            documents: [],
            attendees: [],
            hasTranscript: false,
        };
    }

    const [documents, attendees] = await Promise.all([
        getMeetingDocuments(meetingId),
        getMeetingAttendees(meetingId),
    ]);

    // Check if there's a linked transcription
    let hasTranscript = false;
    if (meeting.video_id) {
        const { data } = await supabase
            .from('video_transcriptions')
            .select('status')
            .eq('video_id', meeting.video_id)
            .eq('status', 'completed')
            .single();

        hasTranscript = !!data;
    }

    return {
        meeting,
        documents,
        attendees,
        hasTranscript,
    };
}

/**
 * Get unique meeting types for filter dropdown
 */
export async function getMeetingTypes(): Promise<string[]> {
    const { data, error } = await supabase
        .from('meetings')
        .select('meeting_type')
        .order('meeting_type');

    if (error) {
        console.error('Error fetching meeting types:', error);
        return [];
    }

    // Get unique values
    const types = [...new Set(data.map(d => d.meeting_type))];
    return types;
}

/**
 * Get legislators for the attendee filter dropdown
 */
export async function getLegislatorsForFilter(): Promise<Array<{ id: string; display_name: string }>> {
    const { data, error } = await supabase
        .from('legislators')
        .select('id, display_name')
        .eq('is_active', true)
        .order('display_name');

    if (error) {
        console.error('Error fetching legislators for filter:', error);
        return [];
    }

    return data;
}
