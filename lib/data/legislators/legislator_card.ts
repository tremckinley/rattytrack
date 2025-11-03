// lib/data/legislator_card.ts info for legislator cards

import { supabase } from '../../utils/supabase';

type LegislatorCard = {
  legislator_id: string;
  display_name: string;
  party: string;
  district: string;
  headshot_url: string | null;
  slug: string;
};

export async function getLegislators(): Promise<LegislatorCard[]> {
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