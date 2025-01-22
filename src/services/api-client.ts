import axios from 'axios';
import { supabase } from '@/integrations/supabase/client';

const proxyRequest = async (endpoint: string) => {
  try {
    console.log('Making proxy request to:', endpoint);
    
    const { data, error } = await supabase.functions.invoke('fpl-api-proxy', {
      body: { endpoint },
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw error;
    }

    if (!data) {
      console.error('No data returned from proxy');
      throw new Error('No data returned from proxy');
    }

    return data;
  } catch (error) {
    console.error('Proxy request failed:', error);
    throw error;
  }
};

export const apiClient = {
  get: (endpoint: string) => proxyRequest(endpoint),
};