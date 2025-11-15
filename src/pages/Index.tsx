import { useState, useEffect, useContext } from "react";
import { GameweekPaginator } from "@/components/GameweekPaginator";
import { useAuth } from "@/context/auth-context";
import { leagueService, playerService, managerService } from "@/services/fpl-api";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { LeagueSection } from "@/components/dashboard/LeagueSection";
import { VisualizationSection } from "@/components/dashboard/VisualizationSection";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LiveGWContext } from "@/context/livegw-context";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import { useTeamsContext } from "@/context/teams-context";
import { ArrowUp10, ChartNoAxesCombined } from "lucide-react";
import { SignInModal } from "@/components/SignInModal";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Index = () => {
  const [currentGameweekNumber, setCurrentGameweekNumber] = useState<number | null>(null);
  const { isSignedIn, signIn } = useAuth();
  const [pageNumber, setPageNumber] = useState("1");
  const { updateLiveGWData, eventStatus, updateOverallData } = useContext(LiveGWContext);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const overallLeagueId = "314";
  const [leagueId, setLeagueId] = useState(overallLeagueId);
  const [liveGWStats, setLiveGWStats] = useState([]);
  const [highScorePlayerData, setHighScorePlayerData] = useState<any | null>(null);
  const [highScorePlayerTeam, setHighScorePlayerTeam] = useState<any | null>(null);
  const [highScorePlayerOpp, setHighScorePlayerOpp] = useState<any | null>(null);
  const [mostCaptPlayerData, setMostCaptPlayerData] = useState<any | null>([{ status: "loading" }]);
  const [mostCaptPlayerTeam, setMostCaptPlayerTeam] = useState<any | null>(null);
  const [mostCaptPlayerOpp, setMostCaptPlayerOpp] = useState<any | null>(null);
  const [mostTransferredPlayerData, setMostTransferredPlayerData] = useState<any | null>(null);
  const [mostTransferredPlayerTeam, setMostTransferredPlayerTeam] = useState<any | null>(null);
  const { data: teams } = useTeamsContext();

  const {
    data: leagueData,
    error: overallLeagueDataError,
    isLoading: isLoadingoverallLeagueData,
  } = useQuery({
    queryKey: ['leagueData', leagueId],
    queryFn: () => leagueService.getStandings(leagueId),
  });

  const {
    data: overallFplData,
    error: overallFplDataError,
    isLoading: isLoadingOverallFplData,
  } = useQuery({
    queryKey: ['overallFplData'],
    queryFn: async () => {
      const { data, error } = await supabase.from('fploveralldata').select();
      if (error) throw error;
      return data;
    },
  });

  // Add loading state for guest sign-in
  const [isGuestSigningIn, setIsGuestSigningIn] = useState(false);

  // Function to handle guest sign-in
  const handleGuestSignIn = async () => {
    const guestFplId = "7788626"; // The provided FPL ID
    
    setIsGuestSigningIn(true);
    try {
      const managerData = await managerService.getInfo(guestFplId);
      
      if (!managerData) {
        toast.error("Unable to fetch guest manager data. Please try again.");
        return;
      }

      // Store FPL ID in localStorage
      localStorage.setItem('fplId', guestFplId);
      signIn(guestFplId, managerData);
      
      toast.success("You're now signed in as a guest!");
    } catch (error) {
      console.error("Error during guest sign-in:", error);
      toast.error("Error signing in as guest. Please try again later.");
    } finally {
      setIsGuestSigningIn(false);
    }
  };

  useEffect(() => {
    if (!isLoadingOverallFplData && overallFplData) {
      updateOverallData(overallFplData);
      // Find the current gameweek and set it
      const currentGW = overallFplData.find(gw => gw.is_current === "true");
      if (currentGW) {
        setCurrentGameweekNumber(currentGW.id);
      }
    }
  }, [isLoadingOverallFplData, overallFplData]);

  const previousGWData = overallFplData?.filter((gw) => gw.is_previous === "true")[0];
  const liveGameweekData = overallFplData?.filter((gw) => gw.is_current === "true")[0] || null;

  useEffect(() => {
    const fetchGameweekStats = async (gameweekData: any) => {
      if (!gameweekData || typeof gameweekData.id === 'undefined') {
        console.log('No valid gameweek data available');
        return;
      }

      try {
        console.log('Fetching stats for gameweek:', gameweekData.id);
        const stats = await playerService.getGameweekPlayerStats(gameweekData.id.toString());
        if (stats?.elements) {
          setLiveGWStats(stats.elements);
        }
      } catch (error) {
        console.error('Error fetching gameweek stats:', error);
      }
    };

    if (liveGameweekData) {
      updateLiveGWData(liveGameweekData);
      fetchGameweekStats(liveGameweekData);
    } else if (previousGWData) {
      updateLiveGWData(previousGWData);
      fetchGameweekStats(previousGWData);
    }
  }, [liveGameweekData, previousGWData]);

  const [selectedGameweekData, setSelectedGameweekData] = useState(liveGameweekData);

  useEffect(() => {
    const getGameweekData = async () => {
      if (currentGameweekNumber) {
        const { data } = await supabase
          .from('fploveralldata')
          .select()
          .eq('id', currentGameweekNumber)
          .single();
        setSelectedGameweekData(data);
      }
    };
    getGameweekData();
  }, [currentGameweekNumber]);

  useEffect(() => {
    const fetchMostTransferredPlayerAndTeam = async () => {
      try {
        if (selectedGameweekData?.most_transferred_in && teams) {
          const { data: playerData, error: playerError } = await supabase
            .from('plplayerdata')
            .select()
            .eq('id', Number(selectedGameweekData.most_transferred_in));

          if (playerError) throw playerError;
          if (!playerData?.[0]) throw new Error('Player not found');

          // Get team data from context
          const playerTeam = teams.find(t => t.id === playerData[0].team);
          if (!playerTeam) throw new Error('Team not found');

          setMostTransferredPlayerData(playerData);
          setMostTransferredPlayerTeam(playerTeam);
        }
      } catch (error) {
        console.error('Error:', error);
        setMostTransferredPlayerTeam(null);
      }
    };
    fetchMostTransferredPlayerAndTeam();
  }, [selectedGameweekData, teams]);

  useEffect(() => {
    const fetchHighScorePlayerAndTeam = async () => {
      try {
        if (selectedGameweekData?.top_element && teams) {
          const { data: playerData, error: playerError } = await supabase
            .from('plplayerdata')
            .select()
            .eq('id', Number(selectedGameweekData.top_element));

          if (playerError) throw playerError;
          setHighScorePlayerData(playerData);

          const playerSummary = await playerService.getPlayerSummary(
            String(selectedGameweekData.top_element)
          );

          if (playerSummary) {
            const currentGameweekData = playerSummary.history.find(
              (item) => item.round === currentGameweekNumber
            );

            if (currentGameweekData?.opponent_team) {
              const opponentTeam = teams.find(
                t => t.id === currentGameweekData.opponent_team
              );
              setHighScorePlayerOpp(opponentTeam);
            }
          }
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };
    fetchHighScorePlayerAndTeam();
  }, [selectedGameweekData, teams, currentGameweekNumber]);

  useEffect(() => {
    const fetchMostCaptPlayerAndTeam = async () => {
      try {
        if (selectedGameweekData?.most_captained && teams) {
          const { data: playerData, error: playerError } = await supabase
            .from('plplayerdata')
            .select()
            .eq('id', Number(selectedGameweekData.most_captained));

          if (playerError) throw playerError;

          const playerSummary = await playerService.getPlayerSummary(
            String(selectedGameweekData.most_captained)
          );

          if (playerSummary) {
            const currentGameweekData = playerSummary.history.find(
              (item) => item.round === currentGameweekNumber
            );

            if (currentGameweekData?.opponent_team) {
              const opponentTeam = teams.find(
                t => t.id === currentGameweekData.opponent_team
              );
              setMostCaptPlayerOpp(opponentTeam);
              setMostCaptPlayerData([...playerData, currentGameweekData.total_points]);
            }
          }
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };
    fetchMostCaptPlayerAndTeam();
  }, [selectedGameweekData, teams, currentGameweekNumber]);

  useEffect(() => {
    const storedFplId = localStorage.getItem('fplId');
    const storedManagerData = JSON.parse(localStorage.getItem('managerData'));
    if (storedManagerData && storedFplId && !isSignedIn) {
      signIn(storedFplId, storedManagerData);
    }
  }, []);

  const highScorePlayerFixture = highScorePlayerData?.[0] && highScorePlayerOpp ?
    `${teams.find(t => t.id === highScorePlayerData[0].team)?.short_name} v ${highScorePlayerOpp.short_name}` :
    '...';

  const mostCaptPlayerFixture = mostCaptPlayerData?.[0] && mostCaptPlayerOpp ?
    `${teams.find(t => t.id === mostCaptPlayerData[0].team)?.short_name} v ${mostCaptPlayerOpp.short_name}` :
    '...';

  return (
    <div className="space-y-8 pb-14 md:pb-0">
      {isSignedIn ? (
        <section className="space-y-6">
          <WelcomeBanner />
        </section>
      ) : (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-center tracking-tight">
              Here's the FPL 2025 season at a glance.
            </h2>
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => setIsSignInModalOpen(true)}
              >
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
        </div>
      )}
      
      <SignInModal 
        isOpen={isSignInModalOpen} 
        onOpenChange={setIsSignInModalOpen}
      />

      <Tabs defaultValue="charts" className="space-y-4">
        {/* Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t md:hidden">
          <TabsList className="w-full h-18 rounded-none bg-gray-900 justify-around">
            <TabsTrigger value="charts" className="w-full h-full flex-col"><ChartNoAxesCombined /><p>Stats</p></TabsTrigger>
            <TabsTrigger value="table" className="w-full h-full flex-col"><ArrowUp10 /><p>Standings</p></TabsTrigger>
          </TabsList>
        </div>

        {/* Desktop Tabs */}
        <div className="hidden md:block w-full overflow-x-auto no-scrollbar">
          <TabsList className="w-full justify-start inline-flex min-w-max">
            <TabsTrigger value="charts">FPL Stats</TabsTrigger>
            <TabsTrigger value="table">FPL Standings</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="charts" className="space-y-4">
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
        </TabsContent>

        <TabsContent value="table">
          <LeagueSection
            pageNumber={pageNumber}
            setPageNumber={setPageNumber}
            isLoadingoverallLeagueData={isLoadingoverallLeagueData}
            leagueData={leagueData}
            setLeagueId={setLeagueId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;
