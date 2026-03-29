import { apiClient } from '../api-client';
import { ENDPOINTS } from './endpoints';
import { handleApiResponse } from './response-handler';
import type { Fixture } from '@/types/bootstrap';

export const fixtureService = {
  getAll: async (): Promise<Fixture[]> => {
    return handleApiResponse(
      apiClient.get(ENDPOINTS.fixtures.all())
    );
  },

  getByEvent: async (eventId: string): Promise<Fixture[]> => {
    return handleApiResponse(
      apiClient.get(ENDPOINTS.fixtures.byEvent(eventId))
    );
  },
};
