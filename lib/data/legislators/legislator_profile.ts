// lib/data/legislator_profile.ts info for legislator profile

//import Legislator from '@/types/Legislator';
import { Legislator } from '@/types/Legislator';
import { supabase } from '../utils/supabase';

export async function getLegislatorProfile(id: string): Promise<Legislator | null> {
  try {
    // This is a server-side call, safe from exposing credentials
    const { data, error } = await supabase
    .from('legislators')
    .select(`
        *,
        stats:legislator_statistics(*) 
    `)
    .eq('id', id)
    .single();

    if (error) {
      console.error('Error fetching legislators:', error);
      // Return empty array to prevent UI crashes
      return null;
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error fetching legislators:', error);
    // Return empty array to prevent UI crashes
    return null;
  }
}