import TotalCard from "@/components/TotalCard"
import LivestreamSummary from "@/components/livestreamSummary";
import "./globals.css";
import * as solidIcons from "@fortawesome/free-solid-svg-icons";


export default function Dashboard() {
    return (
        <div className="max-w-screen md:mx-24 mt-16">
            <section id="dashboard-banner" className="bg-rose-950 p-8 relative overflow-hidden">
                <h1 className="text-4xl my-4 font-bold text-white">CAPYTRACK AI</h1>
            <div className="grid grid-cols-2 w-fit lg:w-[70%] lg:flex">
                <TotalCard title="Videos Analyzed" total={99} icon={solidIcons.faPlay} />
                <TotalCard title="Legislators Tracked" total={14} icon={solidIcons.faUsers} />
                <TotalCard title="Issues Categorized" total={2} icon={solidIcons.faTag} />
                <TotalCard title="Hours Processed" total={4123} icon={solidIcons.faClock} />
            </div>
            <div className="absolute top-0 right-10 w-1/8 md:w-1/4 h-full bg-rose-900 transform -skew-x-12 translate-x-20 hidden xl:block opacity-50"></div>
            </section>
            
        </div>)
}