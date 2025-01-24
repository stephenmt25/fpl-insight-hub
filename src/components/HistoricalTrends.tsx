import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useQuery } from "@tanstack/react-query";
import { managerService } from "@/services/api/manager.service";
import { useAuth } from "@/context/auth-context";
import { GameweekHistory } from "@/types/fpl";
import { Info } from "lucide-react";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function HistoricalTrends() {
  const { currentManager } = useAuth();

  const { data: managerHistory } = useQuery({
    queryKey: ['manager-history', currentManager?.id],
    queryFn: () => managerService.getHistory(currentManager?.id),
    enabled: !!currentManager?.id,
  });

  const formatGameweekLabel = (gameweek: number) => `GW${gameweek}`;

  const getHighestBenchPoints = () => {
    if (!managerHistory?.current) return null;
    const highest = Math.max(...managerHistory.current.map(gw => gw.points_on_bench));
    const gameweek = managerHistory.current.find(gw => gw.points_on_bench === highest);
    return { points: highest, gameweek: gameweek?.event };
  };

  const getHighestTransferCost = () => {
    if (!managerHistory?.current) return null;
    const highest = Math.max(...managerHistory.current.map(gw => gw.event_transfers_cost));
    const gameweek = managerHistory.current.find(gw => gw.event_transfers_cost === highest);
    return { cost: highest, gameweek: gameweek?.event };
  };

  const getBestRankImprovement = () => {
    if (!managerHistory?.current) return null;
    let bestImprovement = 0;
    let bestGameweek = 0;

    for (let i = 1; i < managerHistory.current.length; i++) {
      const improvement = managerHistory.current[i - 1].overall_rank - managerHistory.current[i].overall_rank;
      if (improvement > bestImprovement) {
        bestImprovement = improvement;
        bestGameweek = managerHistory.current[i].event;
      }
    }

    return { improvement: bestImprovement, gameweek: bestGameweek };
  };

  const getTeamValuePeak = () => {
    if (!managerHistory?.current) return null;
    const highest = Math.max(...managerHistory.current.map(gw => gw.value));
    const gameweek = managerHistory.current.find(gw => gw.value === highest);
    return { value: highest / 10, gameweek: gameweek?.event };
  };

  const formatValue = (value: number) => `£${(value / 10).toFixed(1)}m`;

  return (
    <div className=" grid grid-cols-1 lg:grid-cols-3 gap-2">
      <h3 className="text-2xl font-semibold col-span-1 lg:col-span-3">Historical Performance</h3>
      {/* Points Breakdown Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Points Breakdown</CardTitle>
            <UITooltip>
              <TooltipTrigger><Info className="w-4 lg:w-5" /></TooltipTrigger>
              <TooltipContent>
                <p>Each bar shows the points breakdown per gameweek:</p>
                <p>- Green: Actual points scored</p>
                <p>- Orange: Points left on bench</p>
                <p>- Red: Points deducted for transfers</p>
              </TooltipContent>
            </UITooltip>
          </div>
          <p className="text-sm text-muted-foreground">
            Analyze actual points, bench points, and transfer cost deductions
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={managerHistory?.current}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <XAxis dataKey="event" tickFormatter={formatGameweekLabel} />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    switch (name) {
                      case 'Points':
                        return [`${value}`, 'Gameweek Points'];
                      case 'Bench':
                        return [`${value}`, 'Bench Points'];
                      case 'Transfer Cost':
                        return [`-${value}`, 'Transfer Cost'];
                      default:
                        return [value, name];
                    }
                  }}
                />
                <Legend />
                <Bar dataKey="points" name="Points" stackId="a" fill="#4ade80" />
                <Bar dataKey="event_transfers_cost" name="Transfer Cost" stackId="a" fill="#ef4444" />
                <Bar dataKey="points_on_bench" name="Bench" stackId="a" fill="#fb923c" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {getHighestBenchPoints() && getHighestTransferCost() && (
            <p className="mt-4 text-sm text-muted-foreground">
              Gameweek {getHighestBenchPoints()?.gameweek} had the highest bench points of {getHighestBenchPoints()?.points},
              while Gameweek {getHighestTransferCost()?.gameweek} had the highest transfer cost deduction of -{getHighestTransferCost()?.cost}.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Rank Progression Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Rank Progression</CardTitle>
            <UITooltip>
              <TooltipTrigger><Info className="w-4 lg:w-5" /></TooltipTrigger>
              <TooltipContent>
                <p>Line chart showing overall rank changes:</p>
                <p>- Lower position means better rank</p>
                <p>- Downward trend indicates rank improvement</p>
                <p>- Hover to see exact rank for each gameweek</p>
              </TooltipContent>
            </UITooltip>
          </div>
          <p className="text-sm text-muted-foreground">
            Track how your rank has evolved throughout the season
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={managerHistory?.current}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="event" tickFormatter={formatGameweekLabel} />
                <YAxis reversed={true} hide />
                <Tooltip
                  formatter={(value: number) => [`${value.toLocaleString()}`, 'Overall Rank']}
                  labelFormatter={(label) => `Gameweek ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="overall_rank"
                  name="Overall Rank"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {getBestRankImprovement() && (
            <p className="mt-4 text-sm text-muted-foreground">
              Your rank improved the most in Gameweek {getBestRankImprovement()?.gameweek},
              jumping up by {getBestRankImprovement()?.improvement.toLocaleString()} places.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Team Value Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Team Value</CardTitle>
            <UITooltip>
              <TooltipTrigger><Info className="w-4 lg:w-5" /></TooltipTrigger>
              <TooltipContent>
                <p>Area chart showing team value changes:</p>
                <p>- Y-axis shows team value in millions</p>
                <p>- Upward trend indicates value increase</p>
                <p>- Value changes based on player price changes</p>
              </TooltipContent>
            </UITooltip>
          </div>
          <p className="text-sm text-muted-foreground">
            Monitor your team's value fluctuations throughout the season
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={managerHistory?.current}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <XAxis dataKey="event" tickFormatter={formatGameweekLabel} />
                <YAxis domain={["dataMin", "dataMax"]} tickFormatter={(value) => `£${value / 10}m`}  />
                <Tooltip
                  formatter={(value: number) => [formatValue(value), 'Team Value']}
                  labelFormatter={(label) => `Gameweek ${label}`}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="value"
                  name="Team Value"
                  stroke="#22c55e"
                  fill="#22c55e"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {getTeamValuePeak() && (
            <p className="mt-4 text-sm text-muted-foreground">
              Your team value peaked at £{getTeamValuePeak()?.value.toFixed(1)}m in Gameweek {getTeamValuePeak()?.gameweek}.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}