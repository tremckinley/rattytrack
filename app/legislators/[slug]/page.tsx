import { getLegislatorProfile } from "@/lib/data/legislators/legislator_profile"
import { getLegislatorIssueMetricsDirect } from "@/lib/data/legislator_issue_metrics"
import { getKeyQuotesForLegislator } from "@/lib/data/client/key-quotes-client"
import { getVotingRecordsForLegislator, getVotingSummary } from "@/lib/data/voting-records"
import { getAttendanceForLegislator } from "@/lib/data/attendance"
import Image from "next/image";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserPen, faArrowLeft, faCheckCircle, faXmarkCircle, faGavel } from "@fortawesome/free-solid-svg-icons";
import UserIcon from "@/components/layout/UserIcon";
import IssueSpeakingDashboard, { IssueCategory } from "@/components/charts/IssueSpeakingDashboard";
import QuotesList from "@/components/dashboard/QuotesList";
import VotingRecordsCard from "@/components/dashboard/VotingRecordsCard";
import AttendanceHeatmap from "@/components/charts/AttendanceHeatmap";
import PaywallGate from "@/components/subscription/PaywallGate";
import { notFound } from "next/navigation";
import { Legislator } from "@/types/Legislator";

type Props = {
    params: Promise<{ slug: string }>
}

