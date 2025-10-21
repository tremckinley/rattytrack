import { getLegislatorProfile } from "@/lib/data/legislator_profile"
import { getLegislatorStatements } from "@/lib/data/legislator_statements"
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComments, faUserPen } from "@fortawesome/free-solid-svg-icons";
import UserIcon from "@/components/userIcon";
import StatementCard from "@/components/statementCard";
import TopIssuesCard from "@/components/TopIssuesCard";
import { notFound } from "next/navigation";
import { Legislator } from "@/types/Legislator";

type Props = {
    params: { slug: string }
}



export default async function LegislatorPage({ params }: Props) {
    const { slug } = await params
    const legislator: Legislator | null = await getLegislatorProfile(slug);
      
    if (!legislator) {
        notFound();
    }

    const statements = await getLegislatorStatements(legislator.id);
    const topIssues = legislator.stats?.[0]?.top_issues || [];

    return (
        <main className="grid grid-cols-[1fr_2fr] h-screen">
            <section id="profile-card" className="card h-full py-8 flex flex-col items-center bg-sidebar border border-sidebar-border">
                {/*Profile header*/}
                <div className="flex flex-col items-center mb-4">
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
                    <h3 className="font-bold text-lg">{legislator.display_name}</h3>
                    <p className="text-gray-600">{legislator.title}</p>
                    <p className="text-xs text-gray-600">{legislator.district}</p>
                </div>

                <div id="legislator-stats" className="w-3/4 text-center">
                    <div id="tracked-comments" className="bg-sidebar-foreground/10 background rounded-lg p-3 m-1 border border-accent-foreground/30">
                        <p ><FontAwesomeIcon icon={faComments} className="mr-2" />Tracked Statements</p>
                        <p className="text-xl font-bold">{legislator.stats?.[0].total_segments || 0 }</p>
                    </div>
                    <div id="bills-sponsored" className="bg-sidebar-foreground/10 background rounded-lg p-3 m-1 border border-accent-foreground/30">
                        <p><FontAwesomeIcon icon={faUserPen} className="mr-2" />Bills Sponsored</p>
                        <p className="text-xl font-bold">{ legislator.stats?.[0].bills_sponsored || 0 }</p>
                    </div>
                </div>
                <div className="mt-8">
                    <p className="font-bold">Committees</p>
                    {legislator.committees?.map( (committee, idx) =>( <span key={idx} className="mx-2">{committee}</span>)) }
                </div>

                

            </section>

            <section id="statements-section" className="overflow-y-auto">
                <TopIssuesCard topIssues={topIssues} />
                <StatementCard statements={statements} />
            </section>

        </main>
    );
}