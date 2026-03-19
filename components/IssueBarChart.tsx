// IssueBarChart — Unified component for displaying top issues
// Used on: legislator profile (variant="detailed") and dashboard (variant="compact")

import { Progress } from "@/components/ui/progress";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTag } from '@fortawesome/free-solid-svg-icons';
import { formatIssueName } from '@/lib/utils/format';
import type { LegislatorIssueMetric } from "@/types/Legislator";
import type { TopIssueOverall } from '@/lib/data/issues';

// Issue color palette for compact bars
const issueColors = [
    'bg-capyred',
    'bg-rose-700',
    'bg-rose-500',
    'bg-rose-400',
    'bg-rose-300',
    'bg-rose-200',
];

// ─── Detailed Variant (Legislator Profile) ───────────────────────────────────

interface DetailedIssueBarChartProps {
    variant: 'detailed';
    issueMetrics: LegislatorIssueMetric[];
}

function DetailedIssueBarChart({ issueMetrics }: DetailedIssueBarChartProps) {
    if (!issueMetrics || issueMetrics.length === 0) {
        return (
            <div className="card">
                <h2 className="text-lg font-bold mb-4">Top Issue Areas</h2>
                <p className="text-gray-500">No issue data available for this legislator.</p>
            </div>
        );
    }

    const maxMentions = Math.max(...issueMetrics.map(m => m.total_mentions));

    return (
        <div className="card">
            <h2 className="text-lg font-bold mb-6">Top Issue Areas</h2>
            <div className="space-y-5">
                {issueMetrics.map((metric) => {
                    const totalMentions = metric.total_mentions;
                    const percentage = maxMentions > 0 ? (totalMentions / maxMentions) * 100 : 0;

                    const positivePercent = totalMentions > 0
                        ? Math.round((metric.positive_mentions / totalMentions) * 100) : 0;
                    const negativePercent = totalMentions > 0
                        ? Math.round((metric.negative_mentions / totalMentions) * 100) : 0;
                    const neutralPercent = totalMentions > 0
                        ? Math.round((metric.neutral_mentions / totalMentions) * 100) : 0;

                    const sentimentColor = metric.average_sentiment_score > 0.2
                        ? 'text-green-600'
                        : metric.average_sentiment_score < -0.2
                            ? 'text-red-600'
                            : 'text-gray-600';

                    return (
                        <div key={metric.issue_id} className="space-y-2">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <span className="text-sm font-medium text-foreground">
                                        {formatIssueName(metric.issue_name)}
                                    </span>
                                    <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                                        <span className="text-green-600">↑ {positivePercent}%</span>
                                        <span className="text-gray-500">− {neutralPercent}%</span>
                                        <span className="text-red-600">↓ {negativePercent}%</span>
                                    </div>
                                </div>
                                <span className={`text-sm font-medium ${sentimentColor}`}>
                                    {totalMentions} {totalMentions === 1 ? 'mention' : 'mentions'}
                                </span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Compact Variant (Dashboard) ─────────────────────────────────────────────

interface CompactIssueBarChartProps {
    variant: 'compact';
    issues: TopIssueOverall[];
}

function CompactIssueBarChart({ issues }: CompactIssueBarChartProps) {
    if (!issues || issues.length === 0) {
        return (
            <div className="card p-6">
                <div className="flex items-center gap-2 mb-4">
                    <FontAwesomeIcon icon={faTag} className="text-capyred" />
                    <h3 className="text-lg font-bold">Top Issues</h3>
                </div>
                <p className="text-gray-500 text-sm">No issue data available yet.</p>
            </div>
        );
    }

    const maxCount = Math.max(...issues.map(i => i.mentionCount));

    return (
        <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
                <FontAwesomeIcon icon={faTag} className="text-capyred" />
                <h3 className="text-lg font-bold">Top Issues</h3>
            </div>
            <div className="space-y-3">
                {issues.map((issue, index) => {
                    const percentage = maxCount > 0 ? (issue.mentionCount / maxCount) * 100 : 0;
                    const colorClass = issueColors[index % issueColors.length];

                    return (
                        <div key={issue.id} className="space-y-1">
                            <div className="flex justify-between items-baseline">
                                <span className="text-sm font-medium text-foreground">
                                    {formatIssueName(issue.name)}
                                </span>
                                <span className="text-xs text-gray-500 font-mono">
                                    {issue.mentionCount}
                                </span>
                            </div>
                            <div className="w-full bg-gray-100 h-2">
                                <div
                                    className={`h-2 ${colorClass} transition-all duration-500`}
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Unified Export ──────────────────────────────────────────────────────────

type IssueBarChartProps = DetailedIssueBarChartProps | CompactIssueBarChartProps;

export default function IssueBarChart(props: IssueBarChartProps) {
    if (props.variant === 'detailed') {
        return <DetailedIssueBarChart {...props} />;
    }
    return <CompactIssueBarChart {...props} />;
}
