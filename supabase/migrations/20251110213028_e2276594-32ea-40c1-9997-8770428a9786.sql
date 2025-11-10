-- Create player_gameweek_history table
CREATE TABLE IF NOT EXISTS public.player_gameweek_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id BIGINT NOT NULL,
  gameweek INTEGER NOT NULL,
  points INTEGER,
  minutes INTEGER,
  goals_scored INTEGER,
  assists INTEGER,
  bonus INTEGER,
  bps INTEGER,
  expected_goals NUMERIC,
  expected_assists NUMERIC,
  opponent_team INTEGER,
  was_home BOOLEAN,
  fixture_difficulty INTEGER,
  form NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(player_id, gameweek)
);

-- Create price_change_history table
CREATE TABLE IF NOT EXISTS public.price_change_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id BIGINT NOT NULL,
  date DATE NOT NULL,
  old_price INTEGER NOT NULL,
  new_price INTEGER NOT NULL,
  transfers_in_24h BIGINT,
  transfers_out_24h BIGINT,
  ownership_percent NUMERIC,
  form NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(player_id, date)
);

-- Create upcoming_fixtures_enriched table
CREATE TABLE IF NOT EXISTS public.upcoming_fixtures_enriched (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id BIGINT NOT NULL,
  gameweek INTEGER NOT NULL,
  home_team_id INTEGER NOT NULL,
  away_team_id INTEGER NOT NULL,
  kickoff_time TIMESTAMP WITH TIME ZONE,
  home_difficulty INTEGER,
  away_difficulty INTEGER,
  home_attack_strength INTEGER,
  home_defense_strength INTEGER,
  away_attack_strength INTEGER,
  away_defense_strength INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(fixture_id)
);

-- Enable Row Level Security
ALTER TABLE public.player_gameweek_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_change_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upcoming_fixtures_enriched ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public read access
CREATE POLICY "Allow public read access to player gameweek history"
  ON public.player_gameweek_history
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to price change history"
  ON public.price_change_history
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to upcoming fixtures enriched"
  ON public.upcoming_fixtures_enriched
  FOR SELECT
  USING (true);

-- Create RLS policies to restrict write access to service role
CREATE POLICY "Restrict write access to service role - player_gameweek_history"
  ON public.player_gameweek_history
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Restrict write access to service role - price_change_history"
  ON public.price_change_history
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Restrict write access to service role - upcoming_fixtures_enriched"
  ON public.upcoming_fixtures_enriched
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_player_gameweek_history_player_id ON public.player_gameweek_history(player_id);
CREATE INDEX IF NOT EXISTS idx_player_gameweek_history_gameweek ON public.player_gameweek_history(gameweek);
CREATE INDEX IF NOT EXISTS idx_price_change_history_player_id ON public.price_change_history(player_id);
CREATE INDEX IF NOT EXISTS idx_price_change_history_date ON public.price_change_history(date);
CREATE INDEX IF NOT EXISTS idx_upcoming_fixtures_gameweek ON public.upcoming_fixtures_enriched(gameweek);