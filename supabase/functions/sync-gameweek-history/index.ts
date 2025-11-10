import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FPL_BASE_URL = 'https://fantasy.premierleague.com/api';

interface FPLLiveElement {
  id: number;
  stats: {
    total_points: number;
    minutes: number;
    goals_scored: number;
    assists: number;
    bonus: number;
    bps: number;
  };
  explain: Array<{
    fixture: number;
    stats: Array<{
      identifier: string;
      points: number;
      value: number;
    }>;
  }>;
}

interface FPLLiveResponse {
  elements: FPLLiveElement[];
}

interface FPLFixture {
  id: number;
  team_h: number;
  team_a: number;
  team_h_difficulty: number;
  team_a_difficulty: number;
  event: number;
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

    console.log(`Syncing gameweek history for GW${gameweek}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch live gameweek data from FPL API
    const liveUrl = `${FPL_BASE_URL}/event/${gameweek}/live/`;
    console.log(`Fetching live data from: ${liveUrl}`);
    
    const liveResponse = await fetch(liveUrl);
    if (!liveResponse.ok) {
      throw new Error(`Failed to fetch live data: ${liveResponse.statusText}`);
    }
    const liveData: FPLLiveResponse = await liveResponse.json();

    // Fetch fixtures to get opponent and difficulty data
    const fixturesUrl = `${FPL_BASE_URL}/fixtures/?event=${gameweek}`;
    console.log(`Fetching fixtures from: ${fixturesUrl}`);
    
    const fixturesResponse = await fetch(fixturesUrl);
    if (!fixturesResponse.ok) {
      throw new Error(`Failed to fetch fixtures: ${fixturesResponse.statusText}`);
    }
    const fixtures: FPLFixture[] = await fixturesResponse.json();

    // Create fixture lookup map
    const fixtureMap = new Map<number, FPLFixture>();
    fixtures.forEach(f => fixtureMap.set(f.id, f));

    // Fetch current player data for form and xG/xA
    const bootstrapUrl = `${FPL_BASE_URL}/bootstrap-static/`;
    const bootstrapResponse = await fetch(bootstrapUrl);
    if (!bootstrapResponse.ok) {
      throw new Error(`Failed to fetch bootstrap data: ${bootstrapResponse.statusText}`);
    }
    const bootstrapData = await bootstrapResponse.json();
    
    const playerMap = new Map();
    bootstrapData.elements.forEach((p: any) => {
      playerMap.set(p.id, {
        form: parseFloat(p.form) || 0,
        expected_goals: parseFloat(p.expected_goals) || 0,
        expected_assists: parseFloat(p.expected_assists) || 0,
      });
    });

    console.log(`Processing ${liveData.elements.length} players`);

    // Prepare batch insert data
    const historyRecords = [];

    for (const element of liveData.elements) {
      const playerId = element.id;
      const stats = element.stats;
      
      // Get fixture info if available
      let opponentTeam = null;
      let wasHome = null;
      let fixtureDifficulty = null;

      if (element.explain && element.explain.length > 0) {
        const fixtureId = element.explain[0].fixture;
        const fixture = fixtureMap.get(fixtureId);
        
        if (fixture) {
          // Determine if player was home or away
          const playerData = bootstrapData.elements.find((p: any) => p.id === playerId);
          if (playerData) {
            const playerTeam = playerData.team;
            wasHome = fixture.team_h === playerTeam;
            opponentTeam = wasHome ? fixture.team_a : fixture.team_h;
            fixtureDifficulty = wasHome ? fixture.team_h_difficulty : fixture.team_a_difficulty;
          }
        }
      }

      const playerInfo = playerMap.get(playerId);

      historyRecords.push({
        player_id: playerId,
        gameweek: gameweek,
        points: stats.total_points,
        minutes: stats.minutes,
        goals_scored: stats.goals_scored,
        assists: stats.assists,
        bonus: stats.bonus,
        bps: stats.bps,
        expected_goals: playerInfo?.expected_goals || null,
        expected_assists: playerInfo?.expected_assists || null,
        opponent_team: opponentTeam,
        was_home: wasHome,
        fixture_difficulty: fixtureDifficulty,
        form: playerInfo?.form || null,
      });
    }

    // Batch upsert to database
    const { data, error } = await supabase
      .from('player_gameweek_history')
      .upsert(historyRecords, { 
        onConflict: 'player_id,gameweek',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    console.log(`Successfully synced ${historyRecords.length} player records for GW${gameweek}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        gameweek,
        recordsProcessed: historyRecords.length,
        message: `Gameweek ${gameweek} history synced successfully`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error syncing gameweek history:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to sync gameweek history',
        message: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
