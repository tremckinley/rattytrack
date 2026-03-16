import { supabase } from '../utils/supabase';


export async function getIssueIds(): Promise<Map<string, string> | null> {
      const { data, error } = await supabase
      .from('issues')
      .select('id, name')

  if (error) {
      console.error('Error fetching issue IDs:', error);
      return null;
  }

  const issueIds = new Map<string, string>();
  data?.forEach((issue) => {
      issueIds.set(issue.id, issue.name);
  });
  return issueIds.size > 0 ? issueIds : null;
}

export async function getTotalIssues(): Promise<number> {
  const { data, error } = await supabase
    .from('issues')
    .select('id', { count: 'exact' });

  if (error) {
    console.error('Error fetching total issues:', error);
    return 0;
  }

  return data.length;
}

export interface TopIssueOverall {
  id: string;
  name: string;
  mentionCount: number;
}

/**
 * Get top issues across all meetings, ordered by mention count
 */
export async function getTopIssuesOverall(limit: number = 6): Promise<TopIssueOverall[]> {
  // Query segment_issues grouped by issue, joined with issues table
  const { data, error } = await supabase
    .from('segment_issues')
    .select(`
      issue_id,
      issues:issue_id (
        id,
        name
      )
    `);

  if (error) {
    console.error('Error fetching top issues overall:', error);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Aggregate counts by issue
  const issueCounts = new Map<string, { id: string; name: string; count: number }>();

  data.forEach((row: any) => {
    if (!row.issues) return;
    const issueId = row.issues.id;
    const issueName = row.issues.name;

    const existing = issueCounts.get(issueId);
    if (existing) {
      existing.count++;
    } else {
      issueCounts.set(issueId, { id: issueId, name: issueName, count: 1 });
    }
  });

  // Sort by count descending and take top N
  return Array.from(issueCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map(item => ({
      id: item.id,
      name: item.name,
      mentionCount: item.count,
    }));
}


  