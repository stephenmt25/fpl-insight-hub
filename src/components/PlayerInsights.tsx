import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTeamsContext } from "@/context/teams-context";
import { getPositionLabel } from "@/utils/player-utils";
import { Skeleton } from "@/components/ui/skeleton";

export function PlayerInsights() {
  const { data: teams } = useTeamsContext();

  const { data: players, isLoading, error } = useQuery({
    queryKey: ['topPlayers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plplayerdata')
        .select('id, web_name, element_type, team, total_points, selected_by_percent, form, ep_next')
        .order('total_points', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const getTrendIcon = (form: string | null) => {
    const formVal = parseFloat(form || '0');
    if (formVal >= 5) return <ArrowUp className="h-4 w-4 text-green-500" />;
    if (formVal <= 2) return <ArrowDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Top Performing Players</h2>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (error || !players) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Top Performing Players</h2>
        <p className="text-muted-foreground">Unable to load player data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Top Performing Players</h2>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Player</TableHead>
              <TableHead>Position</TableHead>
              <TableHead className="text-right">Points</TableHead>
              <TableHead className="text-right">Ownership %</TableHead>
              <TableHead className="text-right">Predicted</TableHead>
              <TableHead className="text-right">Trend</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {players.map((player) => (
              <TableRow key={player.id}>
                <TableCell className="font-medium">
                  {player.web_name}
                  {teams && (
                    <span className="text-muted-foreground ml-2 text-xs">
                      ({teams.find(t => t.id === player.team)?.short_name || '?'})
                    </span>
                  )}
                </TableCell>
                <TableCell>{getPositionLabel(player.element_type)}</TableCell>
                <TableCell className="text-right">{player.total_points}</TableCell>
                <TableCell className="text-right">{player.selected_by_percent}%</TableCell>
                <TableCell className="text-right">
                  {player.ep_next || '-'}
                </TableCell>
                <TableCell className="text-right">
                  {getTrendIcon(player.form)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
