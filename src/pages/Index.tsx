import { useState, useEffect } from "react";
import { GameweekPaginator } from "@/components/GameweekPaginator";
import { useAuth } from "@/context/auth-context";
import { leagueService, playerService } from "@/services/fpl-api";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { LeagueSection } from "@/components/dashboard/LeagueSection";
import { VisualizationSection } from "@/components/dashboard/VisualizationSection";
import { DreamTeamTable } from "@/components/DreamTeamTable";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const Index = () => {
  const [gameweekData, setGameweekData] = useState<any[] | null>(null);
  const [currentGameweek, setCurrentGameweek] = useState<number | null>(null);
  const [highScorePlayer, setHighScorePlayer] = useState<any | null>(null);
  const [mostCaptPlayer, setMostCaptPlayer] = useState<any | null>(null);
  const { isSignedIn, signIn } = useAuth();
  const [pageNumber, setPageNumber] = useState("1");
  const [highScorePlayerTeam, setHighScorePlayerTeam] = useState<any | null>(null);
  const [highScorePlayerOpp, setHighScorePlayerOpp] = useState<any | null>(null);
  const [mostCaptPlayerTeam, setMostCaptPlayerTeam] = useState<any | null>(null);
  const [mostCaptPlayerOpp, setMostCaptPlayerOpp] = useState<any | null>(null);

  const overallLeagueId = "314";
  const [leagueId, setLeagueId] = useState(overallLeagueId);

  const {
    data: leagueData,
    error: overallLeagueDataError,
    isLoading: isLoadingoverallLeagueData,
  } = useQuery({
    queryKey: ['leagueData', leagueId, pageNumber],
    queryFn: () => leagueService.getStandings(leagueId, pageNumber),
  });

  useEffect(() => {
    const getData = async () => {
      const { data } = await supabase.from('fploveralldata').select();
      setGameweekData(data);

      // Find the current gameweek and set it
      const currentGW = data?.find(gw => gw.is_previous === "true");
      if (currentGW) {
        setCurrentGameweek(currentGW.id);
      }
    };
    getData();
  }, []);

  const currentGW = gameweekData?.filter((gw) => gw.is_previous === "true")[0];
  const liveGameweek = currentGW?.id || 1;
  const totalGameweeks = 38;

  const [selectedGameweekData, setSelectedGameweekData] = useState(currentGW);

  useEffect(() => {
    const getGameweekData = async () => {
      if (currentGameweek) {
        const { data } = await supabase
          .from('fploveralldata')
          .select()
          .eq('id', currentGameweek)
          .single();
        setSelectedGameweekData(data);
      }
    };
    getGameweekData();
  }, [currentGameweek]);

  useEffect(() => {
    const fetchHighScorePlayerAndTeam = async () => {
      try {
        if (selectedGameweekData?.top_element) {
          const { data: playerData, error: playerError } = await supabase
            .from('plplayerdata')
            .select()
            .eq('id', Number(selectedGameweekData.top_element));

          if (playerError) {
            console.error('Error fetching player data:', playerError);
            return;
          }

          setHighScorePlayer(playerData);

          if (playerData && playerData[0]?.team) {
            const { data: teamData, error: teamError } = await supabase
              .from('plteams')
              .select()
              .eq('id', Number(playerData[0].team));
            if (teamError) {
              console.error('Error fetching team data:', teamError);
              return;
            }

            setHighScorePlayerTeam(teamData);
          }

          // Convert number to string when calling getPlayerSummary
          const playerSummary = await playerService.getPlayerSummary(String(selectedGameweekData.top_element));

          if (playerSummary) {
            const currentGameweekData = playerSummary.history.find(
              (item) => item.round === currentGameweek
            );

            if (currentGameweekData?.opponent_team) {
              const { data: opponentTeamData, error: opponentTeamError } = await supabase
                .from('plteams')
                .select('short_name')
                .eq('id', Number(currentGameweekData.opponent_team));

              if (opponentTeamError) {
                console.error('Error fetching opponent team data:', opponentTeamError);
                return;
              }

              setHighScorePlayerOpp(opponentTeamData)
            }
          }
        }
      } catch (error) {
        console.error('Unexpected error:', error);
      }
    };

    fetchHighScorePlayerAndTeam();
  }, [selectedGameweekData]);


  useEffect(() => {
    const fetchMostCaptPlayerAndTeam = async () => {
      try {
        if (selectedGameweekData?.most_captained) {
          const { data: playerData, error: playerError } = await supabase
            .from('plplayerdata')
            .select()
            .eq('id', Number(selectedGameweekData.most_captained));

          if (playerError) {
            console.error('Error fetching most-captained player data:', playerError);
            return;
          }

          setMostCaptPlayer(playerData);

          if (playerData && playerData[0]?.team) {
            const { data: teamData, error: teamError } = await supabase
              .from('plteams')
              .select()
              .eq('id', Number(playerData[0].team));

            if (teamError) {
              console.error('Error fetching most-captained player team data:', teamError);
              return;
            }

            setMostCaptPlayerTeam(teamData);
          }

          // Convert number to string when calling getPlayerSummary
          const playerSummary = await playerService.getPlayerSummary(String(selectedGameweekData.most_captained));

          if (playerSummary) {
            const currentGameweekData = playerSummary.history.find(
              (item) => item.round === currentGameweek
            );

            if (currentGameweekData?.opponent_team) {
              const { data: opponentTeamData, error: opponentTeamError } = await supabase
                .from('plteams')
                .select('short_name')
                .eq('id', Number(currentGameweekData.opponent_team));

              if (opponentTeamError) {
                console.error('Error fetching opponent team data:', opponentTeamError);
                return;
              }

              setMostCaptPlayerOpp(opponentTeamData);
            }
          }
        }
      } catch (error) {
        console.error('Unexpected error:', error);
      }
    };

    fetchMostCaptPlayerAndTeam();
  }, [selectedGameweekData]);

  useEffect(() => {
    const storedFplId = localStorage.getItem('fplId');
    const storedManagerData = JSON.parse(localStorage.getItem('managerData'));
    if (storedManagerData && storedFplId && !isSignedIn) {
      signIn(storedFplId, storedManagerData);
    }
  }, []);
console.log(currentGW, currentGameweek)
  // if (!currentGameweek) return null;

  return (
    <div className="space-y-1">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Here's the FPL 2025 season at a glance.
          </h2>
          <p className="mt-2 text-muted-foreground">
            Overall FPL data and statistics.
          </p>
        </div>
      </div>
      <br />
      <Tabs defaultValue="charts" className="space-y-4">
        <div className="w-full overflow-x-auto no-scrollbar">
          <TabsList className="w-full justify-start inline-flex min-w-max">
            <TabsTrigger value="charts">FPL Data Visualized</TabsTrigger>
            <TabsTrigger value="table">FPL Standings</TabsTrigger>
            <TabsTrigger value="dream-team">Dream Team</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="charts" className="space-y-4">
          <GameweekPaginator
            currentGameweek={currentGameweek}
            setCurrentGameweek={setCurrentGameweek}
            totalGameweeks={totalGameweeks}
            liveGameweek={liveGameweek}
          />

          <StatsOverview
            currentGW={selectedGameweekData}
            mostCaptPlayer={mostCaptPlayer}
            highScorePlayer={highScorePlayer}
            highScorePlayerTeam={highScorePlayerTeam}
            highScorePlayerOpp={highScorePlayerOpp}
            mostCaptPlayerTeam={mostCaptPlayerTeam}
            mostCaptPlayerOpp={mostCaptPlayerOpp}
          />
          <VisualizationSection />
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

        <TabsContent value="dream-team">
          <DreamTeamTable />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;