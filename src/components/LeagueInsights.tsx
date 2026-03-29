import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { leagueService, managerService } from "@/services/fpl-api";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, TrendingUp, Star } from "lucide-react";

interface LeagueInsightsProps {
  selectedLeague: string;
  leagueId: string;
}

const CHART_COLORS = ["#00ff87", "#04f5ff", "#ff04a1", "#ffd700", "#8b5cf6"];

export function LeagueInsights({ selectedLeague, leagueId }: LeagueInsightsProps) {
  // Fetch league standings
  const { data: leagueData, isLoading: isLoadingStandings } = useQuery({
    queryKey: ['leagueInsightsStandings', leagueId],
    queryFn: () => leagueService.getStandings(leagueId),
    enabled: !!leagueId,
  });

  const standings = leagueData?.standings?.results || [];
  const top5 = standings.slice(0, 5);

  // Fetch histories for top 5 managers
  const { data: historiesData, isLoading: isLoadingHistories } = useQuery({
    queryKey: ['leagueInsightsHistories', top5.map(m => m.entry)],
    queryFn: async () => {
      const histories = await Promise.all(
        top5.map(m => managerService.getHistory(m.entry.toString()))
      );
      return histories;
    },
    enabled: top5.length > 0,
  });

  if (isLoadingStandings || isLoadingHistories) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[350px] w-full" />
      </div>
    );
  }

  if (!standings.length) {
    return (
      <div className="space-y-8">
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No league data available.
          </CardContent>
        </Card>
      </div>
    );
  }

  // Compute top performers with badges
  const topPerformers = standings.slice(0, 3).map((manager, index) => {
    let badge = "Top Performer";
    let icon = <Trophy className="w-5 h-5" />;
    if (index === 0) {
      // Check highest single GW score
      badge = "League Leader";
      icon = <Trophy className="w-5 h-5 text-yellow-500" />;
    } else if (index === 1) {
      badge = "Runner Up";
      icon = <Star className="w-5 h-5 text-blue-500" />;
    } else {
      // Biggest climber: most improved rank
      const rankDelta = manager.last_rank - manager.rank;
      badge = rankDelta > 0 ? `Climbed ${rankDelta} places` : "Consistent";
      icon = <TrendingUp className="w-5 h-5 text-green-500" />;
    }

    return {
      name: manager.player_name,
      entryName: manager.entry_name,
      points: manager.total,
      eventPoints: manager.event_total,
      badge,
      icon,
    };
  });

  // Build chart data from histories
  const chartData: { gameweek: number; [key: string]: number }[] = [];
  if (historiesData) {
    const maxGWs = Math.max(...historiesData.map(h => h?.current?.length || 0));
    for (let i = 0; i < maxGWs; i++) {
      const point: Record<string, number> = { gameweek: i + 1 };
      top5.forEach((manager, idx) => {
        const gw = historiesData[idx]?.current?.[i];
        if (gw) {
          point[`manager${idx}`] = gw.total_points;
        }
      });
      chartData.push(point as { gameweek: number; [key: string]: number });
    }
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Top Performers — {selectedLeague}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {topPerformers.map((performer, index) => (
              <div
                key={index}
                className="flex flex-col items-center space-y-2 p-4 border rounded-lg"
              >
                <div className="w-12 h-12 bg-fpl-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {index + 1}
                </div>
                <h3 className="font-semibold">{performer.name}</h3>
                <p className="text-xs text-muted-foreground">{performer.entryName}</p>
                <p className="text-sm text-muted-foreground">{performer.points} pts</p>
                <span className="text-xs bg-fpl-accent/20 px-2 py-1 rounded-full flex items-center gap-1">
                  {performer.icon}
                  {performer.badge}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>League Performance Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="gameweek" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {top5.map((manager, idx) => (
                    <Line
                      key={manager.entry}
                      type="monotone"
                      dataKey={`manager${idx}`}
                      name={manager.player_name}
                      stroke={CHART_COLORS[idx]}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
