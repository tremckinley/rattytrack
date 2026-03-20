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
import Image from "next/image";

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
        <div className="max-w-screen md:mx-24">
            {/* Banner + Stat Cards
            <section id="dashboard-banner" className="bg-rose-950 p-8 relative overflow-hidden shadow-solid">
                <h1 className="text-4xl my-4 font-bold text-white">CAPYTRACK AI</h1>
                <div className="grid grid-cols-2 w-fit lg:w-[70%] lg:flex">
                    <TotalCard title="Videos Analyzed" total={totalVideos} icon={solidIcons.faPlay} />
                    <TotalCard title="Legislators Tracked" total={totalLegislators} icon={solidIcons.faUsers} />
                    <TotalCard title="Issues Categorized" total={totalIssues} icon={solidIcons.faTag} />
                    <TotalCard title="Hours Processed" total={totalHoursProcessed} icon={solidIcons.faClock} />
                </div>
                <div className="absolute top-0 right-10 w-1/8 md:w-1/4 h-full bg-rose-900 transform -skew-x-12 translate-x-20 hidden xl:block opacity-50"></div>
            </section> */}

            {/* CapyTrack Logo */}
            <div className="flex items-center gap-2 justify-center">
            <Image
                        src="/burgundy_logo.png"
                        alt="capytrack logo"
                        width={100}
                        height={50}
                        className="w-12 md:w-16 h-auto"
                        priority
                      />
                      <span className="font-extrabold text-xl">CapyTrack</span>
                      </div>

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
        </div>
    )
}