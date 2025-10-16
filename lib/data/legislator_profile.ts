// src/lib/data/legislator_profile.ts info for legislator cards

import Legislator from '@/types/Legislator';
import { supabase } from '../utils/supabase';

export async function getLegislators(): Promise<any[]> {
  
  // This is a server-side call, safe from exposing credentials
  const { data, error } = await supabase
    .from('legislator_profiles')
    .select('*')
    .order('display_name', { ascending: true });

  if (error) {
    console.error('Error fetching legislators:', error);
    // In a real app, handle the error gracefully or throw it
    throw new Error('Failed to fetch legislator data.'); 
  }

  return data
}