import { apiClient } from '../api-client';
import { ENDPOINTS } from './endpoints';
import { handleResponse } from './response-handler';
import type { OverallInfo } from '@/types/fpl';

export const overallService = {
  getInfo: async (): Promise<OverallInfo> => {
    const response = await apiClient.get(ENDPOINTS.overall.info());
    return handleResponse<OverallInfo>(response);
  }
};