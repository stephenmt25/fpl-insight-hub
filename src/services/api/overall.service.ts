import { apiClient } from '../api-client';
import { ENDPOINTS } from './endpoints';
import { handleApiResponse } from './response-handler';
import { OverallInfo } from '../../types/fpl';

export const overallService = {
  getInfo: () => 
    handleApiResponse<OverallInfo>(
      apiClient.get(ENDPOINTS.overall.info())
    )
};