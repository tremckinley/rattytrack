// Database operations for legislator positions
// Stores and retrieves stance data for legislator profiles

import { supabaseAdmin as supabase } from '@/lib/utils/supabase-admin';
import type {
    LegislatorPosition,
    PositionValue,
    PositionSource,
    LegislatorStanceSummary,
    PositionAggregationResult
} from '@/types/LegislatorIntelligence';

// ============================================================================
// CREATE OPERATIONS
// ============================================================================

/**
 * Save a legislator position
 */
export async function savePosition(data: {
    legislatorId: string;
    billId: string;
    agendaItemId?: string;
    position: PositionValue;
    positionStrength?: number;
    source: PositionSource;
    supportingSegments?: string[];
    aiConfidence?: number;
    aiModelVersion?: string;
    firstExpressedAt?: string;
    finalPosition?: boolean;
}): Promise<LegislatorPosition | null> {
    const { data: position, error } = await supabase
        .from('legislator_positions')
        .upsert({
            legislator_id: data.legislatorId,
            bill_id: data.billId,
            agenda_item_id: data.agendaItemId || null,
            position: data.position,
            position_strength: data.positionStrength || null,
            source: data.source,
            supporting_segments: data.supportingSegments || null,
            ai_confidence: data.aiConfidence || null,
            ai_model_version: data.aiModelVersion || null,
            first_expressed_at: data.firstExpressedAt || new Date().toISOString(),
            final_position: data.finalPosition || false,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'legislator_id,bill_id,source'
        })
        .select()
        .single();

    if (error) {
        console.error('Error saving position:', error);
        return null;
    }

    return position as LegislatorPosition;
}

/**
 * Save multiple positions from aggregation results
 */
export async function savePositions(
    results: PositionAggregationResult[],
    aiModelVersion?: string
): Promise<{ saved: number; errors: number }> {
    if (results.length === 0) {
        return { saved: 0, errors: 0 };
    }

    const records = results.map(r => ({
        legislator_id: r.legislatorId,
        bill_id: r.billId,
        agenda_item_id: r.agendaItemId || null,
        position: r.position,
        position_strength: r.positionStrength,
        source: r.source,
        supporting_segments: r.supportingSegmentIds,
        ai_confidence: r.confidence,
        ai_model_version: aiModelVersion || null,
        first_expressed_at: new Date().toISOString(),
        final_position: r.isFinal,
        updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
        .from('legislator_positions')
        .upsert(records, {
            onConflict: 'legislator_id,bill_id,source'
        })
        .select();

    if (error) {
        console.error('Error saving positions:', error);
        return { saved: 0, errors: results.length };
    }

    return { saved: data?.length || 0, errors: 0 };
}

// ============================================================================
// READ OPERATIONS
// ============================================================================

/**
 * Get all positions for a legislator
 */
export async function getPositionsByLegislator(
    legislatorId: string
): Promise<LegislatorPosition[]> {
    const { data, error } = await supabase
        .from('legislator_positions')
        .select('*')
        .eq('legislator_id', legislatorId)
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('Error fetching positions:', error);
        return [];
    }

    return data as LegislatorPosition[];
}

/**
 * Get positions for a specific bill
 */
export async function getPositionsByBill(billId: string): Promise<LegislatorPosition[]> {
    const { data, error } = await supabase
        .from('legislator_positions')
        .select('*')
        .eq('bill_id', billId)
        .order('legislator_id');

    if (error) {
        console.error('Error fetching positions by bill:', error);
        return [];
    }

    return data as LegislatorPosition[];
}

/**
 * Get legislator's position on a specific bill
 */
export async function getLegislatorPositionOnBill(
    legislatorId: string,
    billId: string
): Promise<LegislatorPosition | null> {
    const { data, error } = await supabase
        .from('legislator_positions')
        .select('*')
        .eq('legislator_id', legislatorId)
        .eq('bill_id', billId)
        .order('final_position', { ascending: false })
        .limit(1)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching legislator position on bill:', error);
    }

    return data as LegislatorPosition | null;
}

/**
 * Get stance summary using the view
 */
export async function getLegislatorStanceSummary(
    legislatorId: string
): Promise<LegislatorStanceSummary[]> {
    const { data, error } = await supabase
        .from('legislator_stance_summary')
        .select('*')
        .eq('legislator_id', legislatorId)
        .not('final_position', 'is', null);

    if (error) {
        console.error('Error fetching stance summary:', error);
        return [];
    }

    return data as LegislatorStanceSummary[];
}

/**
 * Get voting record summary (just explicit votes)
 */
export async function getVotingRecord(legislatorId: string): Promise<{
    totalVotes: number;
    forCount: number;
    againstCount: number;
    neutralCount: number;
}> {
    const { data, error } = await supabase
        .from('legislator_positions')
        .select('position')
        .eq('legislator_id', legislatorId)
        .eq('source', 'explicit_vote');

    if (error) {
        console.error('Error fetching voting record:', error);
        return { totalVotes: 0, forCount: 0, againstCount: 0, neutralCount: 0 };
    }

    const positions = data || [];
    return {
        totalVotes: positions.length,
        forCount: positions.filter((p: { position: string }) => p.position === 'for').length,
        againstCount: positions.filter((p: { position: string }) => p.position === 'against').length,
        neutralCount: positions.filter((p: { position: string }) => p.position === 'neutral').length
    };
}

// ============================================================================
// UPDATE OPERATIONS
// ============================================================================

/**
 * Mark position as final (after vote)
 */
export async function markPositionFinal(
    legislatorId: string,
    billId: string
): Promise<boolean> {
    const { error } = await supabase
        .from('legislator_positions')
        .update({
            final_position: true,
            updated_at: new Date().toISOString()
        })
        .eq('legislator_id', legislatorId)
        .eq('bill_id', billId)
        .eq('source', 'explicit_vote');

    if (error) {
        console.error('Error marking position final:', error);
        return false;
    }

    return true;
}

// ============================================================================
// DELETE OPERATIONS
// ============================================================================

/**
 * Delete non-vote positions (for re-analysis)
 */
export async function deleteDeliberationPositions(
    legislatorId: string,
    billId: string
): Promise<boolean> {
    const { error } = await supabase
        .from('legislator_positions')
        .delete()
        .eq('legislator_id', legislatorId)
        .eq('bill_id', billId)
        .neq('source', 'explicit_vote');

    if (error) {
        console.error('Error deleting deliberation positions:', error);
        return false;
    }

    return true;
}
