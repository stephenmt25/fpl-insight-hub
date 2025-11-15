import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FPL_BASE_URL = 'https://fantasy.premierleague.com/api';

interface FPLFixture {
  id: number;
  event: number;
  team_h: number;
  team_a: number;
  kickoff_time: string;
  team_h_difficulty: number;
  team_a_difficulty: number;
  finished: boolean;
}

interface FPLTeam {
  id: number;
  strength_attack_home: number;
  strength_attack_away: number;
  strength_defence_home: number;
  strength_defence_away: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { gameweek } = await req.json();

    if (!gameweek) {
      throw new Error('Gameweek parameter is required');
    }

    console.log(`Syncing upcoming fixtures for GW${gameweek}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch fixtures for the specified gameweek
    const fixturesUrl = `${FPL_BASE_URL}/fixtures/?event=${gameweek}`;
    console.log(`Fetching fixtures from: ${fixturesUrl}`);
    
    const fixturesResponse = await fetch(fixturesUrl);
    if (!fixturesResponse.ok) {
      throw new Error(`Failed to fetch fixtures: ${fixturesResponse.statusText}`);
    }
    const fixtures: FPLFixture[] = await fixturesResponse.json();

    // Fetch team strength data from our database (already synced)
    const { data: teams, error: teamsError } = await supabase
      .from('plteams')
      .select('id, strength_attack_home, strength_attack_away, strength_defence_home, strength_defence_away');

    if (teamsError) {
      console.error('Failed to fetch team data:', teamsError);
      throw teamsError;
    }

    // Create team lookup map
    const teamMap = new Map<number, FPLTeam>();
    teams.forEach(team => {
      teamMap.set(team.id, team);
    });

    console.log(`Processing ${fixtures.length} fixtures`);

    // Prepare enriched fixture records
    const fixtureRecords = [];

    for (const fixture of fixtures) {
      if (fixture.finished) {
        console.log(`Skipping finished fixture ${fixture.id}`);
        continue;
      }

      const homeTeam = teamMap.get(fixture.team_h);
      const awayTeam = teamMap.get(fixture.team_a);

      if (!homeTeam || !awayTeam) {
        console.log(`Missing team data for fixture ${fixture.id}, skipping`);
        continue;
      }

      fixtureRecords.push({
        fixture_id: fixture.id,
        gameweek: fixture.event,
        home_team_id: fixture.team_h,
        away_team_id: fixture.team_a,
        kickoff_time: fixture.kickoff_time,
        home_difficulty: fixture.team_h_difficulty,
        away_difficulty: fixture.team_a_difficulty,
        home_attack_strength: homeTeam.strength_attack_home,
        home_defense_strength: homeTeam.strength_defence_home,
        away_attack_strength: awayTeam.strength_attack_away,
        away_defense_strength: awayTeam.strength_defence_away,
      });
    }

    // Batch upsert to database
    const { error: upsertError } = await supabase
      .from('upcoming_fixtures_enriched')
      .upsert(fixtureRecords, { 
        onConflict: 'fixture_id',
        ignoreDuplicates: false 
      });

    if (upsertError) {
      console.error('Database error:', upsertError);
      throw upsertError;
    }

    console.log(`Successfully synced ${fixtureRecords.length} enriched fixtures for GW${gameweek}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        gameweek,
        recordsProcessed: fixtureRecords.length,
        message: `Fixtures for GW${gameweek} synced successfully`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error syncing upcoming fixtures:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: 'Failed to sync upcoming fixtures',
        message: errorMessage 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
