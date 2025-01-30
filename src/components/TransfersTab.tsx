// components/TransfersTab.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { managerService, playerService } from "@/services/fpl-api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TransferImpactCard } from "@/components/transferImpactCard";
import { useAuth } from "@/context/auth-context";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useTeamsContext } from "@/context/teams-context";

interface GameweekTransfers {
  gameweek: number;
  transferCount: number;
  transferCost: number;
  totalImpact: number;
}

export const TransfersTab = () => {
  const { currentManager } = useAuth();
  const { data: teams } = useTeamsContext();
  const [selectedGWTransfers, setSelectedGWTransfers] = useState<number | null>(null);

  // Fetch data
  const { data: managerTransfers } = useQuery({
    queryKey: ['managerTransfers', currentManager?.id],
    queryFn: () =>
      currentManager?.id ? managerService.getTransfers(currentManager.id.toString()) : null,
    enabled: !!currentManager?.id,
  });

  const { data: managerHistory } = useQuery({
    queryKey: ['managerHistory', currentManager?.id],
    queryFn: () =>
      currentManager?.id ? managerService.getHistory(currentManager.id.toString()) : null,
    enabled: !!currentManager?.id,
  });

  const { data: allPlayers } = useQuery({
    queryKey: ['allPlayers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('plplayerdata').select('*');
      if (error) throw error;
      return data;
    },
  });

  // Process transfers data
  const gameweekTransfers = managerTransfers?.reduce((acc, transfer) => {
    const existing = acc.find(item => item.gameweek === transfer.event);
    const historyEntry = managerHistory?.current?.find(gw => gw.event === transfer.event);

    if (existing) {
      existing.transferCount++;
    } else {
      acc.push({
        gameweek: transfer.event,
        transferCount: 1,
        transferCost: historyEntry?.event_transfers_cost || 0,
        totalImpact: 0,
      });
    }
    return acc;
  }, [] as GameweekTransfers[]) || [];

  // Calculate total impact for each gameweek
  const { data: processedTransfers } = useQuery({
    queryKey: ['processedTransfers', managerTransfers, allPlayers, teams],
    queryFn: async () => {
      return await Promise.all(
        gameweekTransfers.map(async gw => {
          const transfersInGW = managerTransfers?.filter(t => t.event === gw.gameweek) || [];
          const gwStats = await playerService.getGameweekPlayerStats(gw.gameweek.toString());

          let totalImpact = 0;
          for (const transfer of transfersInGW) {
            const playerIn = allPlayers?.find(p => p.id === transfer.element_in);
            const playerOut = allPlayers?.find(p => p.id === transfer.element_out);

            const playerInPoints =
              gwStats?.elements?.find((e: any) => e.id === transfer.element_in)?.stats
                ?.total_points || 0;
            const playerOutPoints =
              gwStats?.elements?.find((e: any) => e.id === transfer.element_out)?.stats
                ?.total_points || 0;

            totalImpact += playerInPoints - playerOutPoints;
          }

          return { ...gw, totalImpact };
        })
      );
    },
    enabled: !!managerTransfers && !!allPlayers && !!teams,
  });

  if (!managerTransfers || !managerHistory || !processedTransfers) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  // Calculate Summary Stats
  const totalTransferCost = processedTransfers.reduce((acc, gw) => acc + gw.transferCost, 0);
  const totalNetImpact = processedTransfers.reduce((acc, gw) => acc + gw.totalImpact, 0);
  const bestGW = processedTransfers.reduce((best, gw) => (gw.totalImpact > best.totalImpact ? gw : best), processedTransfers[0]);
  const worstGW = processedTransfers.reduce((worst, gw) => (gw.totalImpact < worst.totalImpact ? gw : worst), processedTransfers[0]);

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <h3 className="text-2xl font-semibold col-span-1 lg:col-span-2">Transfer History</h3>
      {/* Transfer Overview Card */}
      <div className="space-y-4 col-span-1">
        {/* Transfer Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Transfer Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Total Transfer Cost</span>
              <span className="text-lg font-semibold text-red-500">- {totalTransferCost} pts</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Net Transfer Impact</span>
              <span className={`text-lg font-semibold ${totalNetImpact >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {totalNetImpact >= 0 ? '+' : ''}{totalNetImpact} pts
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Best GW Transfers</span>
              <span className="text-lg font-semibold text-green-500">GW{bestGW?.gameweek}: +{bestGW?.totalImpact} pts</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Worst GW Transfers</span>
              <span className={`text-lg font-semibold ${worstGW?.totalImpact < 0 ? 'text-red-500' : ''}`}>
                GW{worstGW?.gameweek}: {worstGW?.totalImpact} pts
              </span>
            </div>
          </CardContent>
        </Card>
        {selectedGWTransfers ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">GW{selectedGWTransfers} Transfers</CardTitle>
            </CardHeader>
            <CardContent>
              <TransferImpactCard transfers={managerTransfers?.filter(t => t.event === selectedGWTransfers) || []} gameweek={selectedGWTransfers} />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Select a Gameweek</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground py-8">
              Click on a gameweek in the table to view detailed transfer information.
            </CardContent>
          </Card>
        )}
      </div>
      {/* Transfers Table */}
      <div className="rounded-md border lg:col-span-1">
        <h3 className="p-6 text-lg font-bold">Transfers Table</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>GW</TableHead>
              <TableHead>Transfers</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead className="text-right">Impact</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processedTransfers.map(gw => (
              <TableRow
                key={gw.gameweek}
                onClick={() => setSelectedGWTransfers(gw.gameweek)}
                className={`cursor-pointer ${selectedGWTransfers === gw.gameweek ? 'bg-muted' : ''}`}
              >
                <TableCell>{gw.gameweek}</TableCell>
                <TableCell>{gw.transferCount}</TableCell>
                <TableCell>{gw.transferCost}</TableCell>
                <TableCell className={`text-right ${gw.totalImpact >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {gw.totalImpact >= 0 ? '+' : ''}{gw.totalImpact}
                </TableCell>
              </TableRow>
            ))}
            {processedTransfers.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                  No transfers made this season
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
