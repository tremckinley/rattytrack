// Database operations for video transcriptions (unified for YouTube, uploads, livestreams)

import { createClient } from '@supabase/supabase-js';
import { YouTubeTranscription, TranscriptSegment, TranscriptionStatus } from '@/lib/types/youtube';

// Use service role key for server-side operations with Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Check if a video has already been transcribed
 */
export async function getTranscription(videoId: string): Promise<YouTubeTranscription | null> {
  const { data, error } = await supabase
    .from('video_transcriptions')
    .select('*')
    .eq('video_id', videoId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching transcription:', error);
    return null;
  }

  return data as YouTubeTranscription;
}

/**
 * Create a new transcription record
 */
export async function createTranscription(data: {
  videoId: string;
  title: string;
  channelTitle: string;
  publishedAt: string;
  duration: number;
  thumbnailUrl: string;
}): Promise<YouTubeTranscription | null> {
  // Check if already exists first
  const existing = await getTranscription(data.videoId);
  if (existing) {
    console.log(`Transcription already exists for ${data.videoId}, returning existing record`);
    return existing;
  }

  const { data: newTranscription, error } = await supabase
    .from('video_transcriptions')
    .insert({
      video_id: data.videoId,
      title: data.title,
      channel_title: data.channelTitle,
      published_at: data.publishedAt,
      duration: data.duration,
      thumbnail_url: data.thumbnailUrl,
      status: 'queued',
      source: 'youtube'
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating transcription:', error);
    return null;
  }

  console.log(`Created transcription record for ${data.videoId}`);
  return newTranscription as YouTubeTranscription;
}

/**
 * Update transcription status
 */
export async function updateTranscriptionStatus(
  videoId: string,
  status: TranscriptionStatus,
  errorMessage?: string
): Promise<void> {
  const { error } = await supabase
    .from('video_transcriptions')
    .update({
      status,
      error_message: errorMessage || null,
      updated_at: new Date().toISOString(),
    })
    .eq('video_id', videoId);

  if (error) {
    console.error('Error updating transcription status:', error);
  }
}

/**
 * Save transcript segments to database
 */
export async function saveTranscriptSegments(
  videoId: string,
  segments: Array<{
    start: number;
    end: number;
    text: string;
    speakerName?: string | null;
    speakerId?: string | null;
  }>,
  cost?: number,
  provider?: string,
  diarizationEnabled?: boolean
): Promise<void> {
  try {
    // Delete any existing segments for this video (for retry scenarios)
    const { error: deleteError } = await supabase
      .from('transcription_segments')
      .delete()
      .eq('video_id', videoId);

    if (deleteError) {
      console.error('Error deleting existing segments:', deleteError);
    } else {
      console.log(`Deleted existing segments for retry`);
    }

    // Insert all segments in batch
    if (segments.length > 0) {
      const segmentsToInsert = segments.map(seg => ({
        video_id: videoId,
        start_time: seg.start,
        end_time: seg.end,
        text: seg.text.trim(),
        speaker_name: seg.speakerName || null,
        speaker_id: seg.speakerId || null,
        source: 'youtube'
      }));

      const { error: insertError } = await supabase
        .from('transcription_segments')
        .insert(segmentsToInsert);

      if (insertError) {
        console.error('Error inserting segments:', insertError);
        throw insertError;
      }

      console.log(`Inserted ${segments.length} transcript segments`);
    }

    // Update transcription record with metadata
    const { error: updateError } = await supabase
      .from('video_transcriptions')
      .update({
        status: 'completed',
        transcription_cost: cost ?? null,
        provider: provider || 'whisper',
        diarization_enabled: diarizationEnabled || false,
        updated_at: new Date().toISOString()
      })
      .eq('video_id', videoId);

    if (updateError) {
      console.error('Error updating transcription record:', updateError);
      throw updateError;
    }

    console.log(`Updated transcription record`);
    console.log(`Successfully saved ${segments.length} segments for video ${videoId}`);
  } catch (error) {
    console.error('Save segments failed:', error);
    throw error;
  }
}

/**
 * Get transcript segments for a video
 */
export async function getTranscriptSegments(videoId: string): Promise<TranscriptSegment[]> {
  const { data, error } = await supabase
    .from('transcription_segments')
    .select('*')
    .eq('video_id', videoId)
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching segments:', error);
    return [];
  }

  return data as TranscriptSegment[];
}

