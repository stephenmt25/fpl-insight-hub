import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PlayerGameweekData {
  gameweek: number;
  points: number;
  minutes: number;
  form: number;
  expectedGoals: number;
  expectedAssists: number;
  bps: number;
  bonus: number;
  goalsScored: number;
  assists: number;
}

interface FormTrendResult {
  playerId: number;
  playerName: string;
  teamName: string;
  position: string;
  currentForm: number;
  historicalForm: number[];
  gameweeks: number[];
  predictedForm: Array<{
    gameweek: number;
    predictedPoints: number;
    confidence: number;
  }>;
  trend: 'rising' | 'falling' | 'stable';
  trendStrength: number;
  volatility: number;
  momentum: number;
  reasoning: string[];
  overallConfidence: 'high' | 'medium' | 'low';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching current gameweek...');
    const { data: gameweekData } = await supabase
      .from('fploveralldata')
      .select('id')
      .eq('is_current', true)
      .single();

    let currentGameweek = gameweekData?.id || null;

    // Fallback: detect current gameweek from max gameweek in player history
    if (!currentGameweek) {
      const { data: maxGwData } = await supabase
        .from('player_gameweek_history')
        .select('gameweek')
        .order('gameweek', { ascending: false })
        .limit(1)
        .single();
      
      currentGameweek = maxGwData?.gameweek || 1;
      console.log(`Using fallback: detected current gameweek as ${currentGameweek}`);
    }
    const minGameweek = Math.max(1, currentGameweek - 5);
    console.log(`Current gameweek: ${currentGameweek}, analyzing from GW${minGameweek}`);

    // Fetch player gameweek history with detailed stats
    const { data: historyData, error: historyError } = await supabase
      .from('player_gameweek_history')
      .select('player_id, gameweek, points, minutes, form, expected_goals, expected_assists, bps, bonus, goals_scored, assists')
      .gte('gameweek', minGameweek)
      .order('player_id', { ascending: true })
      .order('gameweek', { ascending: true });

    if (historyError) throw historyError;

    // Fetch player details
    const { data: playerData, error: playerError } = await supabase
      .from('plplayerdata')
      .select('id, web_name, second_name, team, element_type, minutes, form')
      .gte('minutes', '90');

    if (playerError) throw playerError;

    // Fetch team names
    const { data: teamData } = await supabase
      .from('plteams')
      .select('id, name');

    const teamMap = new Map(teamData?.map(t => [t.id, t.name]) || []);
    const positionMap = ['', 'GKP', 'DEF', 'MID', 'FWD'];

    // Group history by player
    const playerHistory = new Map<number, PlayerGameweekData[]>();
    historyData?.forEach(record => {
      if (!playerHistory.has(record.player_id)) {
        playerHistory.set(record.player_id, []);
      }
      playerHistory.get(record.player_id)!.push({
        gameweek: record.gameweek,
        points: record.points || 0,
        minutes: record.minutes || 0,
        form: parseFloat(record.form || '0'),
        expectedGoals: parseFloat(record.expected_goals || '0'),
        expectedAssists: parseFloat(record.expected_assists || '0'),
        bps: record.bps || 0,
        bonus: record.bonus || 0,
        goalsScored: record.goals_scored || 0,
        assists: record.assists || 0
      });
    });

    console.log(`Analyzing ${playerHistory.size} players with sufficient history`);

    const predictions: FormTrendResult[] = [];

    for (const player of playerData || []) {
      const history = playerHistory.get(player.id);
      // Require at least 1 gameweek of data instead of 3
      if (!history || history.length < 1) continue;

      const result = analyzePlayerFormTrend(
        player.id,
        `${player.web_name}`,
        teamMap.get(player.team) || 'Unknown',
        positionMap[player.element_type] || 'Unknown',
        parseFloat(player.form || '0'),
        history,
        currentGameweek
      );

      predictions.push(result);
    }

    // Sort by trend strength and momentum
    predictions.sort((a, b) => {
      const scoreA = a.trendStrength * a.momentum;
      const scoreB = b.trendStrength * b.momentum;
      return scoreB - scoreA;
    });

    console.log(`Generated ${predictions.length} form trend predictions`);

