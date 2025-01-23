import { useContext, useState } from "react";
import { GameweekPaginator } from "@/components/GameweekPaginator";
import { PerformanceMetrics } from "@/components/PerformanceMetrics";
import { PlayerPerformanceTable } from "@/components/PlayerPerformanceTable";
import { useAuth } from "@/context/auth-context";
import { Card } from "@/components/ui/card";
import { CaptaincyImpact } from "@/components/CaptaincyImpact";
import { GameweekAnalysis } from "@/components/GameweekAnalysis";
import { HistoricalTrends } from "@/components/HistoricalTrends";
import { LeagueComparison } from "@/components/LeagueComparison";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import { LiveGWContext } from "@/context/livegw-context";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { managerService } from "@/services/fpl-api";

export default function Performance() {
  const [activeTab, setActiveTab] = useState("overview");
  const { isSignedIn, currentManager, updateGameweekPicks } = useAuth();
  const { liveGameweekData } = useContext(LiveGWContext);
  const [currentGameweek, setCurrentGameweek] = useState(
    liveGameweekData ? liveGameweekData.id : 22
  );

  const {
    data: gameweekPicks,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["gameweekPicks", currentManager?.id, currentGameweek],
    queryFn: () =>
      currentManager?.id
        ? managerService.getGameweekTeamPicks(
            currentManager.id.toString(),
            currentGameweek.toString()
          )
        : null,
    enabled: !!currentManager?.id && !!currentGameweek,
    onSuccess: (data) => {
      if (data) {
        updateGameweekPicks(data);
      }
    },
  });

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
      <section className="space-y-4">
        <WelcomeBanner />
      </section>
      <br />
      <Tabs
        defaultValue="overview"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full space-y-4"
      >
        <div className="w-full overflow-x-auto no-scrollbar">
          <TabsList className="w-full justify-start inline-flex min-w-max">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="gameweek">Gameweek Analysis</TabsTrigger>
            <TabsTrigger value="historical">Historical Trends</TabsTrigger>
            <TabsTrigger value="captaincy">Captaincy Impact</TabsTrigger>
            <TabsTrigger value="compare">Compare League Members</TabsTrigger>
          </TabsList>
        </div>
        <GameweekPaginator
          currentGameweekNumber={currentGameweek}
          setCurrentGameweekNumber={setCurrentGameweek}
          totalGameweeks={38}
          liveGameweekData={liveGameweekData}
        />
        <TabsContent value="overview">
          <div className="grid lg:grid-cols-2 gap-4 p-2">
            <div>
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
              <PlayerPerformanceTable players={[]} />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="gameweek">
          <GameweekAnalysis gameweek={currentGameweek} />
        </TabsContent>
        <TabsContent value="historical">
          <HistoricalTrends />
        </TabsContent>
        <TabsContent value="captaincy">
          <CaptaincyImpact gameweek={currentGameweek} />
        </TabsContent>
        <TabsContent value="compare">
          <LeagueComparison />
        </TabsContent>
      </Tabs>
    </div>
  );
}