-- Enable Row Level Security on all FPL data tables
ALTER TABLE public.fploveralldata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plplayerdata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plteams ENABLE ROW LEVEL SECURITY;

-- Create policies for fploveralldata (public read-only access)
CREATE POLICY "Allow public read access to FPL overall data"
ON public.fploveralldata
FOR SELECT
TO public
USING (true);

CREATE POLICY "Restrict write access to service role only - fploveralldata"
ON public.fploveralldata
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create policies for plplayerdata (public read-only access)
CREATE POLICY "Allow public read access to player data"
ON public.plplayerdata
FOR SELECT
TO public
USING (true);

CREATE POLICY "Restrict write access to service role only - plplayerdata"
ON public.plplayerdata
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create policies for plteams (public read-only access)
CREATE POLICY "Allow public read access to teams data"
ON public.plteams
FOR SELECT
TO public
USING (true);

CREATE POLICY "Restrict write access to service role only - plteams"
ON public.plteams
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);