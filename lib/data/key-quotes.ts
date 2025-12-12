// Database operations for key quotes
// Handles storing and retrieving high-impact quotes for legislator profiles

import { supabaseAdmin as supabase } from '@/lib/utils/supabase-admin';
import type { KeyQuote, QuoteImpactLevel, QuoteType, QuoteDetectionResult } from '@/types/LegislatorIntelligence';

// ============================================================================
// CREATE OPERATIONS
// ============================================================================

/**
 * Save a detected key quote
 */
export async function saveKeyQuote(data: {
    segmentId: string;
    legislatorId?: string;
    quoteText: string;
    contextBefore?: string;
    contextAfter?: string;
    impactLevel: QuoteImpactLevel;
    quoteType?: QuoteType;
    sentimentScore?: number;
    sentimentIntensity?: number;
    primaryIssueId?: string;
    aiModelVersion?: string;
    detectionConfidence?: number;
}): Promise<KeyQuote | null> {
    const { data: quote, error } = await supabase
        .from('key_quotes')
        .insert({
            segment_id: data.segmentId,
            legislator_id: data.legislatorId || null,
            quote_text: data.quoteText,
            context_before: data.contextBefore || null,
            context_after: data.contextAfter || null,
            impact_level: data.impactLevel,
            quote_type: data.quoteType || null,
            sentiment_score: data.sentimentScore || null,
            sentiment_intensity: data.sentimentIntensity || null,
            primary_issue_id: data.primaryIssueId || null,
            ai_model_version: data.aiModelVersion || null,
            detection_confidence: data.detectionConfidence || null,
            is_featured: false,
            is_approved: true // No approval required per user decision
        })
        .select()
        .single();

    if (error) {
        console.error('Error saving key quote:', error);
        return null;
    }

    return quote as KeyQuote;
}

/**
 * Save multiple key quotes from detection results
 */
export async function saveKeyQuotes(
    results: QuoteDetectionResult[],
    aiModelVersion?: string
): Promise<{ saved: number; errors: number }> {
    if (results.length === 0) {
        return { saved: 0, errors: 0 };
    }

    const records = results.map(r => ({
        segment_id: r.segmentId,
        legislator_id: r.legislatorId || null,
        quote_text: r.quoteText,
        impact_level: r.impactLevel,
        quote_type: r.quoteType || null,
        sentiment_score: r.sentimentScore,
        sentiment_intensity: r.sentimentIntensity,
        primary_issue_id: r.primaryIssueId || null,
        ai_model_version: aiModelVersion || null,
        detection_confidence: r.confidence,
        is_featured: false,
        is_approved: true
    }));

    const { data, error } = await supabase
        .from('key_quotes')
        .insert(records)
        .select();

    if (error) {
        console.error('Error saving key quotes:', error);
        return { saved: 0, errors: results.length };
    }

    return { saved: data?.length || 0, errors: 0 };
}

// ============================================================================
// READ OPERATIONS
// ============================================================================

/**
 * Get key quotes for a legislator
 */
export async function getQuotesByLegislator(
    legislatorId: string,
    options?: {
        minImpact?: QuoteImpactLevel;
        limit?: number;
        offset?: number;
    }
): Promise<KeyQuote[]> {
    let query = supabase
        .from('key_quotes')
        .select('*')
        .eq('legislator_id', legislatorId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

    if (options?.minImpact) {
        const levels = ['critical', 'high', 'medium', 'low'];
        const minIndex = levels.indexOf(options.minImpact);
        const allowedLevels = levels.slice(0, minIndex + 1);
        query = query.in('impact_level', allowedLevels);
    }

    if (options?.limit) {
        query = query.limit(options.limit);
    }

    if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching quotes by legislator:', error);
        return [];
    }

    return data as KeyQuote[];
}

/**
 * Get quotes by issue
 */
export async function getQuotesByIssue(
    issueId: string,
    limit: number = 10
): Promise<KeyQuote[]> {
    const { data, error } = await supabase
        .from('key_quotes')
        .select('*')
        .eq('primary_issue_id', issueId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching quotes by issue:', error);
        return [];
    }

    return data as KeyQuote[];
}

/**
 * Get featured quotes (for homepage/highlights)
 */
export async function getFeaturedQuotes(limit: number = 5): Promise<KeyQuote[]> {
    const { data, error } = await supabase
        .from('key_quotes')
        .select('*')
        .eq('is_featured', true)
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching featured quotes:', error);
        return [];
    }

    return data as KeyQuote[];
}

/**
 * Get high-impact quotes across all legislators
 */
export async function getHighImpactQuotes(limit: number = 10): Promise<KeyQuote[]> {
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

// ============================================================================
// UPDATE OPERATIONS
// ============================================================================

/**
 * Toggle featured status
 */
export async function toggleFeatured(id: string, featured: boolean): Promise<boolean> {
    const { error } = await supabase
        .from('key_quotes')
        .update({ is_featured: featured })
        .eq('id', id);

    if (error) {
        console.error('Error toggling quote featured status:', error);
        return false;
    }

    return true;
}

// ============================================================================
// DELETE OPERATIONS
// ============================================================================

/**
 * Delete quotes for a segment (for re-processing)
 */
export async function deleteQuotesForSegment(segmentId: string): Promise<boolean> {
    const { error } = await supabase
        .from('key_quotes')
        .delete()
        .eq('segment_id', segmentId);

    if (error) {
        console.error('Error deleting quotes for segment:', error);
        return false;
    }

    return true;
}
