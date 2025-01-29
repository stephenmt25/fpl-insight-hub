import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeagueTable } from "@/components/LeagueTable";
import { LeagueInsights } from "@/components/LeagueInsights";
import { LeagueTrends } from "@/components/LeagueTrends";
import { useContext } from 'react';
import { TabContext } from '../context/standings-tabs-context';
import { leagueService } from "@/services/fpl-api";
import { useQuery } from "@tanstack/react-query";
import { StatsCard } from "@/components/StatsCard";
import { LiveGWContext } from "@/context/livegw-context";
import { ArrowUp10, ChartNoAxesCombined, TrendingUpDown } from "lucide-react";

export default function LeagueStandings() {
  const [selectedLeague, setSelectedLeague] = useState("Overall");
  const [id, setId] = useState("314")
  const { activeTab } = useContext(TabContext);
  const overallLeagueId = "314"
  const { liveGameweekData } = useContext(LiveGWContext)
  const [leagueId, setLeagueId] = useState(overallLeagueId)
  const [pageNumber, setPageNumber] = useState("1")

  const {
    data: leagueData,
    error: overallLeagueDataError,
    isLoading: isLoadingoverallLeagueData,
  } = useQuery({
    queryKey: ['leagueData', leagueId],
    queryFn: () => leagueService.getStandings(leagueId),
  });

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
    <div className="space-y-4 pb-14 md:pb-0">
      <h1 className="text-4xl font-bold text-center">League Performances</h1>
      <Tabs defaultValue={activeTab} className="space-y-4">
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t md:hidden">
          <TabsList className="w-full h-18 rounded-none bg-gray-900 justify-around">
            <TabsTrigger value="table" className="w-full h-full flex-col"><ArrowUp10 /><p>Standings</p></TabsTrigger>
            <TabsTrigger value="insights" className="w-full h-full flex-col"><ChartNoAxesCombined />Stats</TabsTrigger>
            <TabsTrigger value="trends" className="w-full h-full flex-col"><TrendingUpDown />Trends</TabsTrigger>
          </TabsList>
        </div>
        <div className="hidden md:block w-full overflow-x-auto no-scrollbar">
          <TabsList className="w-full justify-start inline-flex min-w-max">
            <TabsTrigger value="table">League Table</TabsTrigger>
            <TabsTrigger value="insights">League Insights</TabsTrigger>
            <TabsTrigger value="trends">Detailed Trends</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="table">

          {
            isLoadingoverallLeagueData ?
              <StatsCard
                title="Loading Table Data"
                value="..."
                description=""
              /> :
              <>
                <LeagueTable gameweekNumber={liveGameweekData.id} leagueData={leagueData.standings.results} hasNext={leagueData.standings.has_next} selectedLeague={selectedLeague} pageNumber={pageNumber} setPageNumber={setPageNumber} updateSelectedLeague={updateSelectedLeague} leagueId={id} />
              </>
          }

        </TabsContent>
        <TabsContent value="insights">
          <LeagueInsights selectedLeague={selectedLeague} />
        </TabsContent>
        <TabsContent value="trends">
          <LeagueTrends selectedLeague={selectedLeague} />
        </TabsContent>
      </Tabs>
    </div>
  );
}