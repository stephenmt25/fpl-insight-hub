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