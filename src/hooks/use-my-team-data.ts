import { useState, useEffect, useContext } from "react";
import { useAuth } from "@/context/auth-context";
import { managerService, playerService } from "@/services/fpl-api";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LiveGWContext } from "@/context/livegw-context";
import { useTeamsContext } from "@/context/teams-context";
import { getPositionLabel } from "@/utils/player-utils";
import type { GameweekPicks } from "@/types/fpl";
import type { BootstrapStatic } from "@/types/bootstrap";
import { apiClient } from "@/services/api-client";

export interface SquadPlayer {
  id: number;
  webName: string;
  teamShortName: string;
  position: string;
  elementType: number;
  points: number;
  isCaptain: boolean;
  isViceCaptain: boolean;
  isBench: boolean;
  multiplier: number;
  epNext: number;
  form: number;
  status: string;
  news: string;
  chanceOfPlaying: number | null;
}

export function useMyTeamData() {
  const { fplId, currentManager, isSignedIn, managerHistory } = useAuth();
  const { liveGameweekData } = useContext(LiveGWContext);
  const { data: teams } = useTeamsContext();
  const [currentGameweek, setCurrentGameweek] = useState<number | null>(null);

  // Determine current GW
  useEffect(() => {
    if (liveGameweekData?.id) {
      setCurrentGameweek(liveGameweekData.id);
    }
  }, [liveGameweekData]);

  // Fetch bootstrap-static for chips, scoring, ep_next
  const { data: bootstrapData } = useQuery<BootstrapStatic>({
    queryKey: ['bootstrapStatic'],
    queryFn: () => apiClient.get('/bootstrap-static/'),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch current GW picks
  const { data: picks, isLoading: isLoadingPicks } = useQuery<GameweekPicks>({
    queryKey: ['myTeamPicks', fplId, currentGameweek],
    queryFn: () => managerService.getGameweekTeamPicks(fplId!, currentGameweek!.toString()),
    enabled: !!fplId && !!currentGameweek,
  });

  // Fetch all players from Supabase
  const { data: allPlayers } = useQuery({
    queryKey: ['allPlayers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('plplayerdata').select('*');
      if (error) throw error;
      return data;
    },
  });

  // Fetch live GW stats
  const { data: liveStats } = useQuery({
    queryKey: ['liveGWStats', currentGameweek],
    queryFn: () => playerService.getGameweekPlayerStats(currentGameweek!.toString()),
    enabled: !!currentGameweek,
  });

  // Fetch manager transfers
  const { data: transfers } = useQuery({
    queryKey: ['managerTransfers', fplId],
    queryFn: () => managerService.getTransfers(fplId!),
    enabled: !!fplId,
  });

  // Build enriched squad
  const squad: SquadPlayer[] = [];
  if (picks?.picks && allPlayers && teams) {
    for (const pick of picks.picks) {
      const player = allPlayers.find(p => p.id === pick.element);
      const team = teams.find(t => t.id === player?.team);
      const livePlayer = liveStats?.elements?.find((e: { id: number }) => e.id === pick.element);
      const bootstrapPlayer = bootstrapData?.elements?.find(e => e.id === pick.element);

      squad.push({
        id: pick.element,
        webName: player?.web_name || 'Unknown',
        teamShortName: team?.short_name || '?',
        position: player ? getPositionLabel(player.element_type) : '',
        elementType: player?.element_type || 0,
        points: livePlayer?.stats?.total_points || 0,
        isCaptain: pick.is_captain,
        isViceCaptain: pick.is_vice_captain,
        isBench: pick.position > 11,
        multiplier: pick.multiplier,
        epNext: parseFloat(bootstrapPlayer?.ep_next || '0'),
        form: parseFloat(player?.form || '0'),
        status: player?.status || '',
        news: player?.news || '',
        chanceOfPlaying: player?.chance_of_playing_next_round ?? null,
      });
    }
  }

  const starting11 = squad.filter(p => !p.isBench);
  const bench = squad.filter(p => p.isBench);
  const totalPoints = picks?.entry_history?.points || 0;

  // Detect formation
  const formation = starting11.length > 0
    ? `${starting11.filter(p => p.elementType === 2).length}-${starting11.filter(p => p.elementType === 3).length}-${starting11.filter(p => p.elementType === 4).length}`
    : '';

  // Chips data
  const chips = bootstrapData?.chips || [];
  const events = bootstrapData?.events || [];
  const scoringRules = bootstrapData?.game_config?.scoring;

  // Check which chips have been used (from manager history picks)
  const usedChips: string[] = [];
  if (managerHistory?.current) {
    // We'd need to check each GW's active_chip — for now, derive from what we can
  }

  return {
    isSignedIn,
    currentManager,
    currentGameweek,
    setCurrentGameweek,
    picks,
    isLoadingPicks,
    squad,
    starting11,
    bench,
    formation,
    totalPoints,
    entryHistory: picks?.entry_history,
    automaticSubs: picks?.automatic_subs || [],
    activeChip: picks?.active_chip,
    chips,
    events,
    scoringRules,
    transfers,
    managerHistory,
    liveGameweekData,
    bootstrapData,
  };
}
