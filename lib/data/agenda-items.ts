// Database operations for agenda items
// Handles CRUD operations linking transcript segments to agenda items
// Updated to use video_id (matching actual schema)

import { supabaseAdmin as supabase } from '@/lib/utils/supabase-admin';
import type { AgendaItem, AgendaItemType, DetectionMethod } from '@/types/LegislatorIntelligence';

// ============================================================================
// CREATE OPERATIONS
// ============================================================================

/**
 * Create a new agenda item
 */
export async function createAgendaItem(data: {
    videoId: string;
    itemNumber: number;
    itemType: AgendaItemType;
    title: string;
    description?: string;
    startTime?: number;
    endTime?: number;
    billId?: string;
    detectionMethod?: DetectionMethod;
    detectionConfidence?: number;
    triggerPhrase?: string;
}): Promise<AgendaItem | null> {
    const { data: item, error } = await supabase
        .from('agenda_items')
        .insert({
            video_id: data.videoId,
            item_number: data.itemNumber,
            item_type: data.itemType,
            title: data.title,
            description: data.description || null,
            start_time: data.startTime || null,
            end_time: data.endTime || null,
            bill_id: data.billId || null,
            status: 'pending',
            detection_method: data.detectionMethod || null,
            detection_confidence: data.detectionConfidence || null,
            trigger_phrase: data.triggerPhrase || null
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating agenda item:', error);
        return null;
    }

    return item as AgendaItem;
}

/**
 * Create multiple agenda items in batch
 */
export async function createAgendaItems(
    items: Array<{
        videoId: string;
        itemNumber: number;
        itemType: AgendaItemType;
        title: string;
        startTime?: number;
        endTime?: number;
        detectionMethod?: DetectionMethod;
        detectionConfidence?: number;
        triggerPhrase?: string;
    }>
): Promise<{ created: number; errors: number }> {
    const records = items.map(item => ({
        video_id: item.videoId,
        item_number: item.itemNumber,
        item_type: item.itemType,
        title: item.title,
        start_time: item.startTime || null,
        end_time: item.endTime || null,
        status: 'pending',
        detection_method: item.detectionMethod || null,
        detection_confidence: item.detectionConfidence || null,
        trigger_phrase: item.triggerPhrase || null
    }));

    const { data, error } = await supabase
        .from('agenda_items')
        .insert(records)
        .select();

    if (error) {
        console.error('Error creating agenda items:', error);
        return { created: 0, errors: items.length };
    }

    return { created: data?.length || 0, errors: 0 };
}

// ============================================================================
// READ OPERATIONS
// ============================================================================

/**
 * Get agenda items for a video
 */
export async function getAgendaItemsByVideo(videoId: string): Promise<AgendaItem[]> {
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
 * Get agenda item by ID
 */
export async function getAgendaItem(id: string): Promise<AgendaItem | null> {
    const { data, error } = await supabase
        .from('agenda_items')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching agenda item:', error);
        return null;
    }

    return data as AgendaItem;
}

/**
 * Get agenda item at a specific timestamp in a video
 */
export async function getAgendaItemAtTime(
    videoId: string,
    timestampSeconds: number
): Promise<AgendaItem | null> {
    const { data, error } = await supabase
        .from('agenda_items')
        .select('*')
        .eq('video_id', videoId)
        .lte('start_time', timestampSeconds)
        .or(`end_time.gt.${timestampSeconds},end_time.is.null`)
        .order('start_time', { ascending: false })
        .limit(1)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching agenda item at time:', error);
    }

    return data as AgendaItem | null;
}

// ============================================================================
// UPDATE OPERATIONS
// ============================================================================

/**
 * Update agenda item status
 */
export async function updateAgendaItemStatus(
    id: string,
    status: string,
    voteResult?: 'passed' | 'failed' | null
): Promise<boolean> {
    const { error } = await supabase
        .from('agenda_items')
        .update({
            status,
            vote_result: voteResult,
            updated_at: new Date().toISOString()
        })
        .eq('id', id);

    if (error) {
        console.error('Error updating agenda item status:', error);
        return false;
    }

    return true;
}

/**
 * Link bill to agenda item
 */
export async function linkBillToAgendaItem(
    agendaItemId: string,
    billId: string
): Promise<boolean> {
    const { error } = await supabase
        .from('agenda_items')
        .update({
            bill_id: billId,
            updated_at: new Date().toISOString()
        })
        .eq('id', agendaItemId);

    if (error) {
        console.error('Error linking bill to agenda item:', error);
        return false;
    }

    return true;
}

/**
 * Link transcript segment to agenda item
 */
export async function linkSegmentToAgendaItem(
    segmentId: number,
    agendaItemId: string
): Promise<boolean> {
    const { error } = await supabase
        .from('transcription_segments')
        .update({
            agenda_item_id: agendaItemId
        })
        .eq('id', segmentId);

    if (error) {
        console.error('Error linking segment to agenda item:', error);
        return false;
    }

    return true;
}

/**
 * Bulk link segments to agenda items based on timestamps
 */
export async function linkSegmentsToAgendaItems(
    videoId: string
): Promise<{ updated: number; errors: number }> {
    // Get all agenda items for video
    const agendaItems = await getAgendaItemsByVideo(videoId);

    if (agendaItems.length === 0) {
        return { updated: 0, errors: 0 };
    }

    let updated = 0;
    let errors = 0;

    for (const item of agendaItems) {
        if (item.start_time === null || item.start_time === undefined) continue;

        // Build time range filter
        let query = supabase
            .from('transcription_segments')
            .update({
                agenda_item_id: item.id
            })
            .eq('video_id', videoId)
            .gte('start_time', item.start_time);

        if (item.end_time !== null && item.end_time !== undefined) {
            query = query.lt('start_time', item.end_time);
        }

        const { error, count } = await query;

        if (error) {
            console.error(`Error linking segments to agenda item ${item.id}:`, error);
            errors++;
        } else {
            updated += count || 0;
        }
    }

    return { updated, errors };
}

// ============================================================================
// DELETE OPERATIONS
// ============================================================================

/**
 * Delete all agenda items for a video (for re-processing)
 */
export async function deleteAgendaItemsForVideo(videoId: string): Promise<boolean> {
    const { error } = await supabase
        .from('agenda_items')
        .delete()
        .eq('video_id', videoId);

    if (error) {
        console.error('Error deleting agenda items:', error);
        return false;
    }

    return true;
}
