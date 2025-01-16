import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeagueTable } from "@/components/LeagueTable";
import { LeagueInsights } from "@/components/LeagueInsights";
import { LeagueTrends } from "@/components/LeagueTrends";
import { useContext } from 'react';
import { TabContext } from '../context/standings-tabs-context';
import { leagueService } from "@/services/fpl-api";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/StatsCard";

export default function LeagueStandings() {
  const [selectedLeague, setSelectedLeague] = useState("Overall");
  const [id, setId] = useState("314")
  const { activeTab } = useContext(TabContext);
  const overallLeagueId = "314"

  const [leagueId, setLeagueId] = useState(overallLeagueId)
  const [pageNumber, setPageNumber] = useState("1")

  const {
    data: leagueData,
    error: overallLeagueDataError,
    isLoading: isLoadingoverallLeagueData,
  } = useQuery({
    queryKey: ['leagueData', leagueId, pageNumber],
    queryFn: () => leagueService.getStandings(leagueId, pageNumber),
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
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold text-fpl-primary">League Standings</h1>
        <p className="text-xl text-muted-foreground">
          Track and analyze your mini-league performance
        </p>

      </div>
      <Tabs defaultValue={activeTab} className="w-full">
        <div className="w-full overflow-x-auto no-scrollbar">
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
                <LeagueTable leagueData={leagueData.standings.results} hasNext={leagueData.standings.has_next} selectedLeague={selectedLeague} pageNumber={pageNumber} setPageNumber={setPageNumber} updateSelectedLeague={updateSelectedLeague} leagueId={id}/>
                <div className="mt-4 flex justify-between">
                  <span>Page: {pageNumber}</span>
                  <div className="gap-2 flex">
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