import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { leagueService, managerService } from "@/services/fpl-api";
import { Skeleton } from "@/components/ui/skeleton";

interface LeagueTrendsProps {
  selectedLeague: string;
  leagueId: string;
}

export function LeagueTrends({ selectedLeague, leagueId }: LeagueTrendsProps) {
  // Fetch league standings
  const { data: leagueData, isLoading: isLoadingStandings } = useQuery({
    queryKey: ['leagueTrendsStandings', leagueId],
    queryFn: () => leagueService.getStandings(leagueId),
    enabled: !!leagueId,
  });

  const standings = leagueData?.standings?.results || [];
  const topManagers = standings.slice(0, 15);

  // Fetch histories for top managers
  const { data: historiesData, isLoading: isLoadingHistories } = useQuery({
    queryKey: ['leagueTrendsHistories', topManagers.map(m => m.entry)],
    queryFn: async () => {
      const histories = await Promise.all(
        topManagers.map(m => managerService.getHistory(m.entry.toString()))
      );
      return histories;
    },
    enabled: topManagers.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoadingStandings || isLoadingHistories) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-[350px] w-full" />
        <Skeleton className="h-[350px] w-full" />
      </div>
    );
  }

  if (!historiesData || historiesData.length === 0) {
    return (
      <div className="space-y-8">
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No trend data available for {selectedLeague}.
          </CardContent>
        </Card>
      </div>
    );
  }

  // Aggregate per-gameweek data across all fetched managers
  const maxGWs = Math.max(...historiesData.map(h => h?.current?.length || 0));
  const aggregatedData: { gameweek: number; avgPoints: number; avgBenchPoints: number; totalTransfers: number }[] = [];

  for (let i = 0; i < maxGWs; i++) {
    let totalPoints = 0;
    let totalBench = 0;
    let totalTransfers = 0;
    let count = 0;

    for (const history of historiesData) {
      const gw = history?.current?.[i];
      if (gw) {
        totalPoints += gw.points;
        totalBench += gw.points_on_bench;
        totalTransfers += gw.event_transfers;
        count++;
      }
    }

    if (count > 0) {
      aggregatedData.push({
        gameweek: i + 1,
        avgPoints: Math.round(totalPoints / count),
        avgBenchPoints: Math.round(totalBench / count),
        totalTransfers: Math.round(totalTransfers / count),
      });
    }
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>League-Wide Gameweek Points — {selectedLeague}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aggregatedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="gameweek" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="avgPoints" name="Avg Points" fill="#00ff87" />
                <Bar dataKey="avgBenchPoints" name="Avg Bench Points" fill="#04f5ff" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Transfer Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aggregatedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="gameweek" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalTransfers" name="Avg Transfers" fill="#ff04a1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
