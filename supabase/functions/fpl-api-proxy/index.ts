import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FPL_BASE_URL = 'https://fantasy.premierleague.com/api';

serve(async (req) => {
  console.log('FPL API Proxy function called');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const body = await req.json().catch(() => {
      console.error('Failed to parse request body');
      throw new Error('Invalid request body');
    });
    
    const { endpoint } = body;

    if (!endpoint) {
      console.error('No endpoint provided in request');
      return new Response(
        JSON.stringify({ 
          error: 'Endpoint is required',
          timestamp: new Date().toISOString()
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check for undefined parameters in the endpoint
    if (endpoint.includes('undefined')) {
      console.error(`Invalid endpoint with undefined parameters: ${endpoint}`);
      return new Response(
        JSON.stringify({
          error: 'Invalid endpoint: contains undefined parameters',
          endpoint,
          timestamp: new Date().toISOString()
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Fetching data from FPL API endpoint: ${endpoint}`);

    // Construct the full URL
    const url = `${FPL_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

    // Log the response status and headers for debugging
    console.log('FPL API Response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`FPL API error: ${response.status}`, errorText);
      
      return new Response(
        JSON.stringify({
          error: `FPL API Error: ${response.statusText}`,
          status: response.status,
          details: errorText,
          endpoint,
          timestamp: new Date().toISOString()
        }),
        { 
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const data = await response.json();
    console.log('Successfully fetched data from FPL API');

    return new Response(
      JSON.stringify(data),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in fpl-api-proxy:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal Server Error', 
        details: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});