import { LeagueTable } from "@/components/LeagueTable";
import { StatsCard } from "@/components/StatsCard";
import { useContext, useState } from "react";
import { LiveGWContext } from "@/context/livegw-context";
import { resolveLeagueName } from "@/utils/league-utils";
import { LeagueDetails } from "@/types/fpl";

interface LeagueTableSectionProps {
  isLoadingoverallLeagueData: boolean;
  leagueData: LeagueDetails;
  pageNumber: string;
  setPageNumber: (value: string) => void;
  onManagerSelect: (manager: { id: number; name: string }) => void;
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

  const { liveGameweekData } = useContext(LiveGWContext)

  const [selectedLeague, setSelectedLeague] = useState("Overall");
  const [id, setId] = useState("314")

  const updateSelectedLeague = (leagueId: string) => {
    setLeagueId(leagueId);
    setId(leagueId);
    setSelectedLeague(resolveLeagueName(leagueId));
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
          <LeagueTable gameweekNumber={liveGameweekData?.id || 1} onManagerSelect={onManagerSelect} leagueData={leagueData.standings.results} hasNext={leagueData.standings.has_next} selectedLeague={selectedLeague} pageNumber={pageNumber} setPageNumber={setPageNumber} updateSelectedLeague={updateSelectedLeague} leagueId={id}/>
        </>
      )}
    </div>


  );
}