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
  transfers_made: number | null;
  points: number | null;
  can_enter: boolean | null;
  can_manage: boolean | null;
  released: boolean | null;
}

interface FPLPlayer {
  chance_of_playing_next_round: number | null
  chance_of_playing_this_round: number | null
  code: number
  cost_change_event: number
  cost_change_event_fall: number
  cost_change_start: number
  cost_change_start_fall: number
  dreamteam_count: number
  element_type: number
  ep_next: string
  ep_this: string
  event_points: number
  first_name: string
  form: string
  id: number
  in_dreamteam: boolean
  news: string
  news_added: string | null
  now_cost: number
  photo: string
  points_per_game: string
  second_name: string
  selected_by_percent: string
  special: boolean
  status: string
  team: number
  team_code: number
  total_points: number
  transfers_in: number
  transfers_in_event: number
  transfers_out: number
  transfers_out_event: number
  value_form: string
  value_season: string
  web_name: string
  minutes: number
  goals_scored: number
  assists: number
  clean_sheets: number
  goals_conceded: number
  own_goals: number
  penalties_saved: number
  penalties_missed: number
  yellow_cards: number
  red_cards: number
  saves: number
  bonus: number
  bps: number
  influence: string
  creativity: string
  threat: string
  ict_index: string
  starts: number
  expected_goals: string
  expected_assists: string
  expected_goal_involvements: string
  expected_goals_conceded: string
  influence_rank: number
  influence_rank_type: number
  creativity_rank: number
  creativity_rank_type: number
  threat_rank: number
  threat_rank_type: number
  ict_index_rank: number
  ict_index_rank_type: number
  corners_and_indirect_freekicks_order: number | null
  corners_and_indirect_freekicks_text: string | null
  direct_freekicks_order: number | null
  direct_freekicks_text: string | null
  penalties_order: number | null
  penalties_text: string | null
}

interface FPLResponse {
  events: FPLEvent[]
  elements: FPLPlayer[]
}

async function fetchFPLData(): Promise<FPLResponse> {
  const response = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/');
  if (!response.ok) {
    throw new Error(`Failed to fetch FPL data: ${response.statusText}`);
  }
  return response.json();
}

async function updateSupabaseGameweekData(supabase: any, event: FPLEvent) {
  console.log(`Processing gameweek ${event.id}`);
  console.log(`Is Current: ${event.is_current}, Is Previous: ${event.is_previous}, Is Next: ${event.is_next}`);

  const { data: existingData, error: fetchError } = await supabase
    .from('fploveralldata')
    .select('*')
    .eq('id', event.id)
    .maybeSingle();

  if (fetchError) {
    console.error('Error fetching existing data:', fetchError);
    return;
  }

  const boolToString = (value: boolean) => value ? 'true' : 'false';
  const numberToString = (value: number | null) => value?.toString() || null;

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
      is_previous: boolToString(event.is_previous),
      is_current: boolToString(event.is_current),
      is_next: boolToString(event.is_next),
      cup_leagues_created: boolToString(event.cup_leagues_created),
      h2h_ko_matches_created: boolToString(event.h2h_ko_matches_created),
      ranked_count: event.ranked_count,
      most_selected: event.most_selected,
      most_transferred_in: event.most_transferred_in,
      top_element: event.top_element,
      most_captained: event.most_captained,
      most_vice_captained: event.most_vice_captained,
      transfers_made: numberToString(event.transfers_made),
      points: event.points || null,
      can_enter: boolToString(event.can_enter),
      can_manage: boolToString(event.can_manage),
      released: event.released
    });

  if (upsertError) {
    console.error('Error updating gameweek data:', upsertError);
    throw upsertError;
  }

  console.log(`Successfully updated data for gameweek ${event.id}`);
}

async function updateSupabasePlayerData(supabase: any, player: FPLPlayer) {
  console.log(`Processing player ${player.id} (${player.web_name})`);

  const { error: upsertError } = await supabase
    .from('plplayerdata')
    .upsert({
      id: player.id,
      chance_of_playing_next_round: player.chance_of_playing_next_round?.toString(),
      chance_of_playing_this_round: player.chance_of_playing_this_round?.toString(),
      code: player.code,
      cost_change_event: player.cost_change_event.toString(),
      cost_change_event_fall: player.cost_change_event_fall.toString(),
      cost_change_start: player.cost_change_start,
      cost_change_start_fall: player.cost_change_start_fall,
      dreamteam_count: player.dreamteam_count.toString(),
      element_type: player.element_type,
      ep_next: player.ep_next,
      ep_this: player.ep_this,
      event_points: player.event_points.toString(),
      first_name: player.first_name,
      form: player.form,
      in_dreamteam: player.in_dreamteam,
      news: player.news,
      news_added: player.news_added,
      now_cost: player.now_cost,
      photo: player.photo,
      points_per_game: player.points_per_game,
      second_name: player.second_name,
      selected_by_percent: player.selected_by_percent,
      special: player.special,
      status: player.status,
      team: player.team,
      team_code: player.team_code,
      total_points: player.total_points.toString(),
      transfers_in: player.transfers_in,
      transfers_in_event: player.transfers_in_event.toString(),
      transfers_out: player.transfers_out,
      transfers_out_event: player.transfers_out_event,
      value_form: player.value_form,
      value_season: player.value_season,
      web_name: player.web_name,
      minutes: player.minutes.toString(),
      goals_scored: player.goals_scored.toString(),
      assists: player.assists.toString(),
      clean_sheets: player.clean_sheets.toString(),
      goals_conceded: player.goals_conceded.toString(),
      own_goals: player.own_goals.toString(),
      penalties_saved: player.penalties_saved.toString(),
      penalties_missed: player.penalties_missed.toString(),
      yellow_cards: player.yellow_cards.toString(),
      red_cards: player.red_cards.toString(),
      saves: player.saves.toString(),
      bonus: player.bonus.toString(),
      bps: player.bps.toString(),
      influence: player.influence,
      creativity: player.creativity,
      threat: player.threat,
      ict_index: player.ict_index,
      starts: player.starts.toString(),
      expected_goals: player.expected_goals,
      expected_assists: player.expected_assists,
      expected_goal_involvements: player.expected_goal_involvements,
      expected_goals_conceded: player.expected_goals_conceded,
      influence_rank: player.influence_rank,
      influence_rank_type: player.influence_rank_type,
      creativity_rank: player.creativity_rank,
      creativity_rank_type: player.creativity_rank_type,
      threat_rank: player.threat_rank,
      threat_rank_type: player.threat_rank_type,
      ict_index_rank: player.ict_index_rank,
      ict_index_rank_type: player.ict_index_rank_type,
      corners_and_indirect_freekicks_order: player.corners_and_indirect_freekicks_order?.toString(),
      corners_and_indirect_freekicks_text: player.corners_and_indirect_freekicks_text,
      direct_freekicks_order: player.direct_freekicks_order?.toString(),
      direct_freekicks_text: player.direct_freekicks_text,
      penalties_order: player.penalties_order?.toString(),
      penalties_text: player.penalties_text
    });

  if (upsertError) {
    console.error('Error updating player data:', upsertError);
    throw upsertError;
  }

  console.log(`Successfully updated data for player ${player.id} (${player.web_name})`);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching FPL data...');
    const fplData = await fetchFPLData();

    // Process gameweek data
    console.log('Processing gameweek data...');
    for (const event of fplData.events) {
      await updateSupabaseGameweekData(supabase, event);
    }

    // Process player data
    console.log('Processing player data...');
    for (const player of fplData.elements) {
      await updateSupabasePlayerData(supabase, player);
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
