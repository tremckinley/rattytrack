import { createClient } from '@supabase/supabase-js';
import { IssueCategory, IssueStatement } from '@/components/charts/IssueSpeakingDashboard';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

/**
 * Fetches issue metrics for a specific video
 */
export async function getMeetingIssueMetrics(videoId: string): Promise<IssueCategory[]> {
    try {
        // Fetch segment_issues joined with issues and transcription_segments
        const { data, error } = await supabase
            .from('segment_issues')
            .select(`
                relevance_score,
                sentiment_label,
                issues:issue_id (
                    id,
                    name
                ),
                segments:segment_id (
                    id,
                    text,
                    start_time,
                    end_time,
                    speaker_id,
                    speaker_name
                )
            `)
            .eq('segments.video_id', videoId);

        if (error) {
            console.error('Error fetching meeting issue metrics:', error);
            return [];
        }

        if (!data || data.length === 0) {
            return [];
        }

        // Aggregate by issue
        const issueMap = new Map<string, IssueCategory>();

        data.forEach((row: any) => {
            if (!row.issues || !row.segments) return;

            const issueId = row.issues.id;
            const issueName = row.issues.name;
            const segment = row.segments;

            if (!issueMap.has(issueId)) {
                issueMap.set(issueId, {
                    issueId,
                    issueName,
                    totalMentions: 0,
                    positiveMentions: 0,
                    negativeMentions: 0,
                    neutralMentions: 0,
                    speakingTimeSeconds: 0,
                    statements: []
                });
            }

            const metric = issueMap.get(issueId)!;
            metric.totalMentions++;

            if (row.sentiment_label === 'positive') metric.positiveMentions++;
            else if (row.sentiment_label === 'negative') metric.negativeMentions++;
            else metric.neutralMentions++;

            const duration = (segment.end_time || 0) - (segment.start_time || 0);
            metric.speakingTimeSeconds += duration;

            // Add as a statement
            metric.statements.push({
                id: segment.id,
                text: segment.text,
                sentiment: (row.sentiment_label as any) || 'neutral',
                videoId: videoId,
                timestamp: segment.start_time,
                date: new Date().toISOString() // Fallback
            });
        });

        // Convert map to array and sort by total mentions
        return Array.from(issueMap.values())
            .sort((a, b) => b.totalMentions - a.totalMentions);

    } catch (error) {
        console.error('Unexpected error fetching meeting issue metrics:', error);
        return [];
    }
}
