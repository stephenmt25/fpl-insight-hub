import { Button } from "@/components/ui/button";
import { LeagueTable } from "@/components/LeagueTable";
import { StatsCard } from "@/components/StatsCard";

interface LeagueSectionProps {
  selectedLeague: string;
  pageNumber: string;
  setPageNumber: (value: string) => void;
  isLoadingoverallLeagueData: boolean;
  leagueData: any;
}

export function LeagueSection({
  selectedLeague,
  pageNumber,
  setPageNumber,
  isLoadingoverallLeagueData,
  leagueData,
}: LeagueSectionProps) {
  return (
    <div className="lg:col-span-1 max-w-[95%] lg:max-w-full">
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-medium">{selectedLeague} League Standings</h3>
        <div className="flex gap-2 items-center">
          <span>Page: {pageNumber}</span>
          <Button
            variant="outline"
            disabled={parseInt(pageNumber) === 1}
            onClick={() => setPageNumber((prev) => (parseInt(prev) - 1).toString())}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            disabled={!leagueData?.standings?.has_next}
            onClick={() => setPageNumber((prev) => (parseInt(prev) + 1).toString())}
          >
            Next
          </Button>
        </div>
      </div>

      {isLoadingoverallLeagueData ? (
        <StatsCard title="Loading Table Data" value="..." description="" />
      ) : (
        <>
          <LeagueTable leagueData={leagueData.standings.results} />
          <div className="p-1 mt-4 flex justify-between">
            <span>Page: {pageNumber}</span>
            <div className="flex">
              <Button
                variant="outline"
                disabled={parseInt(pageNumber) === 1}
                onClick={() => setPageNumber((prev) => (parseInt(prev) - 1).toString())}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={!leagueData?.standings?.has_next}
                onClick={() => setPageNumber((prev) => (parseInt(prev) + 1).toString())}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}