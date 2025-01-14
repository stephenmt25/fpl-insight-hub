import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatsCard } from "@/components/StatsCard";
import { GameweekPaginator } from "@/components/GameweekPaginator";
import { PerformanceMetrics } from "@/components/PerformanceMetrics";
import { GameweekAnalysis } from "@/components/GameweekAnalysis";
import { HistoricalTrends } from "@/components/HistoricalTrends";
import { CaptaincyImpact } from "@/components/CaptaincyImpact";
import { ArrowRight } from "lucide-react";
import { LeagueComparison } from "@/components/LeagueComparison";

export default function Performance() {
  const [currentGameweek, setCurrentGameweek] = useState(20);
  const [liveGameweek, setLiveGameweek] = useState(20)
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="space-y-4">
        <h1 className="text-4xl font-bold text-fpl-primary">
          Track your FPL performance in detail!
        </h1>
        <p className="text-xl text-muted-foreground">
          Overall Points: 1,234 | Overall Rank: 100,000
        </p>
        {/* <Button className="bg-fpl-secondary text-fpl-primary hover:bg-fpl-accent">
          Compare League Members
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button> */}
        <Button
          className="bg-fpl-secondary text-fpl-primary hover:bg-fpl-accent"
          onClick={() => setActiveTab("compare")}
        >
          Compare League Members
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </section>

      {/* Gameweek Paginator */}
      <GameweekPaginator
        currentGameweek={currentGameweek}
        setCurrentGameweek={setCurrentGameweek}
        totalGameweeks={38}
        liveGameweek={liveGameweek}
      />

      {/* Performance Metrics */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Gameweek Points"
          value="65"
          description="+15 from average"
        />
        <StatsCard
          title="Total Points"
          value="1,234"
          description="Top 100k overall"
        />
        <StatsCard
          title="Average Points"
          value="50"
          description="vs. 45 top 10k average"
        />
        <StatsCard
          title="Bench Points"
          value="12"
          description="3 players benched"
        />
      </section>

      {/* Tabs Navigation */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="gameweek">Gameweek Analysis</TabsTrigger>
          <TabsTrigger value="historical">Historical Trends</TabsTrigger>
          <TabsTrigger value="captaincy">Captaincy Impact</TabsTrigger>
          <TabsTrigger value="compare">Compare League Members</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <PerformanceMetrics gameweek={currentGameweek} />
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