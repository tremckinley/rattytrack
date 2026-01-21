// Data layer for meeting summaries
// Handles fetching and storing AI-generated meeting summaries

import { supabaseAdmin as supabase } from '@/lib/utils/supabase-admin';

export interface MeetingSummary {
    id: string;
    video_id: string;
    summary_text: string;
    key_points: string[];
    decisions: string[];
    votes_overview: Array<{
        item: string;
        result: 'passed' | 'failed';
    }>;
    ai_model_version: string;
    generated_at: string;
    is_approved: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateSummaryData {
    summaryText: string;
    keyPoints: string[];
    decisions: string[];
    votesOverview: Array<{
        item: string;
        result: 'passed' | 'failed';
    }>;
    aiModelVersion?: string;
}

/**
 * Get meeting summary by video ID
 * Returns null if no summary exists or if the table hasn't been created yet
 */
export async function getMeetingSummary(videoId: string): Promise<MeetingSummary | null> {
    try {
        const { data, error } = await supabase
            .from('meeting_summaries')
            .select('*')
            .eq('video_id', videoId)
            .single();

        if (error) {
            // PGRST116 = No rows found
            // 42P01 = Table doesn't exist (relation does not exist)
            // PGRST204 = No Content (table doesn't exist or RLS blocking)
            if (error.code === 'PGRST116' || error.code === '42P01' || error.code === 'PGRST204') {
                return null;
            }
            // Only log unexpected errors
            console.error('Error fetching meeting summary:', error);
            return null;
        }

        return data as MeetingSummary;
    } catch {
        // Table might not exist yet - fail silently
        return null;
    }
}

/**
 * Create or update a meeting summary
 */
export async function upsertMeetingSummary(
    videoId: string,
    summaryData: CreateSummaryData
): Promise<MeetingSummary | null> {
    const { data, error } = await supabase
        .from('meeting_summaries')
        .upsert({
            video_id: videoId,
            summary_text: summaryData.summaryText,
            key_points: summaryData.keyPoints,
            decisions: summaryData.decisions,
            votes_overview: summaryData.votesOverview,
            ai_model_version: summaryData.aiModelVersion || 'gpt-4',
            generated_at: new Date().toISOString(),
        }, {
            onConflict: 'video_id',
        })
        .select()
        .single();

    if (error) {
        console.error('Error upserting meeting summary:', error);
        return null;
    }

    return data as MeetingSummary;
}

/**
 * Mark a summary as approved/verified
 */
export async function approveMeetingSummary(summaryId: string): Promise<boolean> {
    const { error } = await supabase
        .from('meeting_summaries')
        .update({ is_approved: true })
        .eq('id', summaryId);

    if (error) {
        console.error('Error approving meeting summary:', error);
        return false;
    }

    return true;
}

/**
 * Delete a meeting summary
 */
export async function deleteMeetingSummary(videoId: string): Promise<boolean> {
    const { error } = await supabase
        .from('meeting_summaries')
        .delete()
        .eq('video_id', videoId);

    if (error) {
        console.error('Error deleting meeting summary:', error);
        return false;
    }

    return true;
}
