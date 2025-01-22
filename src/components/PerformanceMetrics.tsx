import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/context/auth-context";
import { useQuery } from "@tanstack/react-query";
import { managerService } from "@/services/fpl-api";
import { Skeleton } from "@/components/ui/skeleton";

interface PerformanceMetricsProps {
  gameweek: number;
}

export function PerformanceMetrics({ gameweek = 22 }: PerformanceMetricsProps) {
  const { currentManager } = useAuth();
  
  const { data: gameweekPicks, isLoading, error } = useQuery({
    queryKey: ['gameweekPicks', currentManager?.id, gameweek],
    queryFn: () => 
      currentManager?.id 
        ? managerService.getGameweekTeamPicks(currentManager.id.toString(), gameweek.toString())
        : null,
    enabled: !!currentManager?.id && !!gameweek,
  });

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
      return <ArrowUp className="h-4 w-4 text-green-500" />;
    }
    return <ArrowDown className="h-4 w-4 text-red-500" />;
  };

  const entryHistory = gameweekPicks?.entry_history;
  const captain = gameweekPicks?.picks?.find(pick => pick.is_captain);

  return (
    <div className="space-y-4">
      <div className="text-start space-y-2">
        <h2 className="text-2xl font-bold">{currentManager?.name || 'Team Name'}</h2>
        <p className="text-muted-foreground">Gameweek {gameweek} Performance</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        {/* Points Card */}
        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gameweek Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{entryHistory?.points || mockData.points}</div>
            <p className="text-xs text-muted-foreground">
              League Average: {mockData.averagePoints}
            </p>
          </CardContent>
        </Card>

        {/* Rank Card */}
        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Rank</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">
                {entryHistory?.overall_rank?.toLocaleString() || mockData.rank.toLocaleString()}
              </span>
              {getRankIcon(
                entryHistory?.overall_rank || mockData.rank,
                mockData.previousRank
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Gameweek Rank: {entryHistory?.rank?.toLocaleString() || mockData.previousRank.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        {/* Captain Performance Card */}
        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Captain Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {captain ? `Player ${captain.element}` : mockData.captain.name}
              </div>
              <div className="text-sm">{mockData.captain.points} points</div>
              <div className="text-xs text-muted-foreground">
                {mockData.captain.streak} week streak
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transfers Card */}
        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transfers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Made:</span>
                <span>{entryHistory?.event_transfers || mockData.transfers.count}</span>
              </div>
              <div className="flex justify-between">
                <span>Cost:</span>
                <span>-{entryHistory?.event_transfers_cost || mockData.transfers.cost}</span>
              </div>
              <div className="text-xs space-y-1">
                <div className="text-green-500">
                  In: {mockData.transfers.in.map(p => `${p.name} (+${p.points})`).join(', ')}
                </div>
                <div className="text-red-500">
                  Out: {mockData.transfers.out.map(p => `${p.name} (+${p.points})`).join(', ')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Value Card */}
        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              £{((entryHistory?.value || 0) / 10).toFixed(1)}m
            </div>
            <p className={`text-xs ${mockData.teamValue.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {mockData.teamValue.change >= 0 ? '+' : ''}{mockData.teamValue.change}m
            </p>
          </CardContent>
        </Card>

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
            <div className="text-2xl font-bold">{entryHistory?.points_on_bench || mockData.benchPoints}</div>
            <p className="text-xs text-muted-foreground">
              Auto Subs: None
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}