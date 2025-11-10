import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FPL_BASE_URL = 'https://fantasy.premierleague.com/api';

interface PlayerData {
  id: number;
  now_cost: number;
  transfers_in: number;
  transfers_out: number;
  selected_by_percent: string;
  form: string;
}

interface BootstrapResponse {
  elements: PlayerData[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting price change sync');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch current player data from FPL API
    const bootstrapUrl = `${FPL_BASE_URL}/bootstrap-static/`;
    console.log(`Fetching player data from: ${bootstrapUrl}`);
    
    const response = await fetch(bootstrapUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch bootstrap data: ${response.statusText}`);
    }
    const data: BootstrapResponse = await response.json();

    console.log(`Processing ${data.elements.length} players`);

    const today = new Date().toISOString().split('T')[0];

    // Get yesterday's prices to detect changes
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const { data: yesterdayPrices, error: fetchError } = await supabase
      .from('price_change_history')
      .select('player_id, new_price, transfers_in_24h, transfers_out_24h')
      .eq('date', yesterdayStr);

    if (fetchError) {
      console.log('No previous price data found, will record all as new');
    }

    // Create map of yesterday's prices
    const priceMap = new Map();
    if (yesterdayPrices) {
      yesterdayPrices.forEach(record => {
        priceMap.set(record.player_id, {
          price: record.new_price,
          transfersIn: record.transfers_in_24h || 0,
          transfersOut: record.transfers_out_24h || 0,
        });
      });
    }

    // Prepare records for today
    const priceRecords = [];
    let changesDetected = 0;

    for (const player of data.elements) {
      const currentPrice = player.now_cost;
      const yesterday = priceMap.get(player.id);
      
      const oldPrice = yesterday ? yesterday.price : currentPrice;
      const priceChanged = currentPrice !== oldPrice;

      // Calculate 24h transfer delta
      const transfersIn24h = yesterday 
        ? player.transfers_in - yesterday.transfersIn 
        : player.transfers_in;
      const transfersOut24h = yesterday 
        ? player.transfers_out - yesterday.transfersOut 
        : player.transfers_out;

      if (priceChanged) {
        changesDetected++;
        console.log(`Price change detected for player ${player.id}: ${oldPrice} -> ${currentPrice}`);
      }

      priceRecords.push({
        player_id: player.id,
        date: today,
        old_price: oldPrice,
        new_price: currentPrice,
        transfers_in_24h: transfersIn24h,
        transfers_out_24h: transfersOut24h,
        ownership_percent: parseFloat(player.selected_by_percent),
        form: parseFloat(player.form),
      });
    }

    // Batch upsert to database
    const { error: upsertError } = await supabase
      .from('price_change_history')
      .upsert(priceRecords, { 
        onConflict: 'player_id,date',
        ignoreDuplicates: false 
      });

    if (upsertError) {
      console.error('Database error:', upsertError);
      throw upsertError;
    }

    console.log(`Successfully synced ${priceRecords.length} player prices. ${changesDetected} price changes detected.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        date: today,
        recordsProcessed: priceRecords.length,
        priceChanges: changesDetected,
        message: `Price changes synced successfully`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error syncing price changes:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to sync price changes',
        message: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
