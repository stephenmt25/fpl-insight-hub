import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatsCard } from "@/components/StatsCard";
import { GameweekPaginator } from "@/components/GameweekPaginator";
import { PerformanceMetrics } from "@/components/PerformanceMetrics";
import { GameweekAnalysis } from "@/components/GameweekAnalysis";
import { HistoricalTrends } from "@/components/HistoricalTrends";
import { CaptaincyImpact } from "@/components/CaptaincyImpact";
import { LeagueComparison } from "@/components/LeagueComparison";
import { ArrowRight } from "lucide-react";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

export default function Performance() {
  const [currentGameweek, setCurrentGameweek] = useState(20);
  const [liveGameweek, setLiveGameweek] = useState(20)
  const [activeTab, setActiveTab] = useState("overview");
  const { isSignedIn, currentManager } = useAuth();

  return (
    <div className="space-y-1">
      {/* Hero Section */}
      <section className="space-y-4">
        <WelcomeBanner />
      </section>
      <br />
      {/* Tabs Navigation */}
      {!isSignedIn && 
        <Card className="h-screen">
        <CardHeader>
          <CardDescription>
            
          </CardDescription>
        </CardHeader>
        <CardContent>

        </CardContent>
      </Card>
      }
      {isSignedIn &&
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
            liveGameweek={liveGameweek}
          />


          <TabsContent value="overview">

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
            <br/>
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
      }
    </div>
  );
}