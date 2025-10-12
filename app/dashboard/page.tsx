import TotalCard from "@/components/totalCard"
import "../globals.css";
import * as solidIcons from "@fortawesome/free-solid-svg-icons";

export default function Dashboard() {
    return (
    <div>
        <TotalCard title="Test card" total={99} subtotal="420 active now" icon={solidIcons.faHouse} />
        Dashboard
    </div>)
}