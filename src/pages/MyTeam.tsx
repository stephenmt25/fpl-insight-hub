import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { SignInModal } from "@/components/SignInModal";
import { useState } from "react";
import { Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyTeamData } from "@/hooks/use-my-team-data";
import { SquadPitchView } from "@/components/my-team/SquadPitchView";
import { CaptainOptimizer } from "@/components/my-team/CaptainOptimizer";
import { ChipPlanner } from "@/components/my-team/ChipPlanner";
import { PerformanceMetrics } from "@/components/PerformanceMetrics";
import { TransfersTab } from "@/components/TransfersTab";
import { HistoricalTrends } from "@/components/HistoricalTrends";
import { GameweekPaginator } from "@/components/GameweekPaginator";

export default function MyTeam() {
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const {
    isSignedIn,
    currentGameweek,
    setCurrentGameweek,
    isLoadingPicks,
    starting11,
    bench,
    formation,
    totalPoints,
    activeChip,
    automaticSubs,
    picks,
    chips,
    events,
    currentManager,
    managerHistory,
    liveGameweekData,
  } = useMyTeamData();

  if (!isSignedIn) {
    return (
      <div className="space-y-6 text-center py-12">
        <Users className="h-16 w-16 mx-auto text-muted-foreground" />
        <h2 className="text-2xl font-bold">Sign in to view your team</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Enter your FPL ID to see your squad, captain recommendations, chip planner, and transfer analysis.
        </p>
        <Button onClick={() => setIsSignInModalOpen(true)}>Sign In with FPL ID</Button>
        <SignInModal isOpen={isSignInModalOpen} onOpenChange={setIsSignInModalOpen} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="squad" className="space-y-4">
        <div className="w-full overflow-x-auto no-scrollbar">
          <TabsList className="w-full justify-start inline-flex min-w-max">
            <TabsTrigger value="squad">Squad</TabsTrigger>
            <TabsTrigger value="captain">Captain</TabsTrigger>
            <TabsTrigger value="chips">Chips</TabsTrigger>
            <TabsTrigger value="transfers">Transfers</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="squad" className="space-y-4">
          {currentGameweek && (
            <GameweekPaginator
              currentGameweekNumber={currentGameweek}
              setCurrentGameweekNumber={setCurrentGameweek}
              totalGameweeks={38}
              liveGameweekData={liveGameweekData}
            />
          )}

          {isLoadingPicks ? (
            <Skeleton className="h-[400px] w-full rounded-xl" />
          ) : starting11.length > 0 ? (
            <SquadPitchView
              starting11={starting11}
              bench={bench}
              formation={formation}
              totalPoints={totalPoints}
              activeChip={activeChip}
              automaticSubs={automaticSubs}
            />
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No squad data available for this gameweek.
            </div>
          )}

          {currentGameweek && picks && (
            <PerformanceMetrics
              gameweek={currentGameweek}
              gameweekPicks={picks}
              isLoading={isLoadingPicks}
              error={null}
            />
          )}
        </TabsContent>

        <TabsContent value="captain">
          {starting11.length > 0 ? (
            <CaptainOptimizer starting11={starting11} />
          ) : (
            <Skeleton className="h-[300px] w-full" />
          )}
        </TabsContent>

        <TabsContent value="chips">
          <ChipPlanner
            chips={chips}
            events={events}
            currentGameweek={currentGameweek}
            managerHistory={managerHistory}
          />
        </TabsContent>

        <TabsContent value="transfers">
          <TransfersTab />
        </TabsContent>

        <TabsContent value="trends">
          <HistoricalTrends />
        </TabsContent>
      </Tabs>
    </div>
  );
}
