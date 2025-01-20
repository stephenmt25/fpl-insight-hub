import { apiClient } from '../api-client';
import { ENDPOINTS } from './endpoints';
import { handleApiResponse } from './response-handler';
import type { OverallInfo, Status } from '@/types/fpl';

export const overallService = {
  getInfo: async (): Promise<OverallInfo> => {
    return handleApiResponse(
      apiClient.get(ENDPOINTS.player.dreamTeam('1'))
    );
  },
  getStatus: async (): Promise<Status> => {
    return handleApiResponse(
      apiClient.get(ENDPOINTS.status.info())
    )
  }
};