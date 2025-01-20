import { useState, useEffect, useContext } from "react";
import { GameweekPaginator } from "@/components/GameweekPaginator";
import { useAuth } from "@/context/auth-context";
import { leagueService, playerService } from "@/services/fpl-api";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { LeagueSection } from "@/components/dashboard/LeagueSection";
import { VisualizationSection } from "@/components/dashboard/VisualizationSection";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LiveGWContext } from "@/context/livegw-context";

const Index = () => {
  const [gameweekData, setGameweekData] = useState<any[] | null>(null);
  const [currentGameweekNumber, setCurrentGameweekNumber] = useState<number | null>(null);
  const { isSignedIn, signIn } = useAuth();
  const [pageNumber, setPageNumber] = useState("1");
  const { updateLiveGWData, eventStatus } = useContext(LiveGWContext)
  const overallLeagueId = "314";
  const [leagueId, setLeagueId] = useState(overallLeagueId);
  const [liveGWStats, setLiveGWStats] = useState([]) // pass element id (-1) for gw stats
  const [highScorePlayer, setHighScorePlayer] = useState<any | null>(null);
  const [highScorePlayerTeam, setHighScorePlayerTeam] = useState<any | null>(null);
  const [highScorePlayerOpp, setHighScorePlayerOpp] = useState<any | null>(null);
  const [mostCaptPlayer, setMostCaptPlayer] = useState<any | null>([{ status: "loading" }]);
  const [mostCaptPlayerTeam, setMostCaptPlayerTeam] = useState<any | null>(null);
  const [mostCaptPlayerOpp, setMostCaptPlayerOpp] = useState<any | null>(null);

  const {
    data: leagueData,
    error: overallLeagueDataError,
    isLoading: isLoadingoverallLeagueData,
  } = useQuery({
    queryKey: ['leagueData', leagueId],
    queryFn: () => leagueService.getStandings(leagueId),
  });

  useEffect(() => {
    const getData = async () => {
      const { data } = await supabase.from('fploveralldata').select();
      setGameweekData(data);

      // Find the current gameweek and set it
      const currentGW = data?.find(gw => gw.is_current === "true");
      if (currentGW) {
        setCurrentGameweekNumber(currentGW.id);
      }
    };
    getData();
  }, []);
  const previousGWData = gameweekData?.filter((gw) => gw.is_previous === "true")[0];
  const liveGameweekData = gameweekData?.filter((gw) => gw.is_current === "true")[0] || null;
  const totalGameweeks = 38;

  const isLive = eventStatus.status.some(item => {
    return item.points === 'l';
  });

  useEffect(() => {
    if (liveGameweekData !== null) {
      updateLiveGWData(liveGameweekData)
      const getLiveGWStats = async () => {
        const liveGWStats = await playerService.getGameweekPlayerStats(liveGameweekData.id.toString())
        if (liveGWStats) {
          setLiveGWStats(liveGWStats.elements)
        }
      };
      getLiveGWStats();
    }
    if (previousGWData !== undefined) {
      updateLiveGWData(previousGWData)
      const getPrevGWStats = async () => {
        const prevGWStats = await playerService.getGameweekPlayerStats(previousGWData.id.toString())
        if (prevGWStats) {
          setLiveGWStats(prevGWStats.elements)
        }
      };
      getPrevGWStats();
    }
  }, [liveGameweekData])

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
              (item) => item.round === currentGameweekNumber
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
              (item) => item.round === currentGameweekNumber
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
              setMostCaptPlayer([...playerData, currentGameweekData.total_points])
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

  // if (!currentGameweekNumber) return null;

  const highScorePlayerFixture = highScorePlayerTeam && highScorePlayerOpp ? `${highScorePlayerTeam[0].short_name} v ${highScorePlayerOpp[0].short_name}` : '...';
  const mostCaptPlayerFixture = mostCaptPlayerTeam && mostCaptPlayerOpp ? `${mostCaptPlayerTeam[0].short_name} v ${mostCaptPlayerOpp[0].short_name}` : '...';


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
          </TabsList>
        </div>
        <TabsContent value="charts" className="space-y-4">
          <GameweekPaginator
            currentGameweekNumber={currentGameweekNumber}
            setCurrentGameweekNumber={setCurrentGameweekNumber}
            totalGameweeks={totalGameweeks}
            liveGameweekData={liveGameweekData}
          />

          <StatsOverview
            currentGW={selectedGameweekData}
            mostCaptPlayer={mostCaptPlayer}
            highScorePlayer={highScorePlayer}
            highScorePlayerFixture={highScorePlayerFixture}
            mostCaptPlayerFixture={mostCaptPlayerFixture}
          />
          <VisualizationSection
            selectedGameweekData={selectedGameweekData}
            mostCaptPlayer={mostCaptPlayer}
            mostCaptPlayerFixture={mostCaptPlayerFixture}
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
