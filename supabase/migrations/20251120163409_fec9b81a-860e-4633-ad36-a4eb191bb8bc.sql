-- Add unique constraint on player_gameweek_history to allow upserts
-- This ensures we can generate historical data without duplicates

-- First, check if there are any existing duplicates and remove them
DELETE FROM player_gameweek_history a
USING player_gameweek_history b
WHERE a.id > b.id
  AND a.player_id = b.player_id
  AND a.gameweek = b.gameweek;

-- Add unique constraint
ALTER TABLE player_gameweek_history 
ADD CONSTRAINT player_gameweek_history_player_gameweek_unique 
UNIQUE (player_id, gameweek);

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_player_gameweek_history_lookup 
ON player_gameweek_history(player_id, gameweek);