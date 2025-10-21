import { supabase } from '../utils/supabase';

export async function getIssueById(id: string) {
  try {
    const { data, error } = await supabase
      .from('issues')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching issue:', error);
      return null;
    }
    
    return data;
  }
  catch (error) {
    console.error('Error fetching issue:', error);
    return null;
  }
}
  