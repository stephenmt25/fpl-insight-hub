import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FPLEvent {
  id: number
  name: string
  deadline_time: string
  average_entry_score: number
  finished: boolean
  data_checked: boolean
  highest_scoring_entry: number
  deadline_time_epoch: number
  highest_score: number
  is_previous: boolean
  is_current: boolean
  is_next: boolean
  cup_leagues_created: boolean
  h2h_ko_matches_created: boolean
  ranked_count: number
  most_selected: number
  most_transferred_in: number
  top_element: number
  most_captained: number
  most_vice_captained: number
}

interface FPLResponse {
  events: FPLEvent[]
}

async function fetchFPLData(): Promise<FPLResponse> {
  const response = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/');
  if (!response.ok) {
    throw new Error(`Failed to fetch FPL data: ${response.statusText}`);
  }
  return response.json();
}

async function updateSupabaseData(supabase: any, event: FPLEvent) {
  const { data: existingData, error: fetchError } = await supabase
    .from('fploveralldata')
    .select('*')
    .eq('id', event.id)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('Error fetching existing data:', fetchError);
    return;
  }

  // If data exists and hasn't changed, skip update
  if (existingData && 
      existingData.average_entry_score === event.average_entry_score &&
      existingData.highest_score === event.highest_score) {
    console.log(`No changes detected for gameweek ${event.id}, skipping update`);
    return;
  }

  const { error: upsertError } = await supabase
    .from('fploveralldata')
    .upsert({
      id: event.id,
      name: `Gameweek ${event.id}`,
      deadline_time: event.deadline_time,
      average_entry_score: event.average_entry_score,
      finished: event.finished,
      data_checked: event.data_checked,
      highest_scoring_entry: event.highest_scoring_entry,
      deadline_time_epoch: event.deadline_time_epoch,
      highest_score: event.highest_score,
      is_previous: event.is_previous.toString(),
      is_current: event.is_current.toString(),
      is_next: event.is_next.toString(),
      cup_leagues_created: event.cup_leagues_created.toString(),
      h2h_ko_matches_created: event.h2h_ko_matches_created.toString(),
      ranked_count: event.ranked_count,
      most_selected: event.most_selected,
      most_transferred_in: event.most_transferred_in,
      top_element: event.top_element,
      most_captained: event.most_captained,
      most_vice_captained: event.most_vice_captained
    });

  if (upsertError) {
    console.error('Error updating data:', upsertError);
    throw upsertError;
  }

  console.log(`Successfully updated data for gameweek ${event.id}`);
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch FPL data
    console.log('Fetching FPL data...');
    const fplData = await fetchFPLData();

    // Process each event/gameweek
    for (const event of fplData.events) {
      await updateSupabaseData(supabase, event);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in sync-fpl-data function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});