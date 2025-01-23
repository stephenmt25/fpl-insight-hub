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

interface PerformanceMetricsProps {
  gameweek: number;
  gameweekPicks: GameweekPicks;
  isLoading: boolean;
  error: Object;
}

export function PerformanceMetrics({ gameweek = 22, gameweekPicks, isLoading, error }: PerformanceMetricsProps) {
  const { overallData } = useContext(LiveGWContext)
  const { managerHistory, currentManager } = useAuth();
  const currentGWData = Array.isArray(overallData) ? overallData.filter((gw) => gw.id === gameweek)[0] : undefined;
  const [mostCaptPlayerData, setMostCaptPlayerData] = useState<any | null>([{ status: "loading" }]);
  const [mostCaptPlayerTeam, setMostCaptPlayerTeam] = useState<any | null>(null);
  const [mostCaptPlayerOpp, setMostCaptPlayerOpp] = useState<any | null>(null);

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
  
  useEffect(() => {
    const fetchMostCaptPlayerAndTeam = async () => {
      try {
        if (captain?.element) {
          const { data: playerData, error: playerError } = await supabase
            .from('plplayerdata')
            .select()
            .eq('id', Number(captain.element));

          if (playerError) {
            console.error('Error fetching most-captained player data:', playerError);
            return;
          }
          if (playerData && playerData[0]?.team) {
            const { data: teamData, error: teamError } = await supabase
              .from('plteams')
              .select()
              .eq('id', Number(playerData[0].team));

            if (teamError) {
              console.error('Error fetching most-captained player team data:', teamError);
              return;
            }

            setMostCaptPlayerTeam(teamData);
          }

          const playerSummary = await playerService.getPlayerSummary(captain.element.toString());

          if (playerSummary) {
            const currentGameweekData = playerSummary.history.find(
              (item) => item.round === gameweek
            );
            if (currentGameweekData?.opponent_team) {
              const { data: opponentTeamData, error: opponentTeamError } = await supabase
                .from('plteams')
                .select('short_name')
                .eq('id', Number(currentGameweekData.opponent_team));

              if (opponentTeamError) {
                console.error('Error fetching opponent team data:', opponentTeamError);
                return;
              }

              setMostCaptPlayerOpp(opponentTeamData);
              setMostCaptPlayerData([...playerData, currentGameweekData.total_points])
            }
          }
        }
      } catch (error) {
        console.error('Unexpected error:', error);
      }
    };
    fetchMostCaptPlayerAndTeam();

    const fetchManagerTransfers = async () => {
      try {
        const transfers = await managerService.getTransfers(currentManager.id)
        let filtered = transfers.filter(item => item.event === gameweek);
        setManagerTransfers(filtered)
      } catch (error) {
        console.error(error)
      }
    }
    fetchManagerTransfers()
  }, [gameweek]);

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
        <h2 className="text-2xl font-bold">{currentManager?.name || 'Team Name'}</h2>
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
        {
          mostCaptPlayerData && mostCaptPlayerTeam && mostCaptPlayerOpp ?
            <Card>
              <CardHeader className="space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Captain Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl gap-2 items-center justify-between flex font-bold">
                    <div className="flex gap-2">
                      {mostCaptPlayerData[0].web_name}
                      <div className="text-muted-foreground">
                        ({mostCaptPlayerTeam[0].short_name})
                      </div>
                    </div>
                    {getCaptIcon(mostCaptPlayerData[1])}
                  </div>
                  <div className="text-xl flex items-center gap-1">
                    {mostCaptPlayerData[1]} PTS
                    <div className=" text-muted-foreground">
                      v {mostCaptPlayerOpp[0].short_name}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            :
            <Skeleton className="h-full w-full rounded-xl" />
        }

        {/* Transfers Card */}
        {
          managerHistory && managerHistory.current[gameweek] && managerTransfers ?
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
                    <span>-{managerHistory.current[gameweek].event_transfers_cost}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            :
            <Skeleton className="h-full w-full rounded-xl" />
        }

        {/* Team Value Card */}
        {
          managerHistory && entryHistory ?
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
      </div>
    </div>
  );
}