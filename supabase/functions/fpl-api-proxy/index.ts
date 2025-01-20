import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FPL_BASE_URL = 'https://fantasy.premierleague.com/api';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const body = await req.json().catch(() => ({}));
    const { endpoint } = body;

    console.log('Received request for FPL API endpoint:', endpoint);

    if (!endpoint) {
      console.error('No endpoint provided');
      return new Response(
        JSON.stringify({ error: 'Endpoint is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Construct the full URL
    const url = `${FPL_BASE_URL}${endpoint}`;
    console.log('Fetching data from:', url);

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('FPL API error:', response.status, await response.text());
      throw new Error(`FPL API returned ${response.status}`);
    }

    const data = await response.json();
    console.log('Successfully fetched data for endpoint:', endpoint);

    return new Response(
      JSON.stringify(data),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in fpl-api-proxy:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});