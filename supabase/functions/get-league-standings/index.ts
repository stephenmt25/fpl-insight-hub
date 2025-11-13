import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'",
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body if it exists
    const body = await req.json().catch(() => ({}));
    const leagueId = body.leagueId;

    console.log('Received request for league ID:', leagueId);

    // Enhanced input validation and sanitization
    if (!leagueId) {
      console.error('No league ID provided');
      return new Response(
        JSON.stringify({ error: 'League ID is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Convert to string and sanitize league ID to prevent injection attacks
    const sanitizedLeagueId = String(leagueId).trim().replace(/[^\d]/g, '');
    
    if (!sanitizedLeagueId || sanitizedLeagueId.length < 1 || sanitizedLeagueId.length > 10) {
      console.error('Invalid league ID format');
      return new Response(
        JSON.stringify({ error: 'League ID must be 1-10 digits' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Fetching data from FPL API for league:', sanitizedLeagueId);
    const response = await fetch(
      `https://fantasy.premierleague.com/api/leagues-classic/${sanitizedLeagueId}/standings/`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-GB,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Referer': 'https://fantasy.premierleague.com/',
          'Origin': 'https://fantasy.premierleague.com',
          'Connection': 'keep-alive',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin'
        },
      }
    );

    if (!response.ok) {
      console.error('FPL API error:', response.status, await response.text());
      throw new Error(`FPL API returned ${response.status}`);
    }

    const data = await response.json();
    console.log('Successfully fetched data for league:', sanitizedLeagueId);

    return new Response(
      JSON.stringify(data),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in get-league-standings:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});