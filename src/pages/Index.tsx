import { GameweekPaginator } from "@/components/GameweekPaginator";
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { VisualizationSection } from "@/components/dashboard/VisualizationSection";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import { SignInModal } from "@/components/SignInModal";
import { Button } from "@/components/ui/button";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { ChipUsageChart } from "@/components/dashboard/ChipUsageChart";

const Index = () => {
  const {
    currentGameweekNumber,
    setCurrentGameweekNumber,
    isSignedIn,
    isSignInModalOpen,
    setIsSignInModalOpen,
    liveGameweekData,
    selectedGameweekData,
    highScorePlayerData,
    highScorePlayerFixture,
    mostCaptPlayerData,
    mostCaptPlayerFixture,
    mostTransferredPlayerData,
    mostTransferredPlayerTeam,
    isGuestSigningIn,
    handleGuestSignIn,
  } = useDashboardData();

  return (
    <div className="space-y-6">
      {isSignedIn ? (
        <WelcomeBanner />
      ) : (
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold tracking-tight">
            FPL 2025 Season at a Glance
          </h2>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => setIsSignInModalOpen(true)}>
              Sign In with FPL ID
            </Button>
            <Button
              variant="secondary"
              onClick={handleGuestSignIn}
              disabled={isGuestSigningIn}
            >
              {isGuestSigningIn ? "Signing in..." : "Try as Guest"}
            </Button>
          </div>
        </div>
      )}

      <SignInModal
        isOpen={isSignInModalOpen}
        onOpenChange={setIsSignInModalOpen}
      />

      <GameweekPaginator
        currentGameweekNumber={currentGameweekNumber}
        setCurrentGameweekNumber={setCurrentGameweekNumber}
        totalGameweeks={38}
        liveGameweekData={liveGameweekData}
      />

      <StatsOverview
        currentGW={selectedGameweekData}
        mostCaptPlayerData={mostCaptPlayerData}
        highScorePlayerData={highScorePlayerData}
        highScorePlayerFixture={highScorePlayerFixture}
        mostCaptPlayerFixture={mostCaptPlayerFixture}
      />

      <VisualizationSection
        selectedGameweekData={selectedGameweekData}
        mostCaptPlayerData={mostCaptPlayerData}
        mostCaptPlayerFixture={mostCaptPlayerFixture}
        mostTransferredPlayerData={mostTransferredPlayerData}
        mostTransferredPlayerTeam={mostTransferredPlayerTeam}
      />

      <ChipUsageChart />
    </div>
  );
};

export default Index;
