// Database operations for YouTube transcriptions

import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';
import { YouTubeTranscription, TranscriptSegment, TranscriptionStatus } from '@/lib/types/youtube';

// Use service role key for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Direct PostgreSQL connection to bypass Supabase cache issues
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

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
 * Uses raw SQL to bypass Supabase PostgREST schema cache issues
 */
export async function updateTranscriptionStatus(
  videoId: string,
  status: TranscriptionStatus,
  errorMessage?: string
): Promise<void> {
  const client = await pool.connect();
  
  try {
    const query = `
      UPDATE youtube_transcriptions 
      SET status = $1, 
          error_message = $2, 
          updated_at = NOW()
      WHERE video_id = $3
    `;
    
    await client.query(query, [status, errorMessage || null, videoId]);
  } catch (error) {
    console.error('Error updating transcription status:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Save transcript segments to database
 * Uses raw SQL to bypass Supabase PostgREST schema cache issues
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
  const client = await pool.connect();
  
  try {
    // Begin transaction
    await client.query('BEGIN');
    
    // Insert all segments using raw SQL (bypasses Supabase cache)
    if (segments.length > 0) {
      const values: any[] = [];
      const placeholders: string[] = [];
      
      segments.forEach((seg, index) => {
        const offset = index * 6;
        placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`);
        values.push(
          videoId,
          seg.start,
          seg.end,
          seg.text.trim(),
          seg.speakerName || null,
          seg.speakerId || null
        );
      });
      
      const insertQuery = `
        INSERT INTO youtube_transcript_segments 
        (video_id, start_time, end_time, text, speaker_name, speaker_id)
        VALUES ${placeholders.join(', ')}
      `;
      
      await client.query(insertQuery, values);
    }
    
    // Update transcription to completed status
    const updateQuery = `
      UPDATE youtube_transcriptions 
      SET status = $1, 
          transcription_cost = $2, 
          provider = $3, 
          diarization_enabled = $4, 
          updated_at = NOW()
      WHERE video_id = $5
    `;
    
    await client.query(updateQuery, [
      'completed',
      cost || null,
      provider || 'whisper',
      diarizationEnabled || false,
      videoId
    ]);
    
    // Commit transaction
    await client.query('COMMIT');
    
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('Error saving segments:', error);
    throw error;
  } finally {
    client.release();
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

/**
 * Update speaker IDs for segments with matching speaker label
 */
export async function updateSpeakerMapping(
  videoId: string,
  speakerLabel: string,
  legislatorId: string | null
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('youtube_transcript_segments')
    .update({ speaker_id: legislatorId })
    .eq('video_id', videoId)
    .eq('speaker_name', speakerLabel);

  if (error) {
    console.error('Error updating speaker mapping:', error);
    return { success: false, error: error.message };
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
    .from('youtube_transcript_segments')
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
  
  data.forEach(seg => {
    const label = seg.speaker_name!;
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