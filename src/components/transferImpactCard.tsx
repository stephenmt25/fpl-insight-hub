import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTeamsContext } from "@/context/teams-context";
import { supabase } from "@/integrations/supabase/client";
import { playerService } from "@/services/fpl-api";
import { ManagerTransfers } from "@/types/fpl";
import { useQuery } from "@tanstack/react-query";

interface TransferImpactCardProps {
  transfers: ManagerTransfers[];
  gameweek: number;
}

export function TransferImpactCard({ transfers, gameweek }: TransferImpactCardProps) {
  const { data: gwPlayerStats } = useQuery({
    queryKey: ['gwPlayerStats', gameweek],
    queryFn: () => playerService.getGameweekPlayerStats(gameweek.toString()),
    enabled: !!gameweek,
  });

  const { data: allPlayers } = useQuery({
    queryKey: ['allPlayers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('plplayerdata').select('*');
      if (error) throw error;
      return data;
    }
  });

  const { data: teams } = useTeamsContext();

  if (!transfers.length) return (
    <div className="text-center text-muted-foreground py-4">
      No transfers made this gameweek
    </div>
  );

  return (
    <Table>
      <TableHeader>
            <TableRow>
              <TableHead>Player In</TableHead>
              <TableHead>Player Out</TableHead>
              <TableHead className="text-right">Impact</TableHead>
            </TableRow>
          </TableHeader>
      <TableBody>
        {transfers.map((transfer, index) => {
          const playerIn = allPlayers?.find(p => p.id === transfer.element_in);
          const playerOut = allPlayers?.find(p => p.id === transfer.element_out);
          const playerInPoints = gwPlayerStats?.elements?.find((e: any) => e.id === transfer.element_in)?.stats?.total_points || 0;
          const playerOutPoints = gwPlayerStats?.elements?.find((e: any) => e.id === transfer.element_out)?.stats?.total_points || 0;
          const pointsDelta = playerInPoints - playerOutPoints;

          return (
            <TableRow key={transfer.element_in}>
              <TableCell>
                {playerIn?.web_name || 'Unknown'} 
                <span className="text-muted-foreground ml-2 text-xs">
                  ({teams?.find(t => t.id === playerIn?.team)?.short_name || '?'})
                </span>
              </TableCell>
              <TableCell>
                {playerOut?.web_name || 'Unknown'}
                <span className="text-muted-foreground ml-2 text-xs">
                  ({teams?.find(t => t.id === playerOut?.team)?.short_name || '?'})
                </span>
              </TableCell>
              <TableCell className={`text-right ${pointsDelta >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {pointsDelta >= 0 ? '+' : ''}{pointsDelta}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}