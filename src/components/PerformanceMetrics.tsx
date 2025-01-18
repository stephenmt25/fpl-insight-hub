import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown, Star, AlertCircle, Minus } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PerformanceMetricsProps {
  gameweek: number;
}

export function PerformanceMetrics({ gameweek }: PerformanceMetricsProps) {
  // Mock data - replace with actual data from your API
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

  const getRankIcon = (current: number, previous: number) => {
    if (current < previous) {
      return <ArrowUp className="h-4 w-4 text-green-500" />;
    }
    return <ArrowDown className="h-4 w-4 text-red-500" />;
  };

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Team Name</h2>
        <p className="text-muted-foreground">Gameweek {gameweek} Performance</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Points Card */}
        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gameweek Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockData.points}</div>
            <p className="text-xs text-muted-foreground">
              League Average: {mockData.averagePoints}
            </p>
            <div className="mt-2 h-2 w-full bg-gray-200 rounded-full">
              <div
                className="h-2 bg-green-500 rounded-full"
                style={{
                  width: `${(mockData.points / 100) * 100}%`,
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Rank Card */}
        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gameweek Rank</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">
                {mockData.rank.toLocaleString()}
              </span>
              {getRankIcon(mockData.rank, mockData.previousRank)}
            </div>
            <p className="text-xs text-muted-foreground">
              Previous: {mockData.previousRank.toLocaleString()}
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
            <div className="text-2xl font-bold">{mockData.benchPoints}</div>
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
                <span>{mockData.transfers.count}</span>
              </div>
              <div className="flex justify-between">
                <span>Cost:</span>
                <span>-{mockData.transfers.cost}</span>
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
            <div className="text-2xl font-bold">£{mockData.teamValue.current}m</div>
            <p className={`text-xs ${mockData.teamValue.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {mockData.teamValue.change >= 0 ? '+' : ''}{mockData.teamValue.change}m
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
              <div className="text-2xl font-bold">{mockData.captain.name}</div>
              <div className="text-sm">{mockData.captain.points} points</div>
              <div className="text-xs text-muted-foreground">
                {mockData.captain.streak} week streak
              </div>
              <div className="h-1 w-full bg-gray-200 rounded-full">
                <div
                  className="h-1 bg-green-500 rounded-full"
                  style={{ width: `${(mockData.captain.streak / 5) * 100}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}