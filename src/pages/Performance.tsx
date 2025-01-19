import { useContext, useState } from "react";
import { GameweekPaginator } from "@/components/GameweekPaginator";
import { PerformanceMetrics } from "@/components/PerformanceMetrics";
import { PlayerPerformanceTable } from "@/components/PlayerPerformanceTable";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { CaptaincyImpact } from "@/components/CaptaincyImpact";
import { GameweekAnalysis } from "@/components/GameweekAnalysis";
import { HistoricalTrends } from "@/components/HistoricalTrends";
import { LeagueComparison } from "@/components/LeagueComparison";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import { StatsCard } from "@/components/StatsCard";
import { LiveGWContext } from "@/context/livegw-context";

// Mock data for the player performance table
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
  const { isSignedIn } = useAuth();
  const { liveGameweekData } = useContext(LiveGWContext)
  const [currentGameweek, setCurrentGameweek] = useState<number | null>(liveGameweekData.id);

  if (!isSignedIn) {
    return (
      <Card className="h-screen">
        <CardHeader>
          <CardDescription>
            Please sign in to view performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent></CardContent>
      </Card>
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
            <TabsTrigger value="gameweek">Gameweek Analysis</TabsTrigger>
            <TabsTrigger value="historical">Historical Trends</TabsTrigger>
            <TabsTrigger value="captaincy">Captaincy Impact</TabsTrigger>
            <TabsTrigger value="compare">Compare League Members</TabsTrigger>
          </TabsList>
        </div>
        {/* Gameweek Paginator */}
        <GameweekPaginator
          currentGameweek={currentGameweek}
          setCurrentGameweek={setCurrentGameweek}
          totalGameweeks={38}
          liveGameweek={liveGameweekData}
        />
        <TabsContent value="overview">
          {/* Performance Metrics */}
          <div className="grid grid-cols-2 gap-4 p-2">
            <div className="">
              <PerformanceMetrics gameweek={currentGameweek} />
            </div>
            <div className="space-y-4">
              <div className="text-start space-y-2">
                <h2 className="text-2xl font-bold">Player Performance</h2>
                <p className="text-muted-foreground">Gameweek Performance</p>
              </div>
              <PlayerPerformanceTable players={mockPlayers} />
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