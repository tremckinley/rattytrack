import { TopIssue } from "@/types/Legislator";
import { Progress } from "@/components/ui/progress";

type TopIssuesCardProps = {
  topIssues: TopIssue[];
};

export default function TopIssuesCard({ topIssues }: TopIssuesCardProps) {
  if (!topIssues || topIssues.length === 0) {
    return (
      <div className="card">
        <h2 className="text-lg font-bold mb-4">Top Issue Areas</h2>
        <p className="text-gray-500">No issue data available for this legislator.</p>
      </div>
    );
  }

  const maxScore = Math.max(...topIssues.map(issue => issue.score || 0));

  const formatIssueName = (name: string) => {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="card">
      <h2 className="text-lg font-bold mb-6">Top Issue Areas</h2>
      <div className="space-y-5">
        {topIssues.map((issue, index) => {
          const score = issue.score || 0;
          const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
          
          return (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-foreground">
                  {formatIssueName(issue.name)}
                </span>
                <span className="text-sm text-muted-foreground">
                  {score} {score === 1 ? 'mention' : 'mentions'}
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
