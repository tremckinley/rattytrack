import { supabase } from '../utils/supabase';

export type StatementWithIssue = {
  id: string;
  text: string;
  start_time_seconds: number;
  end_time_seconds: number;
  meeting_date: string;
  meeting_title: string;
  meeting_id: string;
  issues: Array<{
    issue_name: string;
    issue_slug: string;
    relevance_score: number;
  }>;
};

export async function getLegislatorStatements(legislatorId: string): Promise<StatementWithIssue[]> {
  try {
    const { data: segments, error } = await supabase
      .from('transcription_segments')
      .select(`
        id,
        text,
        start_time_seconds,
        end_time_seconds,
        meeting:meetings (
          id,
          title,
          scheduled_start
        )
      `)
      .eq('speaker_id', legislatorId)
      .order('start_time_seconds', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching statements:', error);
      return [];
    }

    if (!segments || segments.length === 0) {
      return [];
    }

    const segmentIds = segments.map(s => s.id);
    const { data: segmentIssues, error: issuesError } = await supabase
      .from('segment_issues')
      .select(`
        segment_id,
        relevance_score,
        issue:issues (
          name,
          slug
        )
      `)
      .in('segment_id', segmentIds);

    if (issuesError) {
      console.error('Error fetching segment issues:', issuesError);
    }

    const issuesBySegment = new Map<string, Array<{ issue_name: string; issue_slug: string; relevance_score: number }>>();
    
    if (segmentIssues) {
      segmentIssues.forEach((si: any) => {
        if (!issuesBySegment.has(si.segment_id)) {
          issuesBySegment.set(si.segment_id, []);
        }
        issuesBySegment.get(si.segment_id)!.push({
          issue_name: si.issue?.name || 'Unknown',
          issue_slug: si.issue?.slug || '',
          relevance_score: si.relevance_score || 0
        });
      });
    }

    const statements: StatementWithIssue[] = segments.map((segment: any) => ({
      id: segment.id,
      text: segment.text,
      start_time_seconds: segment.start_time_seconds,
      end_time_seconds: segment.end_time_seconds,
      meeting_date: segment.meeting?.scheduled_start || '',
      meeting_title: segment.meeting?.title || 'Unknown Meeting',
      meeting_id: segment.meeting?.id || '',
      issues: issuesBySegment.get(segment.id) || []
    }));

    statements.sort((a, b) => {
      const dateA = new Date(a.meeting_date).getTime();
      const dateB = new Date(b.meeting_date).getTime();
      return dateB - dateA;
    });

    return statements;
  } catch (error) {
    console.error('Unexpected error fetching statements:', error);
    return [];
  }
}
