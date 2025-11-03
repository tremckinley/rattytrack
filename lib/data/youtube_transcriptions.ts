// Database operations for YouTube transcriptions

import { createClient } from '@supabase/supabase-js';
import { YouTubeTranscription, TranscriptSegment, TranscriptionStatus } from '@/lib/types/youtube';

// Use service role key for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Check if a video has already been transcribed
 */
export async function getTranscription(videoId: string): Promise<YouTubeTranscription | null> {
  const { data, error } = await supabase
    .from('youtube_transcriptions')
    .select('*')
    .eq('video_id', videoId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching transcription:', error);
    return null;
  }

  return data as YouTubeTranscription | null;
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

  const { data: transcription, error } = await supabase
    .from('youtube_transcriptions')
    .insert({
      video_id: data.videoId,
      title: data.title,
      channel_title: data.channelTitle,
      published_at: data.publishedAt,
      duration: data.duration,
      thumbnail_url: data.thumbnailUrl,
      status: 'processing',
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error creating transcription:', error);
    return null;
  }

  return transcription as YouTubeTranscription | null;
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
    .from('youtube_transcriptions')
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
  segments: Array<{ start: number; end: number; text: string }>,
  cost?: number
): Promise<void> {
  // Insert all segments
  const { error: segmentsError } = await supabase
    .from('youtube_transcript_segments')
    .insert(
      segments.map(seg => ({
        video_id: videoId,
        start_time: seg.start,
        end_time: seg.end,
        text: seg.text.trim(),
      }))
    );

  if (segmentsError) {
    console.error('Error saving segments:', segmentsError);
    throw segmentsError;
  }

  // Update transcription to completed status
  const { error: updateError } = await supabase
    .from('youtube_transcriptions')
    .update({
      status: 'completed',
      transcription_cost: cost,
      updated_at: new Date().toISOString(),
    })
    .eq('video_id', videoId);

  if (updateError) {
    console.error('Error updating transcription:', updateError);
    throw updateError;
  }
}

/**
 * Get transcript segments for a video
 */
export async function getTranscriptSegments(videoId: string): Promise<TranscriptSegment[]> {
  const { data, error } = await supabase
    .from('youtube_transcript_segments')
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
    .from('youtube_transcriptions')
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
    .from('youtube_transcriptions')
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