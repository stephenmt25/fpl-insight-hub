import { apiClient } from '../api-client';
import { ENDPOINTS } from './endpoints';
import { handleApiResponse } from './response-handler';
import { PlayerSummary, GameweekPlayerStats } from '../../types/fpl';
import { supabase } from "@/integrations/supabase/client";

export const playerService = {
  getPlayerSummary: (playerId: string) =>
    handleApiResponse<PlayerSummary>(
      apiClient.get(ENDPOINTS.player.summary(playerId))
    ),

  getGameweekPlayerStats: (gameweek: string) =>
    handleApiResponse<GameweekPlayerStats>(
      apiClient.get(ENDPOINTS.player.gameweekStats(gameweek))
    ),

  async getFormValuePlayers() {
    try {
      const { data, error } = await supabase
        .from('plplayerdata')
        .select('web_name, now_cost, form, selected_by_percent, team')
        .not('form', 'is', null)
        .order('form', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching form value players:', error);
      return [];
    }
  },

  async getDifferentialPicks() {
    try {
      const { data, error } = await supabase
        .from('plplayerdata')
        .select('web_name, form, selected_by_percent, team')
        .not('form', 'is', null)
        .lt('selected_by_percent', '35')
        .gt('form', '5.0')
        .order('form', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching differential picks:', error);
      return [];
    }
  }
};