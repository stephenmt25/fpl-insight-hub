import { apiClient } from '../api-client';
import { ENDPOINTS } from './endpoints';
import { handleResponse } from './response-handler';
import type { Manager, ManagerHistory, ManagerLeagues, GameweekPicks, ManagerTransfers } from '@/types/fpl';

export const managerService = {
  getInfo: async (managerId: string): Promise<Manager> => {
    const response = await apiClient.get(ENDPOINTS.manager.info(managerId));
    return handleResponse<Manager>(response);
  },

  getHistory: async (managerId: string): Promise<ManagerHistory> => {
    const response = await apiClient.get(ENDPOINTS.manager.history(managerId));
    return handleResponse<ManagerHistory>(response);
  },

  getLeagues: async (managerId: string): Promise<ManagerLeagues> => {
    const response = await apiClient.get(ENDPOINTS.manager.leagues(managerId));
    return handleResponse<ManagerLeagues>(response);
  },

  getTransfers: async (managerId: string): Promise<ManagerTransfers[]> => {
    const response = await apiClient.get(ENDPOINTS.manager.transfers(managerId));
    return handleResponse<ManagerTransfers[]>(response);
  },

  getPicks: async (managerId: string): Promise<GameweekPicks> => {
    const response = await apiClient.get(ENDPOINTS.manager.picks(managerId));
    return handleResponse<GameweekPicks>(response);
  }
};