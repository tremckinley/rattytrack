import { StatementWithIssue } from "@/lib/data/legislator_statements";

type StatementCardProps = {
  statements: StatementWithIssue[];
};

export default function StatementCard({ statements }: StatementCardProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (statements.length === 0) {
    return (
      <div className="card">
        <h2 className="text-lg font-bold mb-4">Recent Statements</h2>
        <p className="text-gray-500">No statements found for this legislator.</p>
      </div>
    );
  }

  return (
    <div className="card h-full overflow-y-auto">
      <h2 className="text-lg font-bold mb-4">Recent Statements</h2>
      <div className="space-y-4">
        {statements.map((statement) => (
          <div 
            key={statement.id} 
            className="border-l-4 border-accent-foreground/30 pl-4 py-2 hover:bg-sidebar-foreground/5 transition-colors"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="text-xs text-gray-600">
                {formatDate(statement.meeting_date)}
              </div>
              <div className="text-xs text-gray-500">
                {formatTime(statement.start_time_seconds)}
              </div>
            </div>
            
            <div className="text-sm mb-2">
              <span className="font-semibold text-gray-700">{statement.meeting_title}</span>
            </div>

            <p className="text-sm text-foreground mb-2 line-clamp-3 hover:line-clamp-none active:line-clamp-none">
              {statement.text}
            </p>

            {statement.issues.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {statement.issues
                  .sort((a, b) => b.relevance_score - a.relevance_score)
                  .slice(0, 3)
                  .map((issue, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-accent-foreground/10 text-accent-foreground"
                    >
                      {issue.issue_name}
                    </span>
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
