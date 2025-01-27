import { useContext, useState, useEffect } from "react";
import { GameweekPaginator } from "@/components/GameweekPaginator";
import { PerformanceMetrics } from "@/components/PerformanceMetrics";
import { PlayerPerformanceTable } from "@/components/PlayerPerformanceTable";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { HistoricalTrends } from "@/components/HistoricalTrends";
import { LeagueComparison } from "@/components/LeagueComparison";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import { LiveGWContext } from "@/context/livegw-context";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { managerService } from "@/services/fpl-api";
import { useNavigate } from "react-router-dom";
import { useTeamsContext } from "@/context/teams-context";
import { useIsMobile } from "@/hooks/use-mobile";

const mockPlayers = [
  {
    name: "Mohamed Salah",
    team: "LIV",
    position: "MID",
    points: 12,
    performance: "exceptional" as const,
  },
  {
    name: "Erling Haaland",
    team: "MCI",
    position: "FWD",
    points: 8,
    performance: "average" as const,
  },
  {
    name: "Bukayo Saka",
    team: "ARS",
    position: "MID",
    points: 2,
    performance: "poor" as const,
  },
  {
    name: "Harry Kane",
    team: "TOT",
    position: "FWD",
    points: 10,
    performance: "exceptional" as const,
  },
  {
    name: "Kevin De Bruyne",
    team: "MCI",
    position: "MID",
    points: 7,
    performance: "average" as const,
  },
  {
    name: "Trent Alexander-Arnold",
    team: "LIV",
    position: "DEF",
    points: 6,
    performance: "average" as const,
  },
  {
    name: "Alisson Becker",
    team: "LIV",
    position: "GK",
    points: 3,
    performance: "poor" as const,
  },
  {
    name: "Bruno Fernandes",
    team: "MUN",
    position: "MID",
    points: 14,
    performance: "exceptional" as const,
  },
  {
    name: "Son Heung-min",
    team: "TOT",
    position: "MID",
    points: 11,
    performance: "exceptional" as const,
  },
  {
    name: "Kieran Trippier",
    team: "NEW",
    position: "DEF",
    points: 9,
    performance: "average" as const,
  },
  {
    name: "Nick Pope",
    team: "NEW",
    position: "GK",
    points: 5,
    performance: "average" as const,
  },
];

export default function Performance() {
  const [activeTab, setActiveTab] = useState("overview");
  const { isSignedIn, currentManager } = useAuth();
  const { liveGameweekData } = useContext(LiveGWContext);
  const { data: teams, isLoading: isLoadingTeams } = useTeamsContext();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [currentGameweek, setCurrentGameweek] = useState(liveGameweekData ? liveGameweekData.id : 22);

  // Handle initial loading and navigation
  useEffect(() => {
    if (!isSignedIn) {
      navigate('/');
    }
  }, [isSignedIn, navigate]);

  // Handle initial load state
  useEffect(() => {
    if (!isLoadingTeams && currentManager?.id) {
      setIsInitialLoad(false);
    }
  }, [isLoadingTeams, currentManager]);

  // Wait for all context data to be ready before fetching gameweek picks
  const canFetchData = isSignedIn && currentManager?.id && currentGameweek && !isLoadingTeams && !isInitialLoad;

  const {
    data: gameweekPicks,
    isLoading,
    error,
    isError
  } = useQuery({
    queryKey: ['gameweekPicks', currentManager?.id, currentGameweek],
    queryFn: () =>
      currentManager?.id
        ? managerService.getGameweekTeamPicks(currentManager.id.toString(), currentGameweek.toString())
        : null,
    enabled: canFetchData,
    retry: 1,
    staleTime: 30000,
  });

  // Show loading state while checking auth and context data
  if (!isSignedIn || isLoadingTeams || isInitialLoad) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Loading your performance data...
            </h2>
            <p className="mt-2 text-muted-foreground">
              Please wait while we fetch your information.
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

  // Show error state if data fetching fails
  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-red-600">
              Error loading performance data
            </h2>
            <p className="mt-2 text-muted-foreground">
              Please try refreshing the page. If the problem persists, try signing out and back in.
            </p>
          </div>
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
            <TabsTrigger value="historical">Historical Trends</TabsTrigger>
            <TabsTrigger value="compare">Mini-League Tables</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="overview">
          {/* Gameweek Paginator */}
          <GameweekPaginator
            currentGameweekNumber={currentGameweek}
            setCurrentGameweekNumber={setCurrentGameweek}
            totalGameweeks={38}
            liveGameweekData={liveGameweekData}
          />
          {/* Performance Metrics */}
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
              <PlayerPerformanceTable players={mockPlayers} />
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
