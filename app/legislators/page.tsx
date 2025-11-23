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
  const result = await getLegislators(status);

  const getEmptyStateMessage = () => {
    if (status === 'inactive') {
      return {
        title: 'No former legislators found',
        message: 'There are currently no inactive legislators in the system.'
      };
    } else if (status === 'all') {
      return {
        title: 'No legislators found',
        message: 'The legislators database is currently empty.'
      };
    } else {
      return {
        title: 'No current legislators found',
        message: 'There are no active legislators at this time. Try viewing "All" or "Former" legislators.'
      };
    }
  };

  const emptyState = getEmptyStateMessage();

  return (
    <>
      <div className="mb-4">
        <h2>Legislators</h2>
        <p>
          Discover individual legislator activity, issue focus, and legislative
          history.
        </p>
      </div>
      {result.error ? (
        <div className="card text-center py-12">
          <FontAwesomeIcon icon={faTriangleExclamation} className="text-capyred text-4xl mb-4 animate-bounce-once" />
          <p className="text-foreground text-lg mb-4">Unable to load legislator data at this time.</p>
          <p className="">Please try refreshing the page or contact support if the issue persists.</p>
        </div>
      ) : (
        <SearchableLegislators
          legislators={result.data}
          initialStatus={status}
          emptyState={emptyState}
        />
      )}
    </>
  );
}