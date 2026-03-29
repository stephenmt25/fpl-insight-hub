import { useState, useEffect, useContext } from "react";
import { useAuth } from "@/context/auth-context";
import { leagueService, playerService, managerService } from "@/services/fpl-api";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LiveGWContext } from "@/context/livegw-context";
import { useTeamsContext } from "@/context/teams-context";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

type PlayerDataRow = Database['public']['Tables']['plplayerdata']['Row'];
type TeamDataRow = Database['public']['Tables']['plteams']['Row'];
type FplOverallDataRow = Database['public']['Tables']['fploveralldata']['Row'];

export interface MostCaptainedData {
  player: PlayerDataRow;
  points: number;
}

export function useDashboardData() {
  const [currentGameweekNumber, setCurrentGameweekNumber] = useState<number | null>(null);
  const { isSignedIn, signIn } = useAuth();
  const [pageNumber, setPageNumber] = useState("1");
  const { updateLiveGWData, updateOverallData } = useContext(LiveGWContext);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [leagueId, setLeagueId] = useState("314");
  const [highScorePlayerData, setHighScorePlayerData] = useState<PlayerDataRow[] | null>(null);
  const [highScorePlayerOpp, setHighScorePlayerOpp] = useState<TeamDataRow | null>(null);
  const [mostCaptPlayerData, setMostCaptPlayerData] = useState<MostCaptainedData | null>(null);
  const [mostCaptPlayerOpp, setMostCaptPlayerOpp] = useState<TeamDataRow | null>(null);
  const [mostTransferredPlayerData, setMostTransferredPlayerData] = useState<PlayerDataRow[] | null>(null);
  const [mostTransferredPlayerTeam, setMostTransferredPlayerTeam] = useState<TeamDataRow | null>(null);
  const { data: teams } = useTeamsContext();

  const {
    data: leagueData,
    isLoading: isLoadingoverallLeagueData,
  } = useQuery({
    queryKey: ['leagueData', leagueId],
    queryFn: () => leagueService.getStandings(leagueId),
  });

  const {
    data: overallFplData,
    isLoading: isLoadingOverallFplData,
  } = useQuery({
    queryKey: ['overallFplData'],
    queryFn: async () => {
      const { data, error } = await supabase.from('fploveralldata').select();
      if (error) throw error;
      return data;
    },
  });

  const [isGuestSigningIn, setIsGuestSigningIn] = useState(false);

  const handleGuestSignIn = async () => {
    const guestFplId = "7788626";
    setIsGuestSigningIn(true);
    try {
      const managerData = await managerService.getInfo(guestFplId);
      if (!managerData) {
        toast.error("Unable to fetch guest manager data. Please try again.");
        return;
      }
      localStorage.setItem('fplId', guestFplId);
      signIn(guestFplId, managerData);
      toast.success("You're now signed in as a guest!");
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error during guest sign-in:", error);
      toast.error("Error signing in as guest. Please try again later.");
    } finally {
      setIsGuestSigningIn(false);
    }
  };

  // Set current gameweek and push data to context
  useEffect(() => {
    if (!isLoadingOverallFplData && overallFplData) {
      updateOverallData(overallFplData);
      const currentGW = overallFplData.find(gw => gw.is_current === "true");
      if (currentGW) {
        setCurrentGameweekNumber(currentGW.id);
      }
    }
  }, [isLoadingOverallFplData, overallFplData]);

  const previousGWData = overallFplData?.filter((gw) => gw.is_previous === "true")[0];
  const liveGameweekData = overallFplData?.filter((gw) => gw.is_current === "true")[0] || null;

  // Push live gameweek data to context
  useEffect(() => {
    if (liveGameweekData) {
      updateLiveGWData(liveGameweekData);
    } else if (previousGWData) {
      updateLiveGWData(previousGWData);
    }
  }, [liveGameweekData, previousGWData]);

  const [selectedGameweekData, setSelectedGameweekData] = useState<FplOverallDataRow | null>(liveGameweekData);

  // Fetch selected gameweek data when paginator changes
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

  // Fetch most transferred player
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
          const playerTeam = teams.find(t => t.id === playerData[0].team);
          if (!playerTeam) throw new Error('Team not found');
          setMostTransferredPlayerData(playerData);
          setMostTransferredPlayerTeam(playerTeam);
        }
      } catch (error) {
        if (import.meta.env.DEV) console.error('Error:', error);
        setMostTransferredPlayerTeam(null);
      }
    };
    fetchMostTransferredPlayerAndTeam();
  }, [selectedGameweekData, teams]);

  // Fetch highest scoring player
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
            const gwData = playerSummary.history.find(
              (item) => item.round === currentGameweekNumber
            );
            if (gwData?.opponent_team) {
              const opponentTeam = teams.find(t => t.id === gwData.opponent_team);
              setHighScorePlayerOpp(opponentTeam || null);
            }
          }
        }
      } catch (error) {
        if (import.meta.env.DEV) console.error('Error:', error);
      }
    };
    fetchHighScorePlayerAndTeam();
  }, [selectedGameweekData, teams, currentGameweekNumber]);

  // Fetch most captained player
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
            const gwData = playerSummary.history.find(
              (item) => item.round === currentGameweekNumber
            );
            if (gwData?.opponent_team) {
              const opponentTeam = teams.find(t => t.id === gwData.opponent_team);
              setMostCaptPlayerOpp(opponentTeam || null);
              setMostCaptPlayerData({ player: playerData[0], points: gwData.total_points });
            }
          }
        }
      } catch (error) {
        if (import.meta.env.DEV) console.error('Error:', error);
      }
    };
    fetchMostCaptPlayerAndTeam();
  }, [selectedGameweekData, teams, currentGameweekNumber]);

  // Restore session from localStorage
  useEffect(() => {
    const storedFplId = localStorage.getItem('fplId');
    const storedManagerData = localStorage.getItem('managerData');
    if (storedManagerData && storedFplId && !isSignedIn) {
      try {
        signIn(storedFplId, JSON.parse(storedManagerData));
      } catch {
        // Invalid stored data, ignore
      }
    }
  }, []);

  const highScorePlayerFixture = highScorePlayerData?.[0] && highScorePlayerOpp
    ? `${teams?.find(t => t.id === highScorePlayerData[0].team)?.short_name} v ${highScorePlayerOpp.short_name}`
    : '...';

  const mostCaptPlayerFixture = mostCaptPlayerData?.player && mostCaptPlayerOpp
    ? `${teams?.find(t => t.id === mostCaptPlayerData.player.team)?.short_name} v ${mostCaptPlayerOpp.short_name}`
    : '...';

  return {
    currentGameweekNumber,
    setCurrentGameweekNumber,
    isSignedIn,
    pageNumber,
    setPageNumber,
    isSignInModalOpen,
    setIsSignInModalOpen,
    leagueId,
    setLeagueId,
    leagueData,
    isLoadingoverallLeagueData,
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
  };
}
