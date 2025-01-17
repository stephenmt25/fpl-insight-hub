import { apiClient } from '../api-client';
import { ENDPOINTS } from './endpoints';
import { handleApiResponse } from './response-handler';
import { Manager, ManagerHistory, ManagerLeagues, ManagerTransfers, GameweekPicks, OverallInfo } from '../../types/fpl';

export const managerService = {
  getInfo: (managerId: string) => 
    handleApiResponse<Manager>(
      apiClient.get(ENDPOINTS.manager.info(managerId))
    ),

  getHistory: (managerId: string) =>
    handleApiResponse<ManagerHistory>(
      apiClient.get(ENDPOINTS.manager.history(managerId))
    ),

  getLeagues: (managerId: string) =>
    handleApiResponse<ManagerLeagues>(
      apiClient.get(ENDPOINTS.manager.leagues(managerId))
    ),

  getTransfers: (managerId: string) =>
    handleApiResponse<ManagerTransfers>(
      apiClient.get(ENDPOINTS.manager.transfers(managerId))
    ),

  getGameweekTeamPicks: (managerId: string, gameweek: string) =>
    handleApiResponse<GameweekPicks>(
      apiClient.get(ENDPOINTS.manager.picks(managerId, gameweek))
    ),

  getOverallInfo: () => 
    handleApiResponse<OverallInfo>(
      apiClient.get(ENDPOINTS.overall.info())
    )
};