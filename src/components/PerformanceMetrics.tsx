import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown, Star, AlertCircle, Minus } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/context/auth-context";
import { LiveGWContext } from "@/context/livegw-context";
import { useContext } from "react";

interface PerformanceMetricsProps {
  gameweek: number;
}

export function PerformanceMetrics({ gameweek }: PerformanceMetricsProps) {
  const { currentManager } = useAuth();
  const { liveGameweekData } = useContext(LiveGWContext);

  const getRankIcon = (current: number, previous: number) => {
    if (current < previous) {
      return <ArrowUp className="h-4 w-4 text-green-500" />;
    }
    return <ArrowDown className="h-4 w-4 text-red-500" />;
  };

  if (!currentManager) {
    return <div>Loading manager data...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="text-start space-y-2">
        <h2 className="text-2xl font-bold">{currentManager.name}</h2>
        <p className="text-muted-foreground">
          Gameweek {gameweek} Performance
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        {/* Points Card */}
        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gameweek Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentManager.summary_event_points}</div>
            <p className="text-xs text-muted-foreground">
              Overall Points: {currentManager.summary_overall_points}
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
                {currentManager.summary_overall_rank?.toLocaleString()}
              </span>
              {getRankIcon(
                currentManager.summary_overall_rank || 0,
                currentManager.summary_overall_rank || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Gameweek Rank: {currentManager.summary_event_rank?.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        {/* Current Event Card */}
        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Event</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GW {currentManager.current_event}</div>
            <p className="text-xs text-muted-foreground">
              Live Gameweek: {liveGameweekData?.id || 'N/A'}
            </p>
          </CardContent>
        </Card>

        {/* League Performance */}
        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">League Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentManager.leagues?.classic?.length || 0} Leagues
            </div>
            <p className="text-xs text-muted-foreground">
              Active in {currentManager.leagues?.h2h?.length || 0} H2H Leagues
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}