    return new Response(JSON.stringify({ predictions: predictions.slice(0, 100) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error predicting form trends:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function analyzePlayerFormTrend(
  playerId: number,
  playerName: string,
  teamName: string,
  position: string,
  currentForm: number,
  history: PlayerGameweekData[],
  currentGameweek: number
): FormTrendResult {
  const points = history.map(h => h.points);
  const gameweeks = history.map(h => h.gameweek);
  const n = points.length;

  // For single gameweek, use simpler prediction
  if (n === 1) {
    const singlePoint = points[0];
    const predicted = Math.max(0, Math.min(20, singlePoint));
    
    return {
      playerId,
      playerName,
      teamName,
      position,
      currentForm,
      historicalForm: points,
      gameweeks,
      predictedForm: [
        { gameweek: currentGameweek + 1, predictedPoints: predicted, confidence: 0.3 },
        { gameweek: currentGameweek + 2, predictedPoints: predicted, confidence: 0.2 },
        { gameweek: currentGameweek + 3, predictedPoints: predicted, confidence: 0.1 }
      ],
      trend: 'stable',
      trendStrength: 0,
      volatility: 0,
      momentum: singlePoint,
      reasoning: ['⚠️ Limited data: Only 1 gameweek available', `Recent performance: ${singlePoint} points`],
      overallConfidence: 'low'
    };
  }

  // Calculate trend using linear regression
  const meanX = gameweeks.reduce((a, b) => a + b, 0) / n;
  const meanY = points.reduce((a, b) => a + b, 0) / n;
  
  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (gameweeks[i] - meanX) * (points[i] - meanY);
    denominator += (gameweeks[i] - meanX) ** 2;
  }
  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = meanY - slope * meanX;

  // Calculate volatility (standard deviation)
  const variance = points.reduce((sum, p) => sum + (p - meanY) ** 2, 0) / n;
  const volatility = Math.sqrt(variance);

  // Calculate momentum (weighted recent performance)
  const weights = points.map((_, i) => (i + 1) / n);
  const weightedSum = points.reduce((sum, p, i) => sum + p * weights[i], 0);
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const momentum = weightedSum / weightSum;

  // Exponential smoothing for predictions
  const alpha = 0.3;
  let smoothed = points[0];
  const smoothedValues = [smoothed];
  
  for (let i = 1; i < n; i++) {
    smoothed = alpha * points[i] + (1 - alpha) * smoothed;
    smoothedValues.push(smoothed);
  }

  // Predict next 3 gameweeks
  const predictedForm = [];
  for (let i = 1; i <= 3; i++) {
    const nextGameweek = currentGameweek + i;
    
    // Combine trend and momentum
    const trendPrediction = slope * nextGameweek + intercept;
    const momentumWeight = 0.4;
    const trendWeight = 0.6;
    
    let predicted = trendWeight * trendPrediction + momentumWeight * momentum;
    predicted = Math.max(0, Math.min(20, predicted));
    
    // Confidence decreases with distance
    const baseConfidence = Math.max(0, 1 - volatility / 10);
    const distanceDecay = 1 - (i - 1) * 0.2;
    const confidence = baseConfidence * distanceDecay;

    predictedForm.push({
      gameweek: nextGameweek,
      predictedPoints: Math.round(predicted * 10) / 10,
      confidence: Math.round(confidence * 100) / 100
    });
  }

  // Determine trend direction
  const trendStrength = Math.abs(slope);
  let trend: 'rising' | 'falling' | 'stable';
  if (slope > 0.3) trend = 'rising';
  else if (slope < -0.3) trend = 'falling';
  else trend = 'stable';

  // Generate reasoning
  const reasoning: string[] = [];
  
  if (trend === 'rising') {
    reasoning.push(`📈 Form trending upward (${slope.toFixed(2)} pts/GW)`);
  } else if (trend === 'falling') {
    reasoning.push(`📉 Form trending downward (${slope.toFixed(2)} pts/GW)`);
  } else {
    reasoning.push('➡️ Stable form with consistent output');
  }

  if (momentum > meanY + 1) {
    reasoning.push('🔥 Strong recent momentum');
  } else if (momentum < meanY - 1) {
    reasoning.push('❄️ Recent performance below average');
  }

  if (volatility > 3) {
    reasoning.push('⚠️ High volatility in returns');
  } else if (volatility < 1.5) {
    reasoning.push('✅ Consistent performance');
  }

  const avgPredicted = predictedForm.reduce((sum, p) => sum + p.predictedPoints, 0) / 3;
  if (avgPredicted > 6) {
    reasoning.push(`💎 Predicted ${avgPredicted.toFixed(1)} pts/GW avg`);
  } else if (avgPredicted < 3) {
    reasoning.push(`⚠️ Low expected output (${avgPredicted.toFixed(1)} pts/GW)`);
  }

  // Overall confidence
  let overallConfidence: 'high' | 'medium' | 'low';
  const avgConfidence = predictedForm.reduce((sum, p) => sum + p.confidence, 0) / 3;
  if (avgConfidence > 0.7 && volatility < 2.5) overallConfidence = 'high';
  else if (avgConfidence > 0.5 || volatility < 4) overallConfidence = 'medium';
  else overallConfidence = 'low';

  return {
    playerId,
    playerName,
    teamName,
    position,
    currentForm,
    historicalForm: points,
    gameweeks,
    predictedForm,
    trend,
    trendStrength: Math.round(trendStrength * 100) / 100,
    volatility: Math.round(volatility * 100) / 100,
    momentum: Math.round(momentum * 100) / 100,
    reasoning,
    overallConfidence
  };
}
