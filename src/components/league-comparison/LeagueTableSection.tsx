import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LeagueTable } from "@/components/LeagueTable";
import { StatsCard } from "@/components/StatsCard";

interface LeagueTableSectionProps {
  isLoadingoverallLeagueData: boolean;
  leagueData: any;
  selectedLeague: string;
  pageNumber: string;
  setPageNumber: (value: string) => void;
  onManagerSelect: (manager: string) => void;
}

export function LeagueTableSection({
  isLoadingoverallLeagueData,
  leagueData,
  selectedLeague,
  pageNumber,
  setPageNumber,
  onManagerSelect,
}: LeagueTableSectionProps) {
  const handlePreviousPage = () => {
    const newPage = (parseInt(pageNumber) - 1).toString();
    setPageNumber(newPage);
  };

  const handleNextPage = () => {
    const newPage = (parseInt(pageNumber) + 1).toString();
    setPageNumber(newPage);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>League Table</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoadingoverallLeagueData ? (
          <StatsCard
            title="Loading Table Data"
            value="..."
            description=""
          />
        ) : (
          <>
            <div className="p-2 flex justify-between items-center">
              <h3 className="text-lg font-medium">{selectedLeague} League Standings</h3>
              <div className="flex gap-2 items-center">
                <span>Page: {pageNumber}</span>
                <Button
                  variant="outline"
                  disabled={parseInt(pageNumber) === 1}
                  onClick={handlePreviousPage}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  disabled={!leagueData?.standings?.has_next}
                  onClick={handleNextPage}
                >
                  Next
                </Button>
              </div>
            </div>
            <LeagueTable onManagerSelect={onManagerSelect} leagueData={leagueData.standings.results} />
            <div className="p-1 mt-4 flex justify-between">
              <span>Page: {pageNumber}</span>
              <div className="flex">
                <Button
                  variant="outline"
                  disabled={parseInt(pageNumber) === 1}
                  onClick={handlePreviousPage}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  disabled={!leagueData?.standings?.has_next}
                  onClick={handleNextPage}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}