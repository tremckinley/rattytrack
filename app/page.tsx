import TotalCard from "@/components/dashboard/TotalCard"
import SearchBar from "@/components/layout/SearchBar"
import RecentMeetingsFeed from "@/components/dashboard/RecentMeetingsFeed"
import UpcomingDocket from "@/components/dashboard/UpcomingDocket"
import IssueBarChart from "@/components/charts/IssueBarChart"
import QuotesList from "@/components/dashboard/QuotesList"
import LegislatorQuickGlance from "@/components/dashboard/LegislatorQuickGlance"
import VotingActivitySummary from "@/components/dashboard/VotingActivitySummary"
import TopicTrendLines from "@/components/dashboard/TopicTrendLines"
import WatchdogAlerts from "@/components/dashboard/WatchdogAlerts"

import "./globals.css";
import * as solidIcons from "@fortawesome/free-solid-svg-icons";
import { getTotalTranscriptions, getTotalTrackedLegislators } from "@/lib/data/transcriptions";
import { getTotalIssues, getTopIssuesOverall } from "@/lib/data/issues";
import { getTotalHoursProcessed } from "@/lib/data/transcriptions";
import { getRecentMeetings, getUpcomingMeetings } from "@/lib/data/meetings";
import { getRecentHighImpactQuotes } from "@/lib/data/key-quotes";
import { getOverallVotingActivity } from "@/lib/data/voting-records";
import { getActiveLegislatorsWithStats } from "@/lib/data/legislators/legislator_card";
import { getKeywordTrends } from "@/lib/data/dashboard";
import PageContainer from "@/components/layout/PageContainer";

export default async function Dashboard() {
    // Fetch all dashboard data in parallel
    const [
        totalVideos,
        totalLegislators,
        totalIssues,
        totalHoursProcessed,
        recentMeetings,
        upcomingMeetings,
        topIssues,
        quotes,
        votingActivity,
        legislators,
        trends,
    ] = await Promise.all([
        getTotalTranscriptions(),
        getTotalTrackedLegislators(),
        getTotalIssues(),
        getTotalHoursProcessed(),
        getRecentMeetings(5),
        getUpcomingMeetings(5),
        getTopIssuesOverall(6),
        getRecentHighImpactQuotes(5),
        getOverallVotingActivity(),
        getActiveLegislatorsWithStats(12),
        getKeywordTrends(4),
    ]);

    return (
        <PageContainer title="Dashboard" description="System overview and recent updates">
            {/* Dashboard Search */}
            <section className="mt-6 px-2 md:px-0">
                <SearchBar variant="hero" />
            </section>

            {/* Recent Meetings + Upcoming Docket */}
            <section className="mt-6 px-2 md:px-0 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RecentMeetingsFeed meetings={recentMeetings} />
                <UpcomingDocket meetings={upcomingMeetings} />
            </section>

            {/* Top Issues + Key Quotes */}
            <section className="mt-6 px-2 md:px-0 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <IssueBarChart variant="compact" issues={topIssues} />
                <QuotesList variant="dashboard" quotes={quotes} />
            </section>

            {/* Topic Trend Lines */}
            <section className="mt-6 px-2 md:px-0">
                <TopicTrendLines trends={trends} />
            </section>

            {/* Legislator Quick Glance */}
            <section className="mt-6 px-2 md:px-0">
                <LegislatorQuickGlance legislators={legislators} />
            </section>

            {/* Voting Activity + Watchdog Alerts */}
            <section className="mt-6 mb-12 px-2 md:px-0 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <VotingActivitySummary votingData={votingActivity} />
                <WatchdogAlerts />
            </section>
        </PageContainer>
    )
}