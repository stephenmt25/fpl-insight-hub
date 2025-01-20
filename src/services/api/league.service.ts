import { apiClient } from '../api-client';
import { ENDPOINTS } from './endpoints';
import { handleApiResponse } from './response-handler';
import { LeagueDetails } from '../../types/fpl';
import { supabase } from '@/integrations/supabase/client';

export const leagueService = {
  getStandings: async (leagueId: string) => {
    const { data, error } = await supabase.functions.invoke('get-league-standings', {
      body: { leagueId },
    });

    if (error) throw error;
    return data;
  }
};