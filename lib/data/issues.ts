import { supabase } from '../utils/supabase';

export async function getIssuesbyId(id: string) {
      const { data, error } = await supabase
      .from('issues')
      .select('*')
      .eq('id', id)
      .single()
  if (error) {
      console.error('Error fetching issue:', error);
      return null;
  }
  return data || null;;
}
  