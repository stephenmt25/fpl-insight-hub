import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

export default function Index() {
  const { data: overallData } = useQuery({
    queryKey: ['overall-data'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fploveralldata')
        .select('*')
        .order('id', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const currentGameweek = overallData?.find(gw => gw.is_current === 'true');
  const nextGameweek = overallData?.find(gw => gw.is_next === 'true');
  const previousGameweek = overallData?.find(gw => gw.is_previous === 'true');

  return (
    <div>
      <h1>Fantasy Premier League Overview</h1>
      <div>
        <h2>Current Gameweek: {currentGameweek?.id}</h2>
        <h2>Next Gameweek: {nextGameweek?.id}</h2>
        <h2>Previous Gameweek: {previousGameweek?.id}</h2>
      </div>
    </div>
  );
}
