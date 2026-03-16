// VotingActivitySummary — Compact card showing aggregate vote outcomes

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGavel, faCheckCircle, faTimesCircle, faPauseCircle, faHourglass } from '@fortawesome/free-solid-svg-icons';
import type { VotingActivityOverview } from '@/lib/data/voting-records';

interface VotingActivitySummaryProps {
    votingData: VotingActivityOverview;
}

export default function VotingActivitySummary({ votingData }: VotingActivitySummaryProps) {
    const { totalActions, passed, failed, tabled, pending } = votingData;

    // Calculate percentages for the stacked bar
    const passedPct = totalActions > 0 ? (passed / totalActions) * 100 : 0;
    const failedPct = totalActions > 0 ? (failed / totalActions) * 100 : 0;
    const tabledPct = totalActions > 0 ? (tabled / totalActions) * 100 : 0;
    const pendingPct = totalActions > 0 ? (pending / totalActions) * 100 : 0;

    return (
        <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
                <FontAwesomeIcon icon={faGavel} className="text-capyred" />
                <h3 className="text-lg font-bold">Voting Activity</h3>
            </div>

            {/* Total count */}
            <p className="text-3xl font-bold text-foreground mb-1">{totalActions}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-4">Legislative Actions</p>

            {/* Stacked bar */}
            <div className="w-full h-3 flex overflow-hidden mb-4">
                {passedPct > 0 && (
                    <div
                        className="bg-green-500 h-full transition-all"
                        style={{ width: `${passedPct}%` }}
                        title={`Passed: ${passed}`}
                    />
                )}
                {failedPct > 0 && (
                    <div
                        className="bg-red-500 h-full transition-all"
                        style={{ width: `${failedPct}%` }}
                        title={`Failed: ${failed}`}
                    />
                )}
                {tabledPct > 0 && (
                    <div
                        className="bg-yellow-400 h-full transition-all"
                        style={{ width: `${tabledPct}%` }}
                        title={`Tabled: ${tabled}`}
                    />
                )}
                {pendingPct > 0 && (
                    <div
                        className="bg-gray-300 h-full transition-all"
                        style={{ width: `${pendingPct}%` }}
                        title={`Pending: ${pending}`}
                    />
                )}
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 text-sm" />
                    <div>
                        <p className="text-sm font-bold text-foreground">{passed}</p>
                        <p className="text-xs text-gray-500">Passed</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faTimesCircle} className="text-red-500 text-sm" />
                    <div>
                        <p className="text-sm font-bold text-foreground">{failed}</p>
                        <p className="text-xs text-gray-500">Failed</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faPauseCircle} className="text-yellow-500 text-sm" />
                    <div>
                        <p className="text-sm font-bold text-foreground">{tabled}</p>
                        <p className="text-xs text-gray-500">Tabled</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faHourglass} className="text-gray-400 text-sm" />
                    <div>
                        <p className="text-sm font-bold text-foreground">{pending}</p>
                        <p className="text-xs text-gray-500">Pending</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
