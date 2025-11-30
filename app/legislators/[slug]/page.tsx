import { getLegislatorProfile } from "@/lib/data/legislators/legislator_profile"
import { getLegislatorStatements } from "@/lib/data/legislators/legislator_statements"
import { getLegislatorIssueMetricsDirect } from "@/lib/data/legislator_issue_metrics"
import Image from "next/image";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComments, faUserPen, faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import UserIcon from "@/components/userIcon";
import StatementCard from "@/components/statementCard";
import TopIssuesCard from "@/components/TopIssuesCard";
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

    const statements = await getLegislatorStatements(legislator.id);
    
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

    return (
        <main className="md:grid md:grid-cols-[1fr_2fr] h-screen">
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

                <div id="legislator-stats" className="flex w-1/4 justify-center md:inline-block md:w-3/4 text-center">
                    <div id="tracked-comments" 
                        className="bg-sidebar-foreground/10 background rounded-lg p-3 m-1 border border-accent-foreground/30"
                    >

                    </div>
                    <div id="bills-sponsored" className="bg-sidebar-foreground/10 background rounded-lg p-3 m-1 border border-accent-foreground/30">
                        <FontAwesomeIcon icon={faUserPen} className="mr-2 w-full"/><br className="md:hidden"/><span>Bills Sponsored</span>
                        <p className="text-xl font-bold">{ legislator.stats?.[0].bills_sponsored || 0 }</p>
                    </div>
                </div>
                <div className="mt-8">
                    <p className="font-bold">Committees</p>
                    {legislator.committees?.map( (committee, idx) =>( <span key={idx} className="mx-2">{committee}</span>)) }
                </div>

                

            </section>
            </div>
            <section id="statements-section" className="">
                <TopIssuesCard issueMetrics={issueMetrics} />
                <StatementCard statements={statements} />
            </section>

        </main>
    );
}