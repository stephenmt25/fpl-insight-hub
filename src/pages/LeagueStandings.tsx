import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeagueTable } from "@/components/LeagueTable";
import { LeagueInsights } from "@/components/LeagueInsights";
import { LeagueTrends } from "@/components/LeagueTrends";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useContext } from 'react';
import { TabContext } from '../context/standings-tabs-context';
import { BarChart } from "lucide-react";
import { leagueService } from "@/services/fpl-api";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/StatsCard";

export default function LeagueStandings() {
  const [selectedLeague, setSelectedLeague] = useState("Overall");
  const { activeTab } = useContext(TabContext);
  const overallLeagueId = "314"
  const secondChanceLeagueId = "321"
  const gameweek1LeagueId = "276"

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

  const updateSelectedLeague = (leagueName: string) => {
    setSelectedLeague(leagueName);
    switch (leagueName) {
      case "Overall":
        setLeagueId(overallLeagueId);
        break;
      case "Second Chance":
        setLeagueId(secondChanceLeagueId);
        break;
      case "Gameweek 1":
        setLeagueId(gameweek1LeagueId);
        break;
      default:
        setLeagueId(overallLeagueId);
        break;
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold text-fpl-primary">League Standings</h1>
        <p className="text-xl text-muted-foreground">
          Track and analyze your mini-league performance
        </p>
        <div className="w-full max-w-xs">
          <div className="flex items-center  pb-2">
            <BarChart className="h-4 w-4" />
            <label className="text-sm font-medium">League Select</label>
          </div>
          <Select value={selectedLeague} onValueChange={(value) => updateSelectedLeague(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a league" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Overall">Overall</SelectItem>
              <SelectItem value="Second Chance">Second Chance</SelectItem>
              <SelectItem value="Gameweek 1">Gameweek 1</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Tabs defaultValue={activeTab} className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="table">League Table</TabsTrigger>
          <TabsTrigger value="insights">League Insights</TabsTrigger>
          <TabsTrigger value="trends">Detailed Trends</TabsTrigger>
        </TabsList>
        <TabsContent value="table">
          <div className="p-2 flex justify-between items-center">
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
          {
            isLoadingoverallLeagueData ?
              <StatsCard
                title="Loading Table Data"
                value="..."
                description=""
              /> :
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