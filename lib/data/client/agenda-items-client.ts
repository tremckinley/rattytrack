// Client-side data fetching for agenda items

import { createClient } from '@supabase/supabase-js';
import type { AgendaItem } from '@/types/LegislatorIntelligence';

// Create a client-side Supabase instance
function getSupabaseClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Get agenda items for a video
 */
export async function getAgendaItemsForVideo(videoId: string): Promise<AgendaItem[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('agenda_items')
        .select('*')
        .eq('video_id', videoId)
        .order('item_number');

    if (error) {
        console.error('Error fetching agenda items:', error);
        return [];
    }

    return data as AgendaItem[];
}

/**
 * Get agenda items with segment counts
 */
export async function getAgendaItemsWithStats(videoId: string): Promise<Array<AgendaItem & { segment_count: number }>> {
    const supabase = getSupabaseClient();

    // Get agenda items
    const { data: items, error: itemsError } = await supabase
        .from('agenda_items')
        .select('*')
        .eq('video_id', videoId)
        .order('item_number');

    if (itemsError || !items) {
        console.error('Error fetching agenda items:', itemsError);
        return [];
    }

    // Get segment counts for each item
    const itemsWithStats = await Promise.all(
        items.map(async (item) => {
            const { count } = await supabase
                .from('transcription_segments')
                .select('*', { count: 'exact', head: true })
                .eq('agenda_item_id', item.id);

            return {
                ...item,
                segment_count: count || 0
            };
        })
    );

    return itemsWithStats as Array<AgendaItem & { segment_count: number }>;
}
