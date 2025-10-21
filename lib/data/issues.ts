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
  