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

    // Enhanced input validation and sanitization
    if (!endpoint || typeof endpoint !== 'string') {
      console.error('No endpoint provided in request');
      return new Response(
        JSON.stringify({ 
          error: 'Endpoint is required and must be a string',
          timestamp: new Date().toISOString()
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Sanitize endpoint to prevent injection attacks
    const sanitizedEndpoint = endpoint.trim().replace(/[<>'"]/g, '');
    
    // Validate endpoint format (must start with expected FPL API paths)
    const validPaths = [
      '/bootstrap-static/',
      '/entry/',
      '/leagues-classic/',
      '/event/',
      '/element-summary/',
      '/dream-team/',
      '/event-status/'
    ];
    
    const isValidPath = validPaths.some(path => sanitizedEndpoint.startsWith(path));
    if (!isValidPath) {
      console.error(`Invalid API endpoint: ${sanitizedEndpoint}`);
      return new Response(
        JSON.stringify({
          error: 'Invalid API endpoint',
          timestamp: new Date().toISOString()
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check for undefined parameters in the sanitized endpoint
    if (sanitizedEndpoint.includes('undefined')) {
      console.error(`Invalid endpoint with undefined parameters: ${sanitizedEndpoint}`);
      return new Response(
        JSON.stringify({
          error: 'Invalid endpoint: contains undefined parameters',
          endpoint: sanitizedEndpoint,
          timestamp: new Date().toISOString()
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Fetching data from FPL API endpoint: ${sanitizedEndpoint}`);

    // Construct the full URL with sanitized endpoint
    const url = `${FPL_BASE_URL}${sanitizedEndpoint}`;
    
    const response = await fetch(url, {
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
      // Log detailed error server-side
      console.error('FPL API error details:', {
        status: response.status,
        statusText: response.statusText,
        details: errorText,
        endpoint,
        timestamp: new Date().toISOString()
      });
      
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch data from FPL API'
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
    // Log full error details server-side only for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error in fpl-api-proxy:', {
      message: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString()
    });
    
    // Return generic error message to client without exposing internal details
    return new Response(
      JSON.stringify({ 
        error: 'Internal Server Error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});