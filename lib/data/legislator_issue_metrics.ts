import { supabase } from '../utils/supabase';

export type LegislatorIssueMetric = {
  issue_id: string;
  issue_name: string;
  total_mentions: number;
  positive_mentions: number;
  negative_mentions: number;
  neutral_mentions: number;
  average_sentiment_score: number;
  total_speaking_time_seconds: number;
};

type LegislatorTopIssueRow = {
  issue_id: string;
  mention_count: number;
  total_speaking_time_seconds: number;
  avg_sentiment: number;
  positive_count: number;
  negative_count: number;
  neutral_count: number;
  issues: Array<{
    name: string;
  }> | null;
};

/**
 * Fetches legislator issue metrics from the legislator_top_issues materialized view
 * This provides sentiment breakdown per issue for a given legislator
 */
export async function getLegislatorIssueMetrics(legislatorId: string, limit: number = 10): Promise<LegislatorIssueMetric[]> {
  try {
    const { data, error } = await supabase
      .from('legislator_top_issues')
      .select(`
        issue_id,
        mention_count,
        total_speaking_time_seconds,
        avg_sentiment,
        positive_count,
        negative_count,
        neutral_count,
        issues:issue_id (
          name
        )
      `)
      .eq('legislator_id', legislatorId)
      .order('mention_count', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching legislator issue metrics:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Transform the data to match our type
    return data.map((row: LegislatorTopIssueRow) => ({
      issue_id: row.issue_id,
      issue_name: row.issues?.[0]?.name || 'Unknown Issue',
      total_mentions: row.mention_count || 0,
      positive_mentions: row.positive_count || 0,
      negative_mentions: row.negative_count || 0,
      neutral_mentions: row.neutral_count || 0,
      average_sentiment_score: row.avg_sentiment || 0,
      total_speaking_time_seconds: row.total_speaking_time_seconds || 0,
    }));
  } catch (error) {
    console.error('Unexpected error fetching legislator issue metrics:', error);
    return [];
  }
}

/**
 * Fallback function that aggregates from segment_issues directly
 * Use this if the materialized view doesn't exist yet
 */
export async function getLegislatorIssueMetricsDirect(legislatorId: string, limit: number = 10): Promise<LegislatorIssueMetric[]> {
  try {
    const { data, error } = await supabase.rpc('get_legislator_issue_breakdown', {
      p_legislator_id: legislatorId,
      p_limit: limit
    });

    if (error) {
      // RPC function doesn't exist yet - this is expected before applying schema improvements
      console.log('RPC function not available yet, returning empty array');
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error fetching legislator issue metrics (direct):', error);
    return [];
  }
}
