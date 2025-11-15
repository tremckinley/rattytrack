// lib/data/legislator_card.ts info for legislator cards

import { supabase } from '../../utils/supabase';
import { Legislator } from '@/types/Legislator';

export type LegislatorStatusFilter = 'active' | 'inactive' | 'all';

export type LegislatorsResult = {
  data: Legislator[];
  error: string | null;
};

export async function getLegislators(status: LegislatorStatusFilter = 'active'): Promise<LegislatorsResult> {
  try {
    // This is a server-side call, safe from exposing credentials
    let query = supabase
      .from('legislators')
      .select('*');
    
    // Apply status filter
    if (status === 'active') {
      // Include legislators with is_active = true OR null (backward compatible)
      query = query.or('is_active.eq.true,is_active.is.null');
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    }
    // For 'all', don't add any filter
    
    const { data, error } = await query.order('display_name', { ascending: true });

    if (error) {
      console.error('Error fetching legislators:', error);
      return { data: [], error: error.message };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Unexpected error fetching legislators:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { data: [], error: errorMessage };
  }
}