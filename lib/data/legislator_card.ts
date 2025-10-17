// src/lib/data/legislator_card.ts info for legislator cards

//import Legislator from '@/types/Legislator';
import { supabase } from '../utils/supabase';

export async function getLegislators(): Promise<any[]> {
  try {
    // This is a server-side call, safe from exposing credentials
    const { data, error } = await supabase
      .from('legislator_cards')
      .select('*')
      .order('display_name', { ascending: true });

    if (error) {
      console.error('Error fetching legislators:', error);
      // Return empty array to prevent UI crashes
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error fetching legislators:', error);
    // Return empty array to prevent UI crashes
    return [];
  }
}