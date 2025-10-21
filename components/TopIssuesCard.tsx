import { Progress } from "@/components/ui/progress";
import { LegislatorIssueMetric } from "@/types/Legislator";

type TopIssuesCardProps = {
  issueMetrics: LegislatorIssueMetric[];
};

const formatIssueName = (name: string) => {
  return name
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default function TopIssuesCard({ issueMetrics }: TopIssuesCardProps) {
  if (!issueMetrics || issueMetrics.length === 0) {
    return (
      <div className="card">
        <h2 className="text-lg font-bold mb-4">Top Issue Areas</h2>
        <p className="text-gray-500">No issue data available for this legislator.</p>
      </div>
    );
  }

  // Find max mentions for scaling progress bars
  const maxMentions = Math.max(...issueMetrics.map(m => m.total_mentions));

  return (
    <div className="card">
      <h2 className="text-lg font-bold mb-6">Top Issue Areas</h2>
      <div className="space-y-5">
        {issueMetrics.map((metric) => {
          const totalMentions = metric.total_mentions;
          const percentage = maxMentions > 0 ? (totalMentions / maxMentions) * 100 : 0;
          
          // Calculate sentiment percentages
          const positivePercent = totalMentions > 0 
            ? Math.round((metric.positive_mentions / totalMentions) * 100) 
            : 0;
          const negativePercent = totalMentions > 0 
            ? Math.round((metric.negative_mentions / totalMentions) * 100) 
            : 0;
          const neutralPercent = totalMentions > 0 
            ? Math.round((metric.neutral_mentions / totalMentions) * 100) 
            : 0;

          // Determine overall sentiment indicator
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