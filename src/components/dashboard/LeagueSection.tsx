import { LeagueTable } from "@/components/LeagueTable";
import { StatsCard } from "@/components/StatsCard";
import { useContext, useState } from "react";
import { LiveGWContext } from "@/context/livegw-context";
import { resolveLeagueName } from "@/utils/league-utils";
import { LeagueDetails } from "@/types/fpl";

interface LeagueSectionProps {
  pageNumber: string;
  setPageNumber: (value: string) => void;
  isLoadingoverallLeagueData: boolean;
  leagueData: LeagueDetails;
  setLeagueId: (id: string) => void;
}

export function LeagueSection({
  pageNumber,
  setPageNumber,
  isLoadingoverallLeagueData,
  leagueData,
  setLeagueId
}: LeagueSectionProps) {
  
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
  const { liveGameweekData } = useContext(LiveGWContext)
  const updateSelectedLeague = (leagueId: string) => {
    setLeagueId(leagueId);
    setId(leagueId);
    setSelectedLeague(resolveLeagueName(leagueId));
  }

  return (
    <div>
      {isLoadingoverallLeagueData ? (
        <StatsCard title="Loading Table Data" value="..." description="" />
      ) : (
        <>
          <LeagueTable gameweekNumber={liveGameweekData?.id || 1} leagueData={leagueData.standings.results} hasNext={leagueData.standings.has_next} selectedLeague={selectedLeague} pageNumber={pageNumber} setPageNumber={setPageNumber} updateSelectedLeague={updateSelectedLeague} leagueId={id}/>
        </>
      )}
    </div>
  );
}