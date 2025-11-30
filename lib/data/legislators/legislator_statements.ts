import { supabaseAdmin } from '../../utils/supabase-admin';

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
  try {
    const { data, error } = await supabaseAdmin
      .from('transcription_segments')
      .select(`
        id,
        text,
        start_time,
        end_time,
        video_id,
        source,
        video_transcriptions (
          title,
          published_at
        )
      `)
      .eq('speaker_id', legislatorId)
      .order('video_transcriptions(published_at)', { ascending: false })
      .order('start_time', { ascending: true })
      .limit(50);

    if (error) {
      console.error('Error fetching legislator statements from Supabase:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Transform the data to match our type
    const statements: StatementWithIssue[] = data.map((row: any) => {
      const videoTranscription = Array.isArray(row.video_transcriptions)
        ? row.video_transcriptions[0]
        : row.video_transcriptions;

      return {
        id: row.id.toString(),
        text: row.text,
        start_time_seconds: typeof row.start_time === 'string' ? parseFloat(row.start_time) : row.start_time,
        end_time_seconds: typeof row.end_time === 'string' ? parseFloat(row.end_time) : row.end_time,
        meeting_date: videoTranscription?.published_at || '',
        meeting_title: videoTranscription?.title || 'Unknown Video',
        meeting_id: row.video_id || '',
        video_id: row.video_id || undefined,
        source: row.source || 'youtube',
        issues: []
      };
    });

    return statements;
  } catch (error) {
    console.error('Error fetching legislator statements from Supabase:', error);
    return [];
  }
}
