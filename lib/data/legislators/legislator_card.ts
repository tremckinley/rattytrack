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

export interface LegislatorQuickCard {
  id: string;
  display_name: string;
  title: string | null;
  district: string | null;
  photo_url: string | null;
  meetings_attended: number | null;
  meetings_missed: number | null;
}

/**
 * Get active legislators with stats for the dashboard quick-glance strip
 */
export async function getActiveLegislatorsWithStats(limit: number = 10): Promise<LegislatorQuickCard[]> {
  try {
    const { data, error } = await supabase
      .from('legislators')
      .select(`
        id,
        display_name,
        title,
        district,
        photo_url,
        stats:legislator_statistics(
          meetings_attended,
          meetings_missed,
          period_type
        )
      `)
      .or('is_active.eq.true,is_active.is.null')
      .order('display_name', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching legislators with stats:', error);
      return [];
    }

    return (data || []).map((leg: any) => {
      // Find the "all_time" stat if available
      const allTimeStat = leg.stats?.find((s: any) => s.period_type === 'all_time');

      return {
        id: leg.id,
        display_name: leg.display_name,
        title: leg.title,
        district: leg.district,
        photo_url: leg.photo_url,
        meetings_attended: allTimeStat?.meetings_attended || null,
        meetings_missed: allTimeStat?.meetings_missed || null,
      };
    });
  } catch (error) {
    console.error('Unexpected error fetching legislators with stats:', error);
    return [];
  }
}