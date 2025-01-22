import axios from 'axios';
import { supabase } from '@/integrations/supabase/client';

const proxyRequest = async (endpoint: string) => {
  const { data, error } = await supabase.functions.invoke('fpl-api-proxy', {
    body: { endpoint },
  });

  if (error) throw error;
  return data;
};

export const apiClient = {
  get: (endpoint: string) => proxyRequest(endpoint),
};