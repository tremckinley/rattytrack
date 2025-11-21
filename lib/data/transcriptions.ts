// Database operations for video transcriptions (unified for YouTube, uploads, livestreams)

import { createClient } from '@supabase/supabase-js';
import { YouTubeTranscription, TranscriptSegment, TranscriptionStatus } from '@/lib/types/youtube';
import { Pool } from 'pg';

// Use service role key for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Direct PostgreSQL connection pool for reliable writes
let pgPool: Pool | null = null;

function getPgPool(): Pool {
  if (!pgPool) {
    pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pgPool;
}

/**
 * Check if a video has already been transcribed
 * Using direct PostgreSQL to avoid PostgREST cache issues
 */
export async function getTranscription(videoId: string): Promise<YouTubeTranscription | null> {
  const pool = getPgPool();
  
  try {
    const result = await pool.query(
      'SELECT * FROM video_transcriptions WHERE video_id = $1',
      [videoId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0] as YouTubeTranscription;
  } catch (error) {
    console.error('Error fetching transcription:', error);
    return null;
  }
}

/**
 * Create a new transcription record using direct PostgreSQL
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

  const pool = getPgPool();
  
  try {
    const result = await pool.query(
      `INSERT INTO video_transcriptions 
       (video_id, title, channel_title, published_at, duration, thumbnail_url, status, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [data.videoId, data.title, data.channelTitle, data.publishedAt, data.duration, data.thumbnailUrl, 'processing', 'youtube']
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    console.log(`Created transcription record for ${data.videoId}`);
    return result.rows[0] as YouTubeTranscription;
  } catch (error) {
    console.error('Error creating transcription:', error);
    return null;
  }
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
 * Save transcript segments to database using direct PostgreSQL connection
 * This bypasses Supabase PostgREST client issues with schema cache
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
  const pool = getPgPool();
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Delete any existing segments for this video (for retry scenarios)
    const deleteResult = await client.query(
      'DELETE FROM transcription_segments WHERE video_id = $1',
      [videoId]
    );
    console.log(`Deleted ${deleteResult.rowCount} existing segments for retry`);
    
    // Insert all segments using bulk insert
    if (segments.length > 0) {
      const values: any[] = [];
      const placeholders: string[] = [];
      
      segments.forEach((seg, i) => {
        const offset = i * 7;
        placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`);
        values.push(
          videoId,
          seg.start,
          seg.end,
          seg.text.trim(),
          seg.speakerName || null,
          seg.speakerId || null,
          'youtube'
        );
      });
      
      const insertQuery = `
        INSERT INTO transcription_segments 
        (video_id, start_time, end_time, text, speaker_name, speaker_id, source)
        VALUES ${placeholders.join(', ')}
      `;
      
      const insertResult = await client.query(insertQuery, values);
      console.log(`Inserted ${insertResult.rowCount} transcript segments`);
    }
    
    // Update transcription record with metadata
    const updateResult = await client.query(
      `UPDATE video_transcriptions 
       SET status = $1,
           transcription_cost = $2,
           provider = $3,
           diarization_enabled = $4,
           updated_at = NOW()
       WHERE video_id = $5`,
      ['completed', cost ?? null, provider || 'whisper', diarizationEnabled || false, videoId]
    );
    
    console.log(`Updated transcription record: ${updateResult.rowCount} rows affected`);
    
    if (updateResult.rowCount === 0) {
      throw new Error(`No transcription record found for video ${videoId}`);
    }
    
    await client.query('COMMIT');
    console.log(`Successfully saved ${segments.length} segments for video ${videoId}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Transaction failed, rolled back:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get transcript segments for a video using direct PostgreSQL
 */
export async function getTranscriptSegments(videoId: string): Promise<TranscriptSegment[]> {
  const pool = getPgPool();
  
  try {
    const result = await pool.query(
      'SELECT * FROM transcription_segments WHERE video_id = $1 ORDER BY start_time ASC',
      [videoId]
    );
    
    return result.rows as TranscriptSegment[];
  } catch (error) {
    console.error('Error fetching segments:', error);
    return [];
  }
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
 * Update speaker IDs for segments with matching speaker label using direct PostgreSQL
 */
export async function updateSpeakerMapping(
  videoId: string,
  speakerLabel: string,
  legislatorId: string | null
): Promise<{ success: boolean; error?: string }> {
  const pool = getPgPool();
  
  try {
    await pool.query(
      'UPDATE transcription_segments SET speaker_id = $1 WHERE video_id = $2 AND speaker_name = $3',
      [legislatorId, videoId, speakerLabel]
    );
    return { success: true };
  } catch (error) {
    console.error('Error updating speaker mapping:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get unique speaker labels from a video's transcript using direct PostgreSQL
 */
export async function getSpeakerLabels(videoId: string): Promise<{
  labels: Array<{ label: string; segmentCount: number; legislatorId: string | null }>;
  total: number;
}> {
  const pool = getPgPool();
  
  try {
    const result = await pool.query(
      'SELECT speaker_name, speaker_id FROM transcription_segments WHERE video_id = $1 AND speaker_name IS NOT NULL',
      [videoId]
    );

    if (result.rows.length === 0) {
      return { labels: [], total: 0 };
    }

    // Group by speaker label
    const labelMap = new Map<string, { count: number; legislatorId: string | null }>();
    
    result.rows.forEach((seg: any) => {
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

    return { labels, total: result.rows.length };
  } catch (error) {
    console.error('Error fetching speaker labels:', error);
    return { labels: [], total: 0 };
  }
}