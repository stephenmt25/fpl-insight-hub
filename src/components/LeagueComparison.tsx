import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LeagueTable } from "@/components/LeagueTable";
import { ComparisonMetrics } from "@/components/ComparisonMetrics"
import { HistoricalComparison } from "@/components/HistoricalComparison";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useContext } from 'react';
import { TabContext } from '../context/standings-tabs-context';
import { useNavigate } from 'react-router-dom';
import { BarChart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { leagueService } from "@/services/fpl-api";
import { StatsCard } from "./StatsCard";

export function LeagueComparison() {
  const [selectedLeague, setSelectedLeague] = useState("Overall");
  const [selectedManager, setSelectedManager] = useState<string | null>(null);
  const navigate = useNavigate();
  const { updateActiveTab } = useContext(TabContext);

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

  const handleClick = (tab: string) => {
    updateActiveTab(tab);
    navigate('/standings');
  };


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
        <h1 className="text-2xl font-semibold text-fpl-primary">
          Compare Your Performance with League Members
        </h1>
        <p className="text-xl text-muted-foreground">
          Analyze your progress and stats against other FPL managers in your league
        </p>
        <div className="w-full max-w-xs">
          <div className="flex items-center pb-2">
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
      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>League Table</CardTitle>
            </CardHeader>
            <CardContent>
              {
                isLoadingoverallLeagueData ?
                  <StatsCard
                    title="Loading Table Data"
                    value="..."
                    description=""
                  /> :
                  <>
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
                    <LeagueTable onManagerSelect={setSelectedManager} leagueData={leagueData.standings.results} />
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

            </CardContent>
          </Card>
          <Button onClick={() => handleClick('insights')} className="w-full" variant="outline">
            View League Insights
          </Button>
        </div>
        <div className="space-y-4">
          <ComparisonMetrics selectedManager={selectedManager} />
          <HistoricalComparison selectedManager={selectedManager} />
        </div>
      </div>
      <div className="flex justify-center gap-4">
        <Button onClick={() => handleClick('table')} variant="outline">Analyze Another League</Button>
        <Button onClick={() => handleClick('trends')} >View Detailed League Trends</Button>
      </div>
    </div>
  );
}