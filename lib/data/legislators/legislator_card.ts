// lib/data/legislator_card.ts info for legislator cards

import { supabase } from '../../utils/supabase';
import { Legislator } from '@/types/Legislator';

export async function getLegislators(): Promise<Legislator[]> {
  try {
    // This is a server-side call, safe from exposing credentials
    const { data, error } = await supabase
      .from('legislators')
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