export default async function LegislatorPage({ params }: Props) {
    const { slug } = await params
    const legislator: Legislator | null = await getLegislatorProfile(slug);

    if (!legislator) {
        notFound();
    }

    // Fetch key quotes for this legislator (10 max as per user preference)
    const keyQuotes = await getKeyQuotesForLegislator(legislator.id, { limit: 10 });

    // Fetch voting records
    const votingRecords = await getVotingRecordsForLegislator(legislator.id, { limit: 15 });
    const votingSummary = await getVotingSummary(legislator.id);

    // Fetch attendance records for heatmap
    const attendanceData = await getAttendanceForLegislator(legislator.id);

    // Try to get sentiment-enhanced issue metrics (requires schema improvements to be applied)
    let issueMetrics = await getLegislatorIssueMetricsDirect(legislator.id, 5);

    // Fallback to legacy top_issues JSONB if new schema not applied yet
    if (issueMetrics.length === 0 && legislator.stats?.[0]?.top_issues) {
        const topIssues = legislator.stats[0].top_issues;
        // Convert legacy format to new format (without sentiment data)
        if (Array.isArray(topIssues) && topIssues.length > 0) {
            issueMetrics = topIssues.slice(0, 5).map((issueId: string) => ({
                issue_id: issueId,
                issue_name: issueId, // Will be formatted by component
                total_mentions: 0,
                positive_mentions: 0,
                negative_mentions: 0,
                neutral_mentions: 0,
                average_sentiment_score: 0,
                total_speaking_time_seconds: 0,
            }));
        }
    }

    // Mock data fallback for demo purposes
    if (issueMetrics.length === 0) {
        issueMetrics = [
            { issue_id: '1', issue_name: 'budget', total_mentions: 15, positive_mentions: 10, negative_mentions: 2, neutral_mentions: 3, average_sentiment_score: 0.4, total_speaking_time_seconds: 1200 },
            { issue_id: '2', issue_name: 'public_safety', total_mentions: 12, positive_mentions: 8, negative_mentions: 1, neutral_mentions: 3, average_sentiment_score: 0.5, total_speaking_time_seconds: 900 },
            { issue_id: '3', issue_name: 'housing', total_mentions: 9, positive_mentions: 5, negative_mentions: 2, neutral_mentions: 2, average_sentiment_score: 0.2, total_speaking_time_seconds: 720 },
            { issue_id: '4', issue_name: 'infrastructure', total_mentions: 7, positive_mentions: 4, negative_mentions: 2, neutral_mentions: 1, average_sentiment_score: 0.1, total_speaking_time_seconds: 540 },
            { issue_id: '5', issue_name: 'environment', total_mentions: 5, positive_mentions: 4, negative_mentions: 0, neutral_mentions: 1, average_sentiment_score: 0.6, total_speaking_time_seconds: 420 },
        ];
    }


    return (
        <main className="md:grid md:grid-cols-[1fr_2fr] min-h-screen">
            <div>
                <Link href="./" className="ml-4">
                    <FontAwesomeIcon icon={faArrowLeft} />Back</Link>
                <section id="profile-card" className="card md:h-full py-8 flex flex-col items-center bg-sidebar border border-sidebar-border">

                    {/*Profile header*/}
                    <div className="flex flex-col text-center md:items-center md:mb-4">
                        {false ? (
                            <Image
                                src={"hi"}
                                alt="avatar for legislator"
                                height={75}
                                width={75}
                            />
                        ) : (
                            <UserIcon height={24} width={24} />
                        )}
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-lg">{legislator.display_name}</h3>
                            {legislator.is_active === false && (
                                <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-full">
                                    Former
                                </span>
                            )}
                        </div>
                        <p className="text-gray-600">{legislator.title}</p>
                        <p className="text-xs text-gray-600">{legislator.district}</p>
                        {legislator.term_start && legislator.term_end && (
                            <p className="text-xs text-gray-500 mt-2">
                                Term: {new Date(legislator.term_start).getFullYear()} - {new Date(legislator.term_end).getFullYear()}
                            </p>
                        )}
                    </div>

                    <div id="legislator-stats" className="flex w-full justify-center md:inline-block md:w-3/4 text-center">
                        {/* Voting Summary Stats */}
                        <div className="grid grid-cols-3 gap-2 w-full mb-4">
                            <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3 border border-green-200 dark:border-green-800">
                                <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 dark:text-green-400 mb-1" />
                                <p className="text-lg font-bold text-green-700 dark:text-green-300">{votingSummary.yesVotes}</p>
                                <p className="text-xs text-green-600 dark:text-green-400">Yes Votes</p>
                            </div>
                            <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-3 border border-red-200 dark:border-red-800">
                                <FontAwesomeIcon icon={faXmarkCircle} className="text-red-600 dark:text-red-400 mb-1" />
                                <p className="text-lg font-bold text-red-700 dark:text-red-300">{votingSummary.noVotes}</p>
                                <p className="text-xs text-red-600 dark:text-red-400">No Votes</p>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                                <FontAwesomeIcon icon={faGavel} className="text-blue-600 dark:text-blue-400 mb-1" />
                                <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{votingSummary.totalVotes}</p>
                                <p className="text-xs text-blue-600 dark:text-blue-400">Total Votes</p>
                            </div>
                        </div>

                        <div id="bills-sponsored" className="bg-sidebar-foreground/10 background rounded-lg p-3 m-1 border border-accent-foreground/30">
                            <FontAwesomeIcon icon={faUserPen} className="mr-2 w-full" /><br className="md:hidden" /><span>Bills Sponsored</span>
                            <p className="text-xl font-bold">{legislator.stats?.[0]?.bills_sponsored || 0}</p>
                        </div>

                        {/* Attendance Rate */}
                        <div className="bg-sidebar-foreground/10 rounded-lg p-3 m-1 border border-accent-foreground/30">
                            <p className="text-sm text-gray-600">Attendance</p>
                            <p className="text-xl font-bold">{votingSummary.attendanceRate}%</p>
                        </div>
                    </div>
                    <div className="mt-8">
                        <p className="font-bold">Committees</p>
                        {legislator.committees?.map((committee, idx) => (<span key={idx} className="mx-2">{committee}</span>))}
                    </div>



                </section>
            </div>
            <section id="statements-section" className="overflow-y-auto p-2 space-y-4">
                <PaywallGate 
                    feature="legislator_deep_dive" 
                    fallbackMessage="Upgrade to Premium to view detailed voting records, topic analysis, and key quotes."
                >
                    <AttendanceHeatmap attendanceData={attendanceData} weeks={26} />
                    <VotingRecordsCard votes={votingRecords} maxVotes={10} />
                    <IssueSpeakingDashboard
                        issues={issueMetrics.map(m => ({
                            issueId: m.issue_id,
                            issueName: m.issue_name,
                            totalMentions: m.total_mentions,
                            positiveMentions: m.positive_mentions,
                            negativeMentions: m.negative_mentions,
                            neutralMentions: m.neutral_mentions,
                            speakingTimeSeconds: m.total_speaking_time_seconds,
                            statements: [],
                        }))}
                    />
                    <QuotesList variant="profile" quotes={keyQuotes} maxQuotes={10} />
                </PaywallGate>
            </section>

        </main>
    );
}
