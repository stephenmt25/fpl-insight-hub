import { useContext, useState } from "react";
import { GameweekPaginator } from "@/components/GameweekPaginator";
import { PerformanceMetrics } from "@/components/PerformanceMetrics";
import { PlayerPerformanceTable } from "@/components/PlayerPerformanceTable";
import { useAuth } from "@/context/auth-context";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import { LiveGWContext } from "@/context/livegw-context";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { managerService, playerService } from "@/services/fpl-api";
import { supabase } from "@/integrations/supabase/client";
import { useTeamsContext } from "@/context/teams-context";
import { HistoricalTrends } from "@/components/HistoricalTrends";
import { LeagueComparison } from "@/components/LeagueComparison";


export default function Performance() {
  const [activeTab, setActiveTab] = useState("overview");
  const { isSignedIn, currentManager } = useAuth();
  const { liveGameweekData } = useContext(LiveGWContext)
  const [currentGameweek, setCurrentGameweek] = useState(liveGameweekData ? liveGameweekData.id : 22);
  const { data: teams } = useTeamsContext();

  // Fetch gameweek picks
  const { data: gameweekPicks, isLoading, error } = useQuery({
    queryKey: ['gameweekPicks', currentManager?.id, currentGameweek],
    queryFn: () => currentManager?.id
      ? managerService.getGameweekTeamPicks(currentManager.id.toString(), currentGameweek.toString())
      : null,
    enabled: !!currentManager?.id && !!currentGameweek,
  });

  // Fetch all players data
  const { data: allPlayers } = useQuery({
    queryKey: ['allPlayers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('plplayerdata').select('*');
      if (error) throw error;
      return data;
    }
  });

  // Fetch gameweek player stats
  const { data: gameweekPlayerStats } = useQuery({
    queryKey: ['gameweekPlayerStats', currentGameweek],
    queryFn: () => playerService.getGameweekPlayerStats(currentGameweek.toString()),
    enabled: !!currentGameweek,
  });

  // Process live data for the table
  const getPosition = (elementType: number) => {
    switch (elementType) {
      case 1: return 'GK';
      case 2: return 'DEF';
      case 3: return 'MID';
      case 4: return 'FWD';
      default: return '';
    }
  };

  const realPlayers = gameweekPicks?.picks
    ?.filter(pick => pick.position <= 11) // Starting 11 only
    .map(pick => {
      const player = allPlayers?.find(p => p.id === pick.element);
      const team = teams?.find(t => t.id === player?.team);
      const playerStats = gameweekPlayerStats?.elements?.find((e: any) => e.id === pick.element);
      const points = playerStats?.stats?.total_points || 0;

      let performance: 'exceptional' | 'average' | 'poor' = 'average';
      if (points >= 6) performance = 'exceptional';
      else if (points < 5) performance = 'poor';

      return {
        name: player?.web_name || 'Unknown',
        team: team?.short_name || '',
        position: player ? getPosition(player.element_type) : '',
        points,
        performance,
      };
    }) || [];

  if (!isSignedIn) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Sign in with your FPL ID to see your performance analytics.
            </h2>
            <p className="mt-2 text-muted-foreground">
              Track your progress and make informed decisions for your team.
            </p>
          </div>
        </div>
        <Skeleton className="h-[200px] w-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <section className="space-y-4">
        <WelcomeBanner />
      </section>
      <br />
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <div className="w-full overflow-x-auto no-scrollbar">
          <TabsList className="w-full justify-start inline-flex min-w-max">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            {/* <TabsTrigger value="gameweek">Gameweek Analysis</TabsTrigger> */}
            <TabsTrigger value="historical">Historical Trends</TabsTrigger>
            {/* <TabsTrigger value="captaincy">Captaincy Impact</TabsTrigger> */}
            <TabsTrigger value="compare">Mini-League Tables</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="overview">
          <GameweekPaginator
            currentGameweekNumber={currentGameweek}
            setCurrentGameweekNumber={setCurrentGameweek}
            totalGameweeks={38}
            liveGameweekData={liveGameweekData}
          />

          <div className="grid lg:grid-cols-2 gap-4 p-2">
            <div className="">
              <PerformanceMetrics
                gameweek={currentGameweek}
                gameweekPicks={gameweekPicks}
                isLoading={isLoading}
                error={error}
              />
            </div>
            <div className="space-y-4">
              <div className="text-start space-y-2">
                <p className="text-muted-foreground">Player Stats</p>
              </div>
              {isLoading || !allPlayers || !teams ? (
                <Skeleton className="h-[400px] w-full" />
              ) : (
                <PlayerPerformanceTable players={realPlayers} />
              )}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="historical">
          <HistoricalTrends />
        </TabsContent>
        <TabsContent value="compare">
          <LeagueComparison />
        </TabsContent>
      </Tabs>
    </div>
  );
}