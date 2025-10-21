import { Progress } from "@/components/ui/progress";
import { getIssueById } from "@/lib/data/issues";

type TopIssuesCardProps = {
  topIssues: string[];
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

  //const maxScore = Math.max(...topIssues.map(issue => issue.score || 0));

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
          return (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-foreground">
                  {getIssueById(issue)}
                </span>            
              </div>
              {/*<Progress value={percentage} className="h-2" />*/}
            </div>
          );
        })}
      </div>
    </div>
  );
}