/**
 * Get transcription with segments
 */
export async function getTranscriptionWithSegments(videoId: string): Promise<{
  transcription: YouTubeTranscription | null;
  segments: TranscriptSegment[];
}> {
  const transcription = await getTranscription(videoId);
  const segments = transcription ? await getTranscriptSegments(videoId) : [];

  return { transcription, segments };
}

/**
 * Delete transcription and all segments (for retry)
 */
export async function deleteTranscription(videoId: string): Promise<void> {
  // Segments will be cascade deleted due to foreign key
  const { error } = await supabase
    .from('video_transcriptions')
    .delete()
    .eq('video_id', videoId);

  if (error) {
    console.error('Error deleting transcription:', error);
    throw error;
  }
}

/**
 * Get all transcriptions with pagination
 */
export async function getAllTranscriptions(limit: number = 50, offset: number = 0): Promise<{
  transcriptions: YouTubeTranscription[];
  total: number;
}> {
  const { data, error, count } = await supabase
    .from('video_transcriptions')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching transcriptions:', error);
    return { transcriptions: [], total: 0 };
  }

  return {
    transcriptions: data as YouTubeTranscription[],
    total: count || 0,
  };
}

/**
 * Update speaker IDs for segments with matching speaker label
 */
export async function updateSpeakerMapping(
  videoId: string,
  speakerLabel: string,
  legislatorId: string | null
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('transcription_segments')
    .update({ speaker_id: legislatorId })
    .eq('video_id', videoId)
    .eq('speaker_name', speakerLabel);

  if (error) {
    console.error('Error updating speaker mapping:', error);
    return {
      success: false,
      error: error.message
    };
  }

  return { success: true };
}

/**
 * Get unique speaker labels from a video's transcript
 */
export async function getSpeakerLabels(videoId: string): Promise<{
  labels: Array<{ label: string; segmentCount: number; legislatorId: string | null }>;
  total: number;
}> {
  const { data, error } = await supabase
    .from('transcription_segments')
    .select('speaker_name, speaker_id')
    .eq('video_id', videoId)
    .not('speaker_name', 'is', null);

  if (error) {
    console.error('Error fetching speaker labels:', error);
    return { labels: [], total: 0 };
  }

  if (!data || data.length === 0) {
    return { labels: [], total: 0 };
  }

  // Group by speaker label
  const labelMap = new Map<string, { count: number; legislatorId: string | null }>();

  data.forEach((seg: { speaker_name: string; speaker_id: string | null }) => {
    const label = seg.speaker_name;
    const existing = labelMap.get(label);

    if (existing) {
      existing.count++;
      if (seg.speaker_id && !existing.legislatorId) {
        existing.legislatorId = seg.speaker_id;
      }
    } else {
      labelMap.set(label, {
        count: 1,
        legislatorId: seg.speaker_id,
      });
    }
  });

  const labels = Array.from(labelMap.entries()).map(([label, info]) => ({
    label,
    segmentCount: info.count,
    legislatorId: info.legislatorId,
  }));

  // Sort by segment count
  labels.sort((a, b) => b.segmentCount - a.segmentCount);

  return { labels, total: data.length };
}

export async function getTotalTranscriptions(): Promise<number> {
  const { data, error } = await supabase
    .from('video_transcriptions')
    .select('video_id', { count: 'exact' });

  if (error) {
    console.error('Error fetching total transcriptions:', error);
    return 0;
  }

  return data.length;

}

export async function getTotalTrackedLegislators(): Promise<number> {
  const { data, error } = await supabase
    .rpc('get_unique_speakers');

  if (error) {
    console.error('Error fetching total tracked legislators:', error);
    return 0;
  }

  return data.length;
}

export async function getTotalHoursProcessed(): Promise<number> {
  const { data, error } = await supabase
    .from('video_transcriptions')
    .select('duration')

  const totalDurationMinutes = data?.reduce((total, item) => total + item.duration, 0);

  if (error || !totalDurationMinutes) {
    console.error('Error fetching total hours processed:', error);
    return 0;
  }

  return Math.round(totalDurationMinutes / 60);
}
