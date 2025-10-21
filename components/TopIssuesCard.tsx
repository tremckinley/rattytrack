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
          const issueName = formatIssueName(issue);
          const score = 100; // Replace with actual score if available
          return (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm font-medium">{issueName}</span>
              <span className="text-sm font-medium">{score}%</span>
              <Progress value={score} className="w-full ml-4" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
