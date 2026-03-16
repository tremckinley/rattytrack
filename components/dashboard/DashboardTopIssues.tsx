// DashboardTopIssues — Compact bar chart of top issues by mention count

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTag } from '@fortawesome/free-solid-svg-icons';
import type { TopIssueOverall } from '@/lib/data/issues';

interface DashboardTopIssuesProps {
    issues: TopIssueOverall[];
}

const formatIssueName = (name: string) => {
    return name
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

// Issue color palette for bars
const issueColors = [
    'bg-capyred',
    'bg-rose-700',
    'bg-rose-500',
    'bg-rose-400',
    'bg-rose-300',
    'bg-rose-200',
];

export default function DashboardTopIssues({ issues }: DashboardTopIssuesProps) {
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
