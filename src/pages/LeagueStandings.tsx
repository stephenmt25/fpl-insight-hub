import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeagueTable } from "@/components/LeagueTable";
import { LeagueInsights } from "@/components/LeagueInsights";
import { LeagueTrends } from "@/components/LeagueTrends";
import { LeagueComparison } from "@/components/LeagueComparison";
import { useContext } from 'react';
import { useSearchParams } from "react-router-dom";
import { leagueService } from "@/services/fpl-api";
import { useQuery } from "@tanstack/react-query";
import { StatsCard } from "@/components/StatsCard";
import { LiveGWContext } from "@/context/livegw-context";
import { resolveLeagueName } from "@/utils/league-utils";

export default function LeagueStandings() {
  const [selectedLeague, setSelectedLeague] = useState("Overall");
  const [id, setId] = useState("314")
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "table";
  const overallLeagueId = "314"
  const { liveGameweekData } = useContext(LiveGWContext)
  const [leagueId, setLeagueId] = useState(overallLeagueId)
  const [pageNumber, setPageNumber] = useState("1")

  const {
    data: leagueData,
    error: _overallLeagueDataError,
    isLoading: isLoadingoverallLeagueData,
  } = useQuery({
    queryKey: ['leagueData', leagueId],
    queryFn: () => leagueService.getStandings(leagueId),
  });

  const updateSelectedLeague = (leagueId: string) => {
    setLeagueId(leagueId);
    setId(leagueId);
    setSelectedLeague(resolveLeagueName(leagueId));
  }

  return (
    <div className="space-y-4">
      <h1 className="text-4xl font-bold text-center">League Performances</h1>
      <Tabs defaultValue={activeTab} className="space-y-4">
        <div className="w-full overflow-x-auto no-scrollbar">
          <TabsList className="w-full justify-start inline-flex min-w-max">
            <TabsTrigger value="table">Standings</TabsTrigger>
            <TabsTrigger value="compare">Compare</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
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
                <LeagueTable gameweekNumber={liveGameweekData?.id || 1} leagueData={leagueData.standings.results} hasNext={leagueData.standings.has_next} selectedLeague={selectedLeague} pageNumber={pageNumber} setPageNumber={setPageNumber} updateSelectedLeague={updateSelectedLeague} leagueId={id} />
              </>
          }

        </TabsContent>
        <TabsContent value="compare">
          <LeagueComparison />
        </TabsContent>
        <TabsContent value="insights">
          <LeagueInsights selectedLeague={selectedLeague} leagueId={leagueId} />
        </TabsContent>
        <TabsContent value="trends">
          <LeagueTrends selectedLeague={selectedLeague} leagueId={leagueId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}