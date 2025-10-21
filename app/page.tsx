import TotalCard from "@/components/totalCard"
import LivestreamSummary from "@/components/livestreamSummary";
import "./globals.css";
import * as solidIcons from "@fortawesome/free-solid-svg-icons";


export default function Dashboard() {
    return (
        <div className="">
            <section className="flex flex-wrap justify-center">
                <TotalCard title="Active Streams" total={99} subtotal="420 active now" icon={solidIcons.faPlay} />
                <TotalCard title="Legislators Tracked" total={14} subtotal="3 active today" icon={solidIcons.faUsers} />
                <TotalCard title="Issues Categorized" total={2} icon={solidIcons.faTag} />
                <TotalCard title="Hours Processed" total={4123} subtotal="+12.7 today" icon={solidIcons.faClock} />
            </section>
            <section>
                <LivestreamSummary />
            </section>


            Dashboard
        </div>)
}