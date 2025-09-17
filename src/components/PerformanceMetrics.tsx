import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown, Frown, Meh, Smile, Medal, ThumbsDown } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/context/auth-context";
import { useQuery } from "@tanstack/react-query";
import { managerService, playerService } from "@/services/fpl-api";
import { Skeleton } from "@/components/ui/skeleton";
import { useContext, useEffect, useState } from "react";
import { LiveGWContext } from "@/context/livegw-context";
import { supabase } from "@/integrations/supabase/client";
import { GameweekPicks, ManagerTransfers } from "@/types/fpl";
import { useTeamsContext } from "@/context/teams-context";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface PerformanceMetricsProps {
  gameweek: number;
  gameweekPicks: GameweekPicks;
  isLoading: boolean;
  error: Object;
}

// Add this interface for type safety
interface CaptainData {
  playerData: any;
  teamData: any;
  opponentData: any;
  captPoints: number;
}

export function PerformanceMetrics({ gameweek = 22, gameweekPicks, isLoading, error }: PerformanceMetricsProps) {

  const { overallData } = useContext(LiveGWContext)
  const { managerHistory, currentManager } = useAuth();
  const { data: teams, isLoading: teamsLoading } = useTeamsContext()
  const currentGWData = Array.isArray(overallData) ? overallData.filter((gw) => gw.id === gameweek)[0] : undefined;

  const [managerTransfers, setManagerTransfers] = useState<Array<ManagerTransfers>>(null);

  const entryHistory = gameweekPicks?.entry_history;
  const captain = gameweekPicks?.picks?.find(pick => pick.is_captain);

  // Mock data as fallback
  const mockData = {
    points: 68,
    averagePoints: 55,
    rank: 100000,
    previousRank: 120000,
    benchPoints: 12,
    transfers: {
      count: 2,
      cost: 4,
      in: [
        { name: "Salah", points: 12 },
        { name: "Haaland", points: 9 },
      ],
      out: [
        { name: "De Bruyne", points: 6 },
        { name: "Kane", points: 4 },
      ],
    },
    teamValue: {
      current: 102.5,
      change: 0.2,
    },
    captain: {
      name: "Salah",
      points: 24,
      streak: 3,
    },
  };

  const { data: captainData, isLoading: isCaptainLoading } = useQuery<CaptainData>({
    queryKey: ['captainPerformance', captain?.element, gameweek],
    queryFn: async () => {
      if (!captain?.element) return null;

      // Fetch parallel data
      const [playerRes, summaryRes] = await Promise.all([
        supabase.from('plplayerdata').select().eq('id', captain.element),
        playerService.getPlayerSummary(captain.element.toString())
      ]);

      // Error handling
      if (playerRes.error) throw playerRes.error;
      if (!playerRes.data?.[0]) throw new Error('Player not found');

      // Get team data from context instead of Supabase
      const teamData = teams?.find(t => t.id === playerRes.data[0].team);
      if (!teamData) throw new Error('Team not found');

      // Get current GW data
      const gwData = summaryRes.history.find((h: any) => h.round === gameweek);
      if (!gwData) throw new Error('GW data not found');

      // Get opponent from pre-loaded teams
      const opponentData = teams?.find(t => t.id === gwData.opponent_team);
      if (!opponentData) throw new Error('Opponent not found');

      return {
        playerData: playerRes.data[0],
        teamData,
        opponentData,
        captPoints: gwData.total_points
      };
    },
    enabled: !!captain?.element && !!teams,
    staleTime: Infinity // Cache indefinitely for same gameweek
  });

  const {
    data: managerTransfersData,
    isLoading: isLoadingTransfers,
    error: transferFetchError,
  } = useQuery({
    queryKey: ['managerTransfers', currentManager?.id, gameweek],
    queryFn: () =>
      currentManager?.id
        ? managerService.getTransfers(currentManager.id.toString())
        : null,
    enabled: !!currentManager?.id,
  });

  const { data: allPlayers } = useQuery({
    queryKey: ['allPlayers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('plplayerdata').select('*');
      if (error) throw error;
      return data;
    }
  });

  const { data: gwPlayerStats } = useQuery({
    queryKey: ['gwPlayerStats', gameweek],
    queryFn: () => playerService.getGameweekPlayerStats(gameweek.toString()),
    enabled: !!gameweek,
  });

  useEffect(() => {
    if (!isLoadingTransfers) {
      let filtered = managerTransfersData.filter((item) => item.event === gameweek);
      setManagerTransfers(filtered);
    }
  }, [isLoadingTransfers])


  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-start space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader className="space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-4 w-32 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Error fetching gameweek picks:', error);
  }

  const getRankIcon = (current: number, previous: number) => {
    if (current < previous) {
      return <ArrowUp className="text-green-500" />;
    }
    return <ArrowDown className="text-red-500" />;
  };

  const getPerfIcon = (gwPoints: number, gwAverage: number) => {
    const difference = gwPoints - gwAverage;
    return difference <= -10 ? <ThumbsDown className="text-red-600" /> :
      difference < 0 ? <Frown className="text-orange-500" /> :
        difference < 10 ? <Meh className="text-gray-500" /> :
          difference <= 20 ? <Smile className="text-green-500" /> :
            <Medal className="text-blue-600" />;
  };

  const getCaptIcon = (captPoints: number) => {
    let multipliedCaptPts = captPoints * 2
    return multipliedCaptPts < 5 ? <Frown className="text-orange-500" /> :
      multipliedCaptPts < 10 ? <Meh className="text-gray-500" /> :
        multipliedCaptPts <= 20 ? <Smile className="text-green-500" /> :
          <Medal className="text-blue-600" />;
  };

  const getValueSymbol = (currValue: number, prevValue: number) => {
    let change = ((currValue - prevValue) / 10).toFixed(1)
    return Number(change) > 0 ?
      <span className="text-green-500">
        +{change}m
      </span>
      :
      <span className="text-red-500">
        {change}m
      </span>
  }

  return (
    <div className="space-y-4">
      <div className="text-start space-y-2">
        <p className="text-muted-foreground">Manager Stats</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        {/* Points Card */}
        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gameweek Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-2 pb-2">
              <span className="text-2xl font-bold">
                {entryHistory?.points || mockData.points}
              </span>
              {getPerfIcon(entryHistory?.points, currentGWData?.average_entry_score)}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentGWData?.average_entry_score} | Overall Average
            </p>
          </CardContent>
        </Card>

        {/* Rank Card */}
        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Rank</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center  justify-between gap-2 pb-2">
              <span className="text-2xl font-bold">
                {entryHistory?.overall_rank?.toLocaleString() || mockData.rank.toLocaleString()}
              </span>
              {getRankIcon(
                entryHistory?.overall_rank || mockData.rank,
                mockData.previousRank
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {entryHistory?.rank?.toLocaleString() || mockData.previousRank.toLocaleString()} | Gameweek Rank
            </p>
          </CardContent>
        </Card>

        {/* Captain Performance Card */}
        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Captain Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {isCaptainLoading ? (
              <Skeleton className="h-[76px] w-full" />
            ) : captainData ? (
              <div className="space-y-2">
                <div className="text-2xl gap-2 items-center justify-between flex font-bold">
                  <div className="flex gap-2">
                    {captainData.playerData.web_name}
                    <div className="text-muted-foreground">
                      ({captainData.teamData.short_name})
                    </div>
                  </div>
                  {getCaptIcon(captainData.captPoints)}
                </div>
                <div className="text-xl flex items-center gap-1">
                  {captainData.captPoints * 2} PTS
                  <div className="text-muted-foreground">
                    v {captainData.opponentData.short_name}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground">No captain data</div>
            )}
          </CardContent>
        </Card>

        {managerHistory && managerTransfers ?
          <Card>
            <CardHeader className="space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transfers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Made:</span>
                  <span>{managerTransfers.length}</span>
                </div>
                <div className="flex justify-between text-red-500">
                  <span>Cost:</span>
                  <span>{managerHistory.current[gameweek - 1]?.event_transfers_cost || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          :
          <Card>
            <CardHeader className="space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Captain Performance</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">
              Loading ...
            </CardContent>
          </Card>
        }

        {managerHistory && entryHistory ?
          <Card>
            <CardHeader className="space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Team Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold pb-2">
                £{((entryHistory.value || 0) / 10).toFixed(1)}m
              </div>
              <p className="text-sm">
                {getValueSymbol(entryHistory.value, managerHistory.current[gameweek - 2].value)}
              </p>
            </CardContent>
          </Card>
          :
          <Skeleton className="h-full w-full rounded-xl" />
        }


        {/* Bench Points Card */}
        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>Bench Points</TooltipTrigger>
                  <TooltipContent>
                    <p>Points scored by players on your bench</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl pb-2 font-bold">{entryHistory?.points_on_bench || mockData.benchPoints}</div>
            <p className="text-sm text-muted-foreground">
              Auto Subs: None
            </p>
          </CardContent>
        </Card>

        {managerHistory && managerTransfers ?
          <Card>
            <CardHeader className="space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transfer Impact</CardTitle>
            </CardHeader>
            <CardContent>
                {managerTransfers.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>In</TableHead>
                        <TableHead>Out</TableHead>
                        <TableHead className="text-right">-/+</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {managerTransfers.map((transfer, index) => {
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
                )}
                {managerTransfers.length === 0 && (
                  <div className="text-center text-muted-foreground py-4">
                    No transfers made this gameweek
                  </div>
                )}
            </CardContent>
          </Card>
          :
          <Card>
            <CardHeader className="space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transfer Impact</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">
              <Skeleton className="h-[100px] w-full" />
            </CardContent>
          </Card>
        }
      </div>
    </div>
  );
}