import { Progress } from "@/components/ui/progress";
import { getIssueIds } from "@/lib/data/issues";

type TopIssuesCardProps = {
  topIssues: string[];
};

const formatIssueName = (name: string) => {
  return name
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default async function TopIssuesCard({ topIssues }: TopIssuesCardProps) {
  if (!topIssues || topIssues.length === 0) {
    return (
      <div className="card">
        <h2 className="text-lg font-bold mb-4">Top Issue Areas</h2>
        <p className="text-gray-500">No issue data available for this legislator.</p>
      </div>
    );
  }

  const issueIdsMap = await getIssueIds();
  const issueNames: Record<string, string> = {};
  
  if (issueIdsMap) {
    issueIdsMap.forEach((name, id) => {
      issueNames[id] = name;
    });
  }
  return (
    <div className="card">
      <h2 className="text-lg font-bold mb-6">Top Issue Areas</h2>
      <div className="space-y-5">
        {topIssues.map((issue, idx) => {
          const issueName = issueNames[issue] || issue;
          return (
            <div key={idx} className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                {formatIssueName(issueName)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}