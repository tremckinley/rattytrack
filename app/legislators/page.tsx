import { getLegislators, LegislatorStatusFilter } from "@/lib/data/legislators/legislator_card";
import SearchableLegislators from "./searchableLegislators";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";

type LegislatorsPageProps = {
  searchParams: Promise<{ status?: string }>;
};

export default async function Legislators({ searchParams }: LegislatorsPageProps) {
  const params = await searchParams;
  const statusParam = params.status;
  const status: LegislatorStatusFilter = 
    statusParam === 'inactive' ? 'inactive' : 
    statusParam === 'all' ? 'all' : 
    'active';
  
  // Server-side data fetching with status filter
  const legislators = await getLegislators(status);
  
  return (
    <>
      <div className="mb-4">
        <h2>Legislators</h2>
        <p>
          Discover individual legislator activity, issue focus, and legislative
          history.
        </p>
      </div>
      {legislators.length === 0 ? (
        <div className="card text-center py-12">
           <FontAwesomeIcon icon={faTriangleExclamation} className="text-capyred text-4xl mb-4 animate-bounce-once" />
          <p className="text-foreground text-lg mb-4">Unable to load legislator data at this time.</p>
          <p className="">Please try refreshing the page or contact support if the issue persists.</p>
        </div>
      ) : (
        <SearchableLegislators legislators={legislators} initialStatus={status} />
      )}
    </>
  );
}