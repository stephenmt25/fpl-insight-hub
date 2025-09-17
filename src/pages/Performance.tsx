import { useState, useEffect } from "react";
import { GameweekPaginator } from "@/components/GameweekPaginator";
import { PerformanceMetrics } from "@/components/PerformanceMetrics";
import { PlayerPerformanceTable } from "@/components/PlayerPerformanceTable";
import { useAuth } from "@/context/auth-context";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";

import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { managerService, playerService } from "@/services/fpl-api";
import { supabase } from "@/integrations/supabase/client";
import { useTeamsContext } from "@/context/teams-context";
import { HistoricalTrends } from "@/components/HistoricalTrends";
import { LeagueComparison } from "@/components/LeagueComparison";
import { ArrowRightLeft, ArrowUp10, ChartNoAxesCombined, TrendingUpDown } from "lucide-react";
import { TransfersTab } from "@/components/TransfersTab";

interface GameweekTransfers {
  gameweek: number;
  transferCount: number;
  transferCost: number;
  totalImpact: number;
}


export default function Performance() {
  const [activeTab, setActiveTab] = useState("overview");
  const { isSignedIn, currentManager } = useAuth();
  
  const [currentGameweek, setCurrentGameweek] = useState<number | null>(null);
  const { data: teams } = useTeamsContext();
  const [selectedGWTransfers, setSelectedGWTransfers] = useState<number | null>(null);

  // Fetch gameweek picks
  const { data: gameweekPicks, isLoading, error } = useQuery({
    queryKey: ['gameweekPicks', currentManager?.id, currentGameweek],
    queryFn: () => currentManager?.id
      ? managerService.getGameweekTeamPicks(currentManager.id.toString(), currentGameweek.toString())
      : null,
    enabled: !!currentManager?.id && !!currentGameweek,
  });

  // Fetch overall FPL data to determine current gameweek
  const { data: overallFplData, isLoading: isLoadingOverallFplData } = useQuery({
    queryKey: ['overallFplData'],
    queryFn: async () => {
      const { data, error } = await supabase.from('fploveralldata').select('*');
      if (error) throw error;
      return data;
    }
  });

  // Get the current live gameweek data
  const liveGameweekData = overallFplData?.find(gw => gw.is_current === "true");

  // Fetch all players data
  const { data: allPlayers } = useQuery({
    queryKey: ['allPlayers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('plplayerdata').select('*');
      if (error) throw error;
      return data;
    }
  });

  // Set current gameweek when data loads
  useEffect(() => {
    if (!isLoadingOverallFplData && overallFplData) {
      const currentGW = overallFplData.find(gw => gw.is_current === "true");
      if (currentGW && !currentGameweek) {
        setCurrentGameweek(currentGW.id);
      }
    }
  }, [isLoadingOverallFplData, overallFplData, currentGameweek]);

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

  const { data: managerTransfers } = useQuery({
    queryKey: ['managerTransfers', currentManager?.id],
    queryFn: () =>
      currentManager?.id ?
        managerService.getTransfers(currentManager.id.toString()) :
        null,
    enabled: !!currentManager?.id,
  });

  // Process transfers data
  const gameweekTransfers = managerTransfers?.reduce((acc, transfer) => {
    const existing = acc.find(item => item.gameweek === transfer.event);
    if (existing) {
      existing.transferCount++;
      existing.transferCost += transfer.entry;
    } else {
      acc.push({
        gameweek: transfer.event,
        transferCount: 1,
        transferCost: transfer.entry,
        totalImpact: 0 // Will need to calculate this
      });
    }
    return acc;
  }, [] as GameweekTransfers[]) || [];

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
    <div className="space-y-4 pb-14 md:pb-0">
      {/* Hero Section */}
      <section className="space-y-4">
        <WelcomeBanner />
      </section>
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t md:hidden">
          <TabsList className="w-full h-18 rounded-none bg-gray-900 justify-around">
            <TabsTrigger value="overview" className="w-full h-full flex-col"><ChartNoAxesCombined />Stats</TabsTrigger>
            <TabsTrigger value="historical" className="w-full h-full flex-col"><TrendingUpDown />Trends</TabsTrigger>
            <TabsTrigger value="transfers" className="w-full h-full flex-col"><ArrowRightLeft />Transfers</TabsTrigger>
            <TabsTrigger value="compare" className="w-full h-full flex-col"><ArrowUp10 />Standings</TabsTrigger>
          </TabsList>
        </div>

        <div className="hidden md:block w-full overflow-x-auto no-scrollbar">
          <TabsList className="w-full justify-start inline-flex min-w-max">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="historical">Historical Trends</TabsTrigger>
            <TabsTrigger value="transfers">Transfers</TabsTrigger>
            <TabsTrigger value="compare">Mini-League Tables</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="overview" className="space-y-4">
          {currentGameweek ? (
            <GameweekPaginator
              currentGameweekNumber={currentGameweek}
              setCurrentGameweekNumber={setCurrentGameweek}
              totalGameweeks={38}
              liveGameweekData={liveGameweekData}
            />
          ) : (
            <Skeleton className="h-12 w-full" />
          )}

          <div className="grid  grid-cols-1 lg:grid-cols-2 gap-2">
            <PerformanceMetrics
              gameweek={currentGameweek}
              gameweekPicks={gameweekPicks}
              isLoading={isLoading}
              error={error}
            />
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
        <TabsContent value="transfers">
          <TransfersTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
