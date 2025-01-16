import { Button } from "@/components/ui/button";
import { LeagueTable } from "@/components/LeagueTable";
import { StatsCard } from "@/components/StatsCard";
import { useState } from "react";

interface LeagueTableSectionProps {
  isLoadingoverallLeagueData: boolean;
  leagueData: any;
  pageNumber: string;
  setPageNumber: (value: string) => void;
  onManagerSelect: (manager: string) => void;
  setLeagueId: (id: string) => void;
}

export function LeagueTableSection({
  isLoadingoverallLeagueData,
  leagueData,
  pageNumber,
  setPageNumber,
  onManagerSelect,
  setLeagueId
}: LeagueTableSectionProps) {
  const handlePreviousPage = () => {
    const newPage = (parseInt(pageNumber) - 1).toString();
    setPageNumber(newPage);
  };

  const handleNextPage = () => {
    const newPage = (parseInt(pageNumber) + 1).toString();
    setPageNumber(newPage);
  };

  const [selectedLeague, setSelectedLeague] = useState("Overall");
  const [id, setId] = useState("314")

  const updateSelectedLeague = (leagueId: string) => {
    const managerData = localStorage.getItem("managerData");
    if (managerData) {
      const parsedData = JSON.parse(managerData);
      const classicLeagues = parsedData?.leagues?.classic || [];
      const leagueName = classicLeagues.find((league: any) => league.id === leagueId)?.name || 'Unknown League'
      setLeagueId(leagueId)
      setId(leagueId)
      setSelectedLeague(leagueName)
    } else {
      setLeagueId(leagueId);
      setId(leagueId)
      switch (leagueId) {
        case "314":
          setSelectedLeague("Overall");
          break;
        case "321":
          setSelectedLeague("Second Chance");
          break;
        case "276":
          setSelectedLeague("Gameweek 1");
          break;
        default:
          setSelectedLeague("Overall");
          break;
      }
    }
  }

  return (
    <div>
      {isLoadingoverallLeagueData ? (
        <StatsCard
          title="Loading Table Data"
          value="..."
          description=""
        />
      ) : (
        <>
          <LeagueTable onManagerSelect={onManagerSelect} leagueData={leagueData.standings.results} hasNext={leagueData.standings.has_next} selectedLeague={selectedLeague} pageNumber={pageNumber} setPageNumber={setPageNumber} updateSelectedLeague={updateSelectedLeague} leagueId={id}/>
          <div className="mt-4 flex justify-between">
            <span>Page: {pageNumber}</span>
            <div className="flex gap-2">
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
    </div>


  );
}