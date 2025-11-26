// Database operations for AI analysis results
// Handles saving issue categorization and sentiment analysis to segment_issues table

import { createClient } from '@supabase/supabase-js';
import type { IssueCategorization, SentimentAnalysis } from '@/lib/ai/transcript-analyzer';

// Use service role key for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

/**
 * Sentiment label type matching database enum
 */
export type SentimentLabel = 'positive' | 'negative' | 'neutral' | 'mixed';

/**
 * Convert sentiment score to label
 */
function sentimentScoreToLabel(score: number): SentimentLabel {
    if (score > 0.2) return 'positive';
    if (score < -0.2) return 'negative';
    return 'neutral';
}

/**
 * Save AI analysis results for a transcript segment
 * Creates entries in segment_issues table linking segments to detected issues
 * 
 * @param segmentId - UUID of the transcript segment
 * @param issues - Array of detected issues with confidence scores
 * @param sentiment - Sentiment analysis result
 * @returns Number of issues saved
 */
export async function saveSegmentAnalysis(
    segmentId: string,
    issues: IssueCategorization[],
    sentiment: SentimentAnalysis
): Promise<{ success: boolean; issuesSaved: number; error?: string }> {
    try {
        if (issues.length === 0) {
            return { success: true, issuesSaved: 0 };
        }

        // Get or create issue records for each detected category
        const issueRecords = await Promise.all(
            issues.map(issue => getOrCreateIssue(issue.category))
        );

        // Filter out any failed issue creations
        const validIssues = issueRecords.filter(record => record !== null);

        if (validIssues.length === 0) {
            return {
                success: false,
                issuesSaved: 0,
                error: 'Failed to create/fetch issue records'
            };
        }

        // Prepare segment_issues records
        const segmentIssues = validIssues.map((issueRecord, index) => ({
            segment_id: segmentId,
            issue_id: issueRecord!.id,
            relevance_score: issues[index].confidence,
            sentiment_score: sentiment.score,
            sentiment_label: sentimentScoreToLabel(sentiment.score),
            sentiment_confidence: sentiment.confidence,
            is_ai_generated: true,
            is_manually_verified: false
        }));

        // Insert into database
        const { error } = await supabase
            .from('segment_issues')
            .insert(segmentIssues);

        if (error) {
            console.error('Error saving segment analysis:', error);
            return {
                success: false,
                issuesSaved: 0,
                error: error.message
            };
        }

        return {
            success: true,
            issuesSaved: segmentIssues.length
        };

    } catch (error) {
        console.error('Failed to save segment analysis:', error);
        return {
            success: false,
            issuesSaved: 0,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Get or create an issue by name
 * Returns existing issue if found, creates new one if not
 * 
 * @param name - Issue category name
 * @returns Issue record or null if failed
 */
async function getOrCreateIssue(name: string): Promise<{ id: string; name: string } | null> {
    try {
        // Try to find existing issue
        const { data: existing, error: fetchError } = await supabase
            .from('issues')
            .select('id, name')
            .eq('name', name)
            .eq('is_active', true)
            .single();

        if (existing && !fetchError) {
            return existing;
        }

        // Create new issue if not found
        const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

        const { data: newIssue, error: createError } = await supabase
            .from('issues')
            .insert({
                name,
                slug,
                is_ai_generated: true,
                is_active: true
            })
            .select('id, name')
            .single();

        if (createError) {
            console.error(`Error creating issue "${name}":`, createError);
            return null;
        }

        return newIssue;

    } catch (error) {
        console.error(`Failed to get/create issue "${name}":`, error);
        return null;
    }
}

/**
 * Get all active issues from database
 * 
 * @returns Array of issue records
 */
export async function getActiveIssues(): Promise<Array<{ id: string; name: string; slug: string }>> {
    try {
        const { data, error } = await supabase
            .from('issues')
            .select('id, name, slug')
            .eq('is_active', true)
            .order('name');

        if (error) {
            console.error('Error fetching issues:', error);
            return [];
        }

        return data || [];

    } catch (error) {
        console.error('Failed to fetch issues:', error);
        return [];
    }
}

/**
 * Seed initial issue categories from AI definitions
 * Should be run once during setup
 * 
 * @param categories - Array of category names to seed
 * @returns Number of categories created
 */
export async function seedIssueCategories(categories: string[]): Promise<number> {
    let created = 0;

    for (const category of categories) {
        const result = await getOrCreateIssue(category);
        if (result) {
            created++;
        }
    }

    console.log(`Seeded ${created}/${categories.length} issue categories`);
    return created;
}

/**
 * Delete AI-generated analysis for a segment
 * Useful for re-analysis or cleanup
 * 
 * @param segmentId - UUID of the transcript segment
 * @returns Success status
 */
export async function deleteSegmentAnalysis(segmentId: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('segment_issues')
            .delete()
            .eq('segment_id', segmentId)
            .eq('is_ai_generated', true);

        if (error) {
            console.error('Error deleting segment analysis:', error);
            return false;
        }

        return true;

    } catch (error) {
        console.error('Failed to delete segment analysis:', error);
        return false;
    }
}
