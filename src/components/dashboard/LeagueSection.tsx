import { LeagueTable } from "@/components/LeagueTable";
import { StatsCard } from "@/components/StatsCard";
import { useContext, useState } from "react";
import { LiveGWContext } from "@/context/livegw-context";

interface LeagueSectionProps {
  pageNumber: string;
  setPageNumber: (value: string) => void;
  isLoadingoverallLeagueData: boolean;
  leagueData: any;
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
        <StatsCard title="Loading Table Data" value="..." description="" />
      ) : (
        <>
          <LeagueTable gameweekNumber={liveGameweekData?.id || 1} leagueData={leagueData.standings.results} hasNext={leagueData.standings.has_next} selectedLeague={selectedLeague} pageNumber={pageNumber} setPageNumber={setPageNumber} updateSelectedLeague={updateSelectedLeague} leagueId={id}/>
        </>
      )}
    </div>
  );
}