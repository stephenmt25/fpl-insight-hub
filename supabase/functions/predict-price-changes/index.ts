import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PriceChangePrediction {
  playerId: number;
  playerName: string;
  teamName: string;
  position: string;
  currentPrice: number;
  priceChangeDirection: 'rise' | 'fall' | 'stable';
  probability: number;
  transfersIn24h: number;
  transfersOut24h: number;
  transferDelta: number;
  ownership: number;
  form: number;
  reasoning: string[];
  expectedChangeDate: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Calculate price change probability based on FPL price change algorithm
 * Formula considers: net transfers, ownership %, form, and price
 */
function calculatePriceChangeProbability(
  transfersIn: number,
  transfersOut: number,
  ownership: number,
  form: number,
  currentPrice: number,
  gameweek: number
): { direction: 'rise' | 'fall' | 'stable'; probability: number; reasoning: string[] } {
  const netTransfers = transfersIn - transfersOut;
  const reasoning: string[] = [];
  
  // FPL price change threshold approximation
  // Players need ~net transfers of roughly (ownership% * total_players * 0.01) to change
  // Simplified: threshold increases with ownership
  const baseThreshold = 50 + (ownership * 20); // Higher ownership = harder to change
  
  // Early season has more volatility
  const seasonMultiplier = gameweek < 10 ? 1.3 : 1.0;
  const adjustedThreshold = baseThreshold / seasonMultiplier;
  
  let direction: 'rise' | 'fall' | 'stable' = 'stable';
  let probability = 0;
  
  // Calculate rise probability
  if (netTransfers > 0) {
    direction = 'rise';
    const rawProbability = (netTransfers / adjustedThreshold) * 100;
    
    // Boost probability based on form
    const formBoost = form > 5 ? 1.2 : form > 3 ? 1.1 : 1.0;
    probability = Math.min(95, rawProbability * formBoost);
    
    if (netTransfers > adjustedThreshold * 0.8) reasoning.push('High net transfers in');
    if (form > 5) reasoning.push('Excellent form');
    if (ownership < 10) reasoning.push('Low ownership makes price change easier');
    if (gameweek < 10) reasoning.push('Early season volatility');
  }
  // Calculate fall probability
  else if (netTransfers < 0) {
    direction = 'fall';
    const rawProbability = (Math.abs(netTransfers) / adjustedThreshold) * 100;
    
    // Injuries or poor form accelerate falls
    const formPenalty = form < 2 ? 1.3 : form < 3 ? 1.15 : 1.0;
    probability = Math.min(95, rawProbability * formPenalty);
    
    if (Math.abs(netTransfers) > adjustedThreshold * 0.8) reasoning.push('High net transfers out');
    if (form < 3) reasoning.push('Poor form');
    if (ownership > 30) reasoning.push('High ownership makes fall more likely');
  }
  // Stable
  else {
    probability = 5; // Very low chance of change
    reasoning.push('No significant transfer activity');
  }
  
  return { direction, probability, reasoning };
}

/**
 * Estimate when price change might occur (rough estimation)
 */
function estimateChangeDate(probability: number): string {
  const now = new Date();
  
  if (probability > 80) {
    now.setDate(now.getDate() + 1); // Tomorrow
    return now.toISOString().split('T')[0];
  } else if (probability > 60) {
    now.setDate(now.getDate() + 2); // 2 days
    return now.toISOString().split('T')[0];
  } else if (probability > 40) {
    now.setDate(now.getDate() + 3); // 3 days
    return now.toISOString().split('T')[0];
  } else {
    return 'Unlikely in next 3 days';
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching player data for price change predictions...');

    // Fetch current player data
    const { data: players, error: playersError } = await supabase
      .from('plplayerdata')
      .select('id, web_name, team, element_type, now_cost, transfers_in, transfers_out, selected_by_percent, form')
      .not('form', 'is', null)
      .neq('element_type', 5); // Exclude unassigned players

    if (playersError) {
      console.error('Error fetching players:', playersError);
      throw playersError;
    }

    // Fetch team data for names
    const { data: teams, error: teamsError } = await supabase
      .from('plteams')
      .select('id, short_name');

    if (teamsError) {
      console.error('Error fetching teams:', teamsError);
      throw teamsError;
    }

    const teamMap = (teams || []).reduce(
      (map, team) => ({ ...map, [team.id]: team.short_name }),
      {} as Record<number, string>
    );

    // Get current gameweek from fploveralldata
    const { data: gwData, error: gwError } = await supabase
      .from('fploveralldata')
      .select('id, is_current')
      .eq('is_current', 'True')
      .single();

    const currentGameweek = gwData?.id || 20; // Default to mid-season if not found

    console.log(`Current gameweek: ${currentGameweek}`);

    // Get historical price changes (last 7 days) to improve predictions
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: recentChanges, error: changesError } = await supabase
      .from('price_change_history')
      .select('player_id, date, old_price, new_price')
      .gte('date', sevenDaysAgo.toISOString().split('T')[0]);

    const recentChangesMap = new Map<number, any[]>();
    (recentChanges || []).forEach(change => {
      if (!recentChangesMap.has(change.player_id)) {
        recentChangesMap.set(change.player_id, []);
      }
      recentChangesMap.get(change.player_id)!.push(change);
    });

    // Position names mapping
    const positionNames: Record<number, string> = {
      1: 'GK',
      2: 'DEF',
      3: 'MID',
      4: 'FWD'
    };

    // Calculate predictions for all players
    const predictions: PriceChangePrediction[] = players
      .map(player => {
        const transfersIn = player.transfers_in || 0;
        const transfersOut = player.transfers_out || 0;
        const ownership = parseFloat(player.selected_by_percent || '0');
        const form = parseFloat(player.form || '0');
        const currentPrice = player.now_cost / 10; // Convert from 0.1m units to millions

        const { direction, probability, reasoning } = calculatePriceChangeProbability(
          transfersIn,
          transfersOut,
          ownership,
          form,
          currentPrice,
          currentGameweek
        );

        // Add historical context if available
        const playerHistory = recentChangesMap.get(player.id);
        if (playerHistory && playerHistory.length > 0) {
          const recentChange = playerHistory[playerHistory.length - 1];
          const daysSinceChange = Math.floor(
            (Date.now() - new Date(recentChange.date).getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysSinceChange < 3) {
            reasoning.push(`Changed ${daysSinceChange} day(s) ago`);
          }
        }

        // Determine confidence level
        let confidence: 'high' | 'medium' | 'low' = 'low';
        if (probability > 70) confidence = 'high';
        else if (probability > 50) confidence = 'medium';

        return {
          playerId: player.id,
          playerName: player.web_name,
          teamName: teamMap[player.team] || 'Unknown',
          position: positionNames[player.element_type] || 'Unknown',
          currentPrice,
          priceChangeDirection: direction,
          probability: Math.round(probability),
          transfersIn24h: transfersIn,
          transfersOut24h: transfersOut,
          transferDelta: transfersIn - transfersOut,
          ownership,
          form,
          reasoning,
          expectedChangeDate: estimateChangeDate(probability),
          confidence
        };
      })
      .filter(p => p.probability > 30) // Only show predictions with >30% probability
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 50); // Top 50 predictions

    console.log(`Generated ${predictions.length} price change predictions`);

    return new Response(
      JSON.stringify({ 
        predictions,
        generatedAt: new Date().toISOString(),
        gameweek: currentGameweek
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=21600' // Cache for 6 hours
        } 
      }
    );

  } catch (error) {
    console.error('Error in predict-price-changes:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        predictions: []
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
