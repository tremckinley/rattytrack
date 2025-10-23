// lib/data/legislator.ts infor for individual legislator profiles

import { Legislator } from '@/types/Legislator';
import { supabase } from '../../utils/supabase';

// Import a singlar legislator by ID from the Supabase 'legislators' table
export async function getLegislator(id: string): Promise<Legislator | null> {
    const { data, error } = await supabase
        .from('legislators')
        .select()
       .eq('id', id)
        .single();
        

    if (error) {
        console.error('Error fetching legislator:', error);
        return null;
    }
    console.log('Fetched legislator data:', data);
    return data;
}