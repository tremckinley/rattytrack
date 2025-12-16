// Speaker mapping service
// Handles persistent storage and retrieval of speaker->legislator mappings

import { createClient } from '@supabase/supabase-js';

// Use service role for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const getSupabase = () => createClient(supabaseUrl, supabaseServiceKey);

export interface SpeakerMapping {
    id: string;
    speaker_label: string;
    legislator_id: string;
    channel_id?: string | null;
    confidence: 'manual' | 'high' | 'medium' | 'low';
    created_by: 'user' | 'auto';
    created_at: string;
    updated_at: string;
}

/**
 * Get all saved speaker mappings
 */
export async function getSpeakerMappings(channelId?: string): Promise<SpeakerMapping[]> {
    const supabase = getSupabase();

    let query = supabase
        .from('speaker_mappings')
        .select('*')
        .order('speaker_label');

    if (channelId) {
        // Get channel-specific mappings + global mappings
        query = query.or(`channel_id.eq.${channelId},channel_id.is.null`);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching speaker mappings:', error);
        return [];
    }

    return data as SpeakerMapping[];
}

/**
 * Get mapping for a specific speaker label
 */
export async function getMappingForSpeaker(
    speakerLabel: string,
    channelId?: string
): Promise<SpeakerMapping | null> {
    const supabase = getSupabase();

    // Try channel-specific first, then global
    let query = supabase
        .from('speaker_mappings')
        .select('*')
        .eq('speaker_label', speakerLabel);

    if (channelId) {
        query = query.or(`channel_id.eq.${channelId},channel_id.is.null`);
    }

    const { data, error } = await query.order('channel_id', { nullsFirst: false }).limit(1);

    if (error || !data || data.length === 0) {
        return null;
    }

    return data[0] as SpeakerMapping;
}

/**
 * Save or update a speaker mapping
 */
export async function saveSpeakerMapping(
    speakerLabel: string,
    legislatorId: string,
    options?: {
        channelId?: string;
        confidence?: 'manual' | 'high' | 'medium' | 'low';
        createdBy?: 'user' | 'auto';
    }
): Promise<SpeakerMapping | null> {
    const supabase = getSupabase();

    const { data, error } = await supabase
        .from('speaker_mappings')
        .upsert({
            speaker_label: speakerLabel,
            legislator_id: legislatorId,
            channel_id: options?.channelId || null,
            confidence: options?.confidence || 'manual',
            created_by: options?.createdBy || 'user'
        }, {
            onConflict: 'speaker_label,channel_id'
        })
        .select()
        .single();

    if (error) {
        console.error('Error saving speaker mapping:', error);
        return null;
    }

    return data as SpeakerMapping;
}

/**
 * Delete a speaker mapping
 */
export async function deleteSpeakerMapping(mappingId: string): Promise<boolean> {
    const supabase = getSupabase();

    const { error } = await supabase
        .from('speaker_mappings')
        .delete()
        .eq('id', mappingId);

    return !error;
}

/**
 * Apply saved mappings to segments for a video
 * Returns the number of segments updated
 */
export async function applySavedMappingsToVideo(
    videoId: string,
    channelId?: string
): Promise<{ updated: number; errors: number }> {
    const supabase = getSupabase();

    // Get all saved mappings
    const mappings = await getSpeakerMappings(channelId);

    if (mappings.length === 0) {
        return { updated: 0, errors: 0 };
    }

    let updated = 0;
    let errors = 0;

    for (const mapping of mappings) {
        const { count, error } = await supabase
            .from('transcription_segments')
            .update({ speaker_id: mapping.legislator_id })
            .eq('video_id', videoId)
            .eq('speaker_name', mapping.speaker_label)
            .is('speaker_id', null);

        if (error) {
            console.error(`Error applying mapping ${mapping.speaker_label}:`, error);
            errors++;
        } else {
            updated += count || 0;
        }
    }

    return { updated, errors };
}

/**
 * Learn mappings from existing linked segments
 * Stores successful mappings for reuse
 */
export async function learnMappingsFromSegments(
    channelId?: string
): Promise<{ learned: number; errors: number }> {
    const supabase = getSupabase();

    // Find segments that have both speaker_name and speaker_id (already linked)
    let query = supabase
        .from('transcription_segments')
        .select('speaker_name, speaker_id, video_transcriptions!inner(channel_title)')
        .not('speaker_name', 'is', null)
        .not('speaker_id', 'is', null);

    const { data: linkedSegments, error } = await query;

    if (error) {
        console.error('Error fetching linked segments:', error);
        return { learned: 0, errors: 1 };
    }

    // Build unique mappings
    const uniqueMappings = new Map<string, { legislatorId: string; channelId?: string }>();

    for (const seg of linkedSegments || []) {
        if (seg.speaker_name && seg.speaker_id) {
            const video = seg.video_transcriptions as any;
            uniqueMappings.set(seg.speaker_name, {
                legislatorId: seg.speaker_id,
                channelId: video?.channel_title || channelId
            });
        }
    }

    // Save each mapping
    let learned = 0;
    let errors = 0;

    for (const [speakerLabel, { legislatorId, channelId: ch }] of uniqueMappings) {
        const result = await saveSpeakerMapping(speakerLabel, legislatorId, {
            channelId: ch,
            confidence: 'high',
            createdBy: 'auto'
        });

        if (result) {
            learned++;
        } else {
            errors++;
        }
    }

    return { learned, errors };
}
