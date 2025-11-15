// lib/data/legislator_card.ts info for legislator cards

import { supabase } from '../../utils/supabase';
import { Legislator } from '@/types/Legislator';

export type LegislatorStatusFilter = 'active' | 'inactive' | 'all';

export async function getLegislators(status: LegislatorStatusFilter = 'active'): Promise<Legislator[]> {
  try {
    // This is a server-side call, safe from exposing credentials
    let query = supabase
      .from('legislators')
      .select('*');
    
    // Apply status filter
    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    }
    // For 'all', don't add any filter
    
    const { data, error } = await query.order('display_name', { ascending: true });

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