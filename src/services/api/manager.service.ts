import { apiClient } from '../api-client';
import { ENDPOINTS } from './endpoints';
import { handleApiResponse } from './response-handler';
import type { Manager, ManagerHistory, ManagerLeagues, GameweekPicks, ManagerTransfers } from '@/types/fpl';

export const managerService = {
  getInfo: async (managerId: string): Promise<Manager> => {
    return handleApiResponse(
      apiClient.get(ENDPOINTS.manager.overview(managerId))
    );
  },

  getHistory: async (managerId: string): Promise<ManagerHistory> => {
    return handleApiResponse(
      apiClient.get(ENDPOINTS.manager.history(managerId))
    );
  },

  getLeagues: async (managerId: string): Promise<ManagerLeagues> => {
    return handleApiResponse(
      apiClient.get(ENDPOINTS.manager.overview(managerId))
    );
  },

  getTransfers: async (managerId: string): Promise<ManagerTransfers[]> => {
    return handleApiResponse(
      apiClient.get(ENDPOINTS.manager.transfers(managerId))
    );
  },

  getPicks: async (managerId: string): Promise<GameweekPicks> => {
    return handleApiResponse(
      apiClient.get(ENDPOINTS.manager.myTeam(managerId))
    );
  },

  getGameweekTeamPicks: async (managerId: string, gameweek: string): Promise<GameweekPicks> => {
    return handleApiResponse(
      apiClient.get(ENDPOINTS.manager.eventPicks(managerId, gameweek))
    );
  }
};