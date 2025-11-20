import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PlayerData {
  id: number;
  element_type: number;
  form: string;
  total_points: string;
  minutes: string;
  goals_scored: string;
  assists: string;
  clean_sheets: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching player data...');
    const { data: players, error: playerError } = await supabase
      .from('plplayerdata')
      .select('id, element_type, form, total_points, minutes, goals_scored, assists, clean_sheets')
      .gte('minutes', '90'); // Only players with some playtime

    if (playerError) throw playerError;

    console.log(`Generating historical data for ${players?.length || 0} players...`);

    const historicalRecords = [];
    const currentGameweek = 11; // We have GW11 data, so generate for GW1-10

    for (const player of players || []) {
      const records = generatePlayerHistory(player, currentGameweek);
      historicalRecords.push(...records);
    }

    console.log(`Inserting ${historicalRecords.length} historical records...`);

    // Insert in batches to avoid timeout
    const batchSize = 1000;
    let inserted = 0;
    
    for (let i = 0; i < historicalRecords.length; i += batchSize) {
      const batch = historicalRecords.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from('player_gameweek_history')
        .upsert(batch, { 
          onConflict: 'player_id,gameweek',
          ignoreDuplicates: false 
        });

      if (insertError) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, insertError);
        throw insertError;
      }
      
      inserted += batch.length;
      console.log(`Inserted batch ${i / batchSize + 1}: ${inserted} / ${historicalRecords.length} records`);
    }

    console.log('Successfully generated historical form data');

    return new Response(
      JSON.stringify({ 
        success: true, 
        recordsGenerated: historicalRecords.length,
        playersProcessed: players?.length || 0,
        gameweeks: '1-10'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating historical form:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generatePlayerHistory(player: PlayerData, currentGw: number): any[] {
  const records = [];
  const position = player.element_type; // 1=GKP, 2=DEF, 3=MID, 4=FWD
  const currentForm = parseFloat(player.form || '3');
  const totalPoints = parseFloat(player.total_points || '0');
  const totalMinutes = parseFloat(player.minutes || '0');
  
  // Calculate average points per gameweek from current season
  const avgPoints = totalPoints / Math.max(currentGw, 1);
  
  // Position-based point ranges and patterns
  const positionProfiles = {
    1: { min: 1, max: 8, variance: 2, cleanSheetBonus: 0.6 },  // GKP
    2: { min: 1, max: 10, variance: 2.5, cleanSheetBonus: 0.5 }, // DEF
    3: { min: 1, max: 12, variance: 3, cleanSheetBonus: 0.2 },   // MID
    4: { min: 1, max: 15, variance: 3.5, cleanSheetBonus: 0.1 }  // FWD
  };

  const profile = positionProfiles[position as keyof typeof positionProfiles] || positionProfiles[3];
  
  // Generate trend: declining, stable, or improving
  // Base it on current form vs average
  const trendDirection = currentForm > avgPoints + 1 ? 'improving' : 
                        currentForm < avgPoints - 1 ? 'declining' : 'stable';
  
  const trendFactor = trendDirection === 'improving' ? 0.15 : 
                      trendDirection === 'declining' ? -0.15 : 0;

  // Generate data for gameweeks 1-10
  for (let gw = 1; gw <= 10; gw++) {
    // Base points from average with trend
    const trendMultiplier = 1 + (trendFactor * (gw / 10));
    let points = avgPoints * trendMultiplier;
    
    // Add random variance
    const variance = (Math.random() - 0.5) * profile.variance;
    points = Math.max(profile.min, Math.min(profile.max, points + variance));
    
    // Round to integer
    points = Math.round(points);
    
    // Generate minutes (simulate rotation/injuries)
    const minutesPlayed = Math.random() > 0.2 ? 
      Math.round(60 + Math.random() * 30) : // Usually plays 60-90 mins
      Math.random() > 0.5 ? Math.round(Math.random() * 30) : 0; // Sometimes subbed or doesn't play
    
    // Calculate expected goals and assists based on position and points
    const xG = position >= 3 ? (points * 0.15 + Math.random() * 0.3) : (points * 0.05 + Math.random() * 0.1);
    const xA = position >= 3 ? (points * 0.1 + Math.random() * 0.25) : (points * 0.03 + Math.random() * 0.1);
    
    // BPS (Bonus Point System) - correlates with points
    const bps = Math.round(points * 8 + Math.random() * 20);
    
    // Actual bonus points (0-3, weighted towards 0)
    const bonus = Math.random() > 0.7 ? (Math.random() > 0.5 ? (Math.random() > 0.7 ? 3 : 2) : 1) : 0;
    
    // Goals and assists based on position
    let goals = 0;
    let assists = 0;
    
    if (position === 4) { // FWD
      goals = points > 8 ? Math.floor(Math.random() * 2 + 1) : (points > 5 ? Math.floor(Math.random() * 2) : 0);
      assists = Math.random() > 0.7 ? 1 : 0;
    } else if (position === 3) { // MID
      goals = points > 7 ? Math.floor(Math.random() * 2) : 0;
      assists = points > 6 ? Math.floor(Math.random() * 2) : 0;
    } else if (position === 2) { // DEF
      goals = points > 8 ? 1 : 0;
      assists = Math.random() > 0.8 ? 1 : 0;
    }
    
    // Calculate form (rolling average simulation)
    const formValue = points * 0.7 + (Math.random() - 0.5);
    
    // Random opponent team (1-20)
    const opponentTeam = Math.floor(Math.random() * 20) + 1;
    
    // Random fixture difficulty (1-5)
    const fixtureDifficulty = Math.floor(Math.random() * 5) + 1;
    
    // Random home/away
    const wasHome = Math.random() > 0.5;

    records.push({
      player_id: player.id,
      gameweek: gw,
      points: minutesPlayed > 0 ? points : 0,
      minutes: minutesPlayed,
      form: parseFloat(formValue.toFixed(1)),
      expected_goals: parseFloat(xG.toFixed(2)),
      expected_assists: parseFloat(xA.toFixed(2)),
      bps: minutesPlayed > 0 ? bps : 0,
      bonus: minutesPlayed > 0 ? bonus : 0,
      goals_scored: minutesPlayed > 0 ? goals : 0,
      assists: minutesPlayed > 0 ? assists : 0,
      was_home: wasHome,
      opponent_team: opponentTeam,
      fixture_difficulty: fixtureDifficulty
    });
  }

  return records;
}
