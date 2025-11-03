import { supabase } from '../utils/supabase';
import type { UploadedMeeting, UploadedMeetingSegment } from '@/types/UploadedMeeting';

/**
 * Get all uploaded meetings, sorted by most recent
 */
export async function getUploadedMeetings(limit: number = 50): Promise<UploadedMeeting[]> {
  try {
    const { data, error } = await supabase
      .from('uploaded_meetings')
      .select('*')
      .eq('is_active', true)
      .order('uploaded_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching uploaded meetings:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error fetching uploaded meetings:', error);
    return [];
  }
}

/**
 * Get completed uploaded meetings only
 */
export async function getCompletedUploadedMeetings(limit: number = 50): Promise<UploadedMeeting[]> {
  try {
    const { data, error } = await supabase
      .from('uploaded_meetings')
      .select('*')
      .eq('is_active', true)
      .eq('transcription_status', 'completed')
      .order('uploaded_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching completed meetings:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error fetching completed meetings:', error);
    return [];
  }
}

/**
 * Get a single uploaded meeting with its segments
 */
export async function getUploadedMeetingWithSegments(
  meetingId: string
): Promise<{ meeting: UploadedMeeting | null; segments: UploadedMeetingSegment[] }> {
  try {
    const { data: meeting, error: meetingError } = await supabase
      .from('uploaded_meetings')
      .select('*')
      .eq('id', meetingId)
      .eq('is_active', true)
      .single();

    if (meetingError || !meeting) {
      console.error('Error fetching meeting:', meetingError);
      return { meeting: null, segments: [] };
    }

    const { data: segments, error: segmentsError } = await supabase
      .from('uploaded_meeting_segments')
      .select('*')
      .eq('uploaded_meeting_id', meetingId)
      .order('segment_index', { ascending: true });

    if (segmentsError) {
      console.error('Error fetching segments:', segmentsError);
      return { meeting, segments: [] };
    }

    return { meeting, segments: segments || [] };
  } catch (error) {
    console.error('Unexpected error fetching meeting with segments:', error);
    return { meeting: null, segments: [] };
  }
}

type TranscriptSearchResult = {
  uploaded_meeting_id: string;
  segment_text: string;
  start_time_seconds: number;
  end_time_seconds: number;
  meeting_title: string;
  uploaded_at: string;
};

/**
 * Search uploaded meeting transcripts
 */
export async function searchUploadedTranscripts(
  searchQuery: string,
  limit: number = 20
): Promise<TranscriptSearchResult[]> {
  try {
    const { data, error } = await supabase.rpc('search_uploaded_transcripts', {
      search_query: searchQuery,
      result_limit: limit
    });

    if (error) {
      console.error('Error searching transcripts:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error searching transcripts:', error);
    return [];
  }
}
