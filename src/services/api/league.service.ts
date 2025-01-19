import { apiClient } from '../api-client';
import { ENDPOINTS } from './endpoints';
import { handleApiResponse } from './response-handler';
import { LeagueDetails } from '../../types/fpl';

export const leagueService = {
  getStandings: (leagueId: string) =>
    handleApiResponse<LeagueDetails>(
      apiClient.get(ENDPOINTS.league.classicStandings(leagueId))
    )
};