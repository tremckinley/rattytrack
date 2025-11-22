import { supabase } from '../../utils/supabase';
import { Pool } from 'pg';

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

export type StatementWithIssue = {
  id: string;
  text: string;
  start_time_seconds: number;
  end_time_seconds: number;
  meeting_date: string;
  meeting_title: string;
  meeting_id: string;
  video_id?: string;
  source?: string;
  issues: Array<{
    issue_name: string;
    issue_slug: string;
    relevance_score: number;
  }>;
};

export async function getLegislatorStatements(legislatorId: string): Promise<StatementWithIssue[]> {
  const pool = getPgPool();
  
  try {
    const result = await pool.query(
      `SELECT 
        s.id,
        s.text,
        s.start_time AS start_time_seconds,
        s.end_time AS end_time_seconds,
        s.video_id,
        s.source,
        v.title AS video_title,
        v.published_at
       FROM transcription_segments s
       LEFT JOIN video_transcriptions v ON s.video_id = v.video_id
       WHERE s.speaker_id = $1
       ORDER BY v.published_at DESC, s.start_time ASC
       LIMIT 50`,
      [legislatorId]
    );

    if (result.rows.length === 0) {
      return [];
    }

    const statements: StatementWithIssue[] = result.rows.map((row: any) => ({
      id: row.id.toString(),
      text: row.text,
      start_time_seconds: parseFloat(row.start_time_seconds),
      end_time_seconds: parseFloat(row.end_time_seconds),
      meeting_date: row.published_at || '',
      meeting_title: row.video_title || 'Unknown Video',
      meeting_id: row.video_id || '',
      video_id: row.video_id,
      source: row.source || 'youtube',
      issues: []
    }));

    return statements;
  } catch (error) {
    console.error('Error fetching legislator statements from PostgreSQL:', error);
    return [];
  }
}
