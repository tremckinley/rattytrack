// Client-side data fetching for key quotes
// For use in server components, import directly from @/lib/data/key-quotes

import { createClient } from '@supabase/supabase-js';
import type { KeyQuote, QuoteImpactLevel } from '@/types/LegislatorIntelligence';

// Extended type with video info for linking
export type KeyQuoteWithVideo = KeyQuote & {
    video_id?: string | null;
    start_time?: number | null;
    video_title?: string | null;
    video_published_at?: string | null;
};

// Create a client-side Supabase instance
function getSupabaseClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Get key quotes for a legislator (with video info for linking)
 */
export async function getKeyQuotesForLegislator(
    legislatorId: string,
    options?: {
        minImpact?: QuoteImpactLevel;
        limit?: number;
    }
): Promise<KeyQuoteWithVideo[]> {
    const supabase = getSupabaseClient();

    // First get the quotes
    let query = supabase
        .from('key_quotes')
        .select('*')
        .eq('legislator_id', legislatorId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

    // Filter by minimum impact level
    if (options?.minImpact) {
        const levels = ['critical', 'high', 'medium', 'low'];
        const minIndex = levels.indexOf(options.minImpact);
        const allowedLevels = levels.slice(0, minIndex + 1);
        query = query.in('impact_level', allowedLevels);
    }

    if (options?.limit) {
        query = query.limit(options.limit);
    }

    const { data: quotes, error } = await query;

    if (error || !quotes) {
        console.error('Error fetching key quotes:', error);
        return [];
    }

    // Get video info for each quote by looking up the segment
    const quotesWithVideo: KeyQuoteWithVideo[] = [];

    for (const quote of quotes) {
        let videoId: string | null = null;
        let startTime: number | null = null;
        let videoTitle: string | null = null;
        let videoPublishedAt: string | null = null;

        if (quote.segment_id) {
            // Look up the segment to get video_id and start_time
            const { data: segment } = await supabase
                .from('transcription_segments')
                .select('video_id, start_time')
                .eq('id', quote.segment_id)
                .single();

            if (segment?.video_id) {
                videoId = segment.video_id;
                startTime = segment.start_time ? Number(segment.start_time) : null;

                // Look up video info for title and published date
                const { data: video } = await supabase
                    .from('video_transcriptions')
                    .select('title, published_at')
                    .eq('video_id', segment.video_id)
                    .single();

                if (video) {
                    videoTitle = video.title;
                    videoPublishedAt = video.published_at;
                }
            }
        }

        quotesWithVideo.push({
            ...quote,
            video_id: videoId,
            start_time: startTime,
            video_title: videoTitle,
            video_published_at: videoPublishedAt
        });
    }

    return quotesWithVideo;
}

/**
 * Get all high-impact quotes (for homepage/featured)
 */
export async function getHighImpactQuotes(limit: number = 10): Promise<KeyQuote[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('key_quotes')
        .select('*')
        .in('impact_level', ['critical', 'high'])
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching high-impact quotes:', error);
        return [];
    }

    return data as KeyQuote[];
}
