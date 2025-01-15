import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ComparisonMetrics } from "@/components/ComparisonMetrics"
import { HistoricalComparison } from "@/components/HistoricalComparison";
import { useContext } from 'react';
import { TabContext } from '../context/standings-tabs-context';
import { useNavigate } from 'react-router-dom';
import { useQuery } from "@tanstack/react-query";
import { leagueService } from "@/services/fpl-api";
import { LeagueSelector } from "./league-comparison/LeagueSelector";
import { LeagueTableSection } from "./league-comparison/LeagueTableSection";

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
        <LeagueSelector
          selectedLeague={selectedLeague}
          updateSelectedLeague={updateSelectedLeague}
        />
      </div>
      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <LeagueTableSection
            isLoadingoverallLeagueData={isLoadingoverallLeagueData}
            leagueData={leagueData}
            selectedLeague={selectedLeague}
            pageNumber={pageNumber}
            setPageNumber={setPageNumber}
            onManagerSelect={setSelectedManager}
          />
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