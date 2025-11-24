import TotalCard from "@/components/TotalCard"

import "./globals.css";
import * as solidIcons from "@fortawesome/free-solid-svg-icons";
import { getTotalTranscriptions, getTotalTrackedLegislators } from "@/lib/data/transcriptions";
import { getTotalIssues } from "@/lib/data/issues";
import { getTotalHoursProcessed } from "@/lib/data/transcriptions";


export default async function Dashboard() {
    const totalVideos = await getTotalTranscriptions();
    const totalLegislators = await getTotalTrackedLegislators();
    const totalIssues = await getTotalIssues();
    const totalHoursProcessed = await getTotalHoursProcessed();

    return (
        <div className="max-w-screen md:mx-24 mt-16">
            <section id="dashboard-banner" className="bg-rose-950 p-8 relative overflow-hidden">
                <h1 className="text-4xl my-4 font-bold text-white">CAPYTRACK AI</h1>
                <div className="grid grid-cols-2 w-fit lg:w-[70%] lg:flex">
                    <TotalCard title="Videos Analyzed" total={totalVideos} icon={solidIcons.faPlay} />
                    <TotalCard title="Legislators Tracked" total={totalLegislators} icon={solidIcons.faUsers} />
                    <TotalCard title="Issues Categorized" total={totalIssues} icon={solidIcons.faTag} />
                    <TotalCard title="Hours Processed" total={totalHoursProcessed} icon={solidIcons.faClock} />
                </div>
                <div className="absolute top-0 right-10 w-1/8 md:w-1/4 h-full bg-rose-900 transform -skew-x-12 translate-x-20 hidden xl:block opacity-50"></div>
            </section>
            <section id="coming-soon" className="p-8">
                <h2 className="text-2xl font-bold mb-4">Coming Soon</h2>
                <p className="text-gray-600">Dashboard features below</p>
            </section>

        </div>)
}