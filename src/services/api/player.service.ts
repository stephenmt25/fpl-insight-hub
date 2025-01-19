import { apiClient } from '../api-client';
import { ENDPOINTS } from './endpoints';
import { handleApiResponse } from './response-handler';
import { PlayerSummary, GameweekPlayerStats } from '../../types/fpl';

export const playerService = {
  getPlayerSummary: (playerId: string) =>
    handleApiResponse<PlayerSummary>(
      apiClient.get(ENDPOINTS.player.summary(playerId))
    ),

  getGameweekPlayerStats: (gameweek: string) =>
    handleApiResponse<GameweekPlayerStats>(
      apiClient.get(ENDPOINTS.player.gameweekStats(gameweek))
    ),
    
  getGameweekDreamTeam: (gameweek: string) =>
    handleApiResponse(
      apiClient.get(ENDPOINTS.player.dreamTeam(gameweek))
    )
};