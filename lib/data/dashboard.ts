// Dashboard-specific data queries
// Provides data for dashboard visualizations like trend lines

import { supabase } from '../utils/supabase';

export interface TrendDataPoint {
    date: string;
    count: number;
}

export interface IssueTrend {
    issueId: string;
    issueName: string;
    dataPoints: TrendDataPoint[];
    totalMentions: number;
}

/**
 * Get keyword/issue frequency trends over time for sparkline charts
 * Groups segment_issues by issue and meeting date
 */
export async function getKeywordTrends(topN: number = 4): Promise<IssueTrend[]> {
    try {
        // Get segment_issues with their segment's video_id and issue info
        const { data, error } = await supabase
            .from('segment_issues')
            .select(`
                issue_id,
                issues:issue_id (
                    id,
                    name
                ),
                segments:segment_id (
                    video_id
                )
            `);

        if (error) {
            console.error('Error fetching keyword trends:', error);
            return [];
        }

        if (!data || data.length === 0) {
            return [];
        }

        // Get unique video IDs to fetch their dates
        const videoIds = [...new Set(
            data
                .map((row: any) => row.segments?.video_id)
                .filter(Boolean)
        )];

        if (videoIds.length === 0) return [];

        // Fetch video dates
        const { data: videos } = await supabase
            .from('video_transcriptions')
            .select('video_id, published_at')
            .in('video_id', videoIds);

        const videoDateMap = new Map<string, string>();
        videos?.forEach((v: any) => {
            if (v.published_at) {
                videoDateMap.set(v.video_id, v.published_at.split('T')[0]);
            }
        });

        // Aggregate by issue and date
        const issueMap = new Map<string, {
            name: string;
            dateCounts: Map<string, number>;
            total: number;
        }>();

        data.forEach((row: any) => {
            if (!row.issues || !row.segments?.video_id) return;

            const issueId = row.issues.id;
            const issueName = row.issues.name;
            const date = videoDateMap.get(row.segments.video_id);
            if (!date) return;

            if (!issueMap.has(issueId)) {
                issueMap.set(issueId, {
                    name: issueName,
                    dateCounts: new Map(),
                    total: 0,
                });
            }

            const issue = issueMap.get(issueId)!;
            issue.dateCounts.set(date, (issue.dateCounts.get(date) || 0) + 1);
            issue.total++;
        });

        // Sort by total mentions and take top N
        const sortedIssues = Array.from(issueMap.entries())
            .sort(([, a], [, b]) => b.total - a.total)
            .slice(0, topN);

        return sortedIssues.map(([issueId, info]) => ({
            issueId,
            issueName: info.name,
            totalMentions: info.total,
            dataPoints: Array.from(info.dateCounts.entries())
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([date, count]) => ({ date, count })),
        }));
    } catch (error) {
        console.error('Unexpected error fetching keyword trends:', error);
        return [];
    }
}
