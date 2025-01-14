import { apiClient } from '../api-client';
import { ENDPOINTS } from './endpoints';
import { handleApiResponse } from './response-handler';
import { Manager, ManagerHistory, ManagerLeagues, OverallInfo } from '../../types/fpl';

export const managerService = {
  getInfo: (managerId: number) => 
    handleApiResponse<Manager>(
      apiClient.get(ENDPOINTS.manager.info(managerId))
    ),

  getHistory: (managerId: number) =>
    handleApiResponse<ManagerHistory>(
      apiClient.get(ENDPOINTS.manager.history(managerId))
    ),

  getLeagues: (managerId: number) =>
    handleApiResponse<ManagerLeagues>(
      apiClient.get(ENDPOINTS.manager.leagues(managerId))
    ),

  getOverallInfo: () => 
    handleApiResponse<OverallInfo>(
      apiClient.get(ENDPOINTS.overall.info())
    )
};