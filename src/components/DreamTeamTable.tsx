import { useState, useEffect, useContext } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Shield,
  Shirt,
  Star,
  Flame,
  Check,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { playerService } from "@/services/fpl-api";
import { useQuery } from "@tanstack/react-query";
import { LiveGWContext } from "@/context/livegw-context";

interface DreamTeamPlayer {
  id: number;
  name: string;
  position: string;
  club: string;
  points: number;
  selectedBy: string;
  goals: number;
  assists: number;
  cleanSheet: boolean;
  ictIndex: string;
  xG: string;
  xA: string;
  bonusPoints: number;
}

interface PlayerData {
  id: number;
  first_name: string;
  second_name: string;
  element_type: number;
  team: number;
  team_code: number;
  selected_by_percent: string;
}

interface LiveStats {
  stats: {
    goals_scored: number;
    assists: number;
    clean_sheets: number;
    ict_index: string;
    expected_goals: string;
    expected_assists: string;
    bonus: number;
  };
}

interface DreamTeamResponse {
  team: Array<{
    element: number;
    points: number;
  }>;
}

interface LiveDataResponse {
  elements: Array<LiveStats & { id: number }>;
}

export function DreamTeamTable({ liveGameweek, currentGameweek }: { liveGameweek: number, currentGameweek: any }) {
  const displayedWeek = currentGameweek.toString()
  const [players, setPlayers] = useState<DreamTeamPlayer[]>([]);

  const { data: dreamTeamData, isLoading: isDreamTeamLoading } = useQuery<DreamTeamResponse>({
    queryKey: ['dreamTeam', displayedWeek],
    queryFn: () => playerService.getGameweekDreamTeam(displayedWeek),
  });

  const { data: liveData, isLoading: isLiveDataLoading } = useQuery<LiveDataResponse>({
    queryKey: ['liveGameweek', displayedWeek],
    queryFn: () => playerService.getGameweekPlayerStats(displayedWeek),
    enabled: !!dreamTeamData,
  });

  useEffect(() => {
    const fetchPlayerDetails = async () => {
      if (!dreamTeamData?.team || !liveData?.elements) return;

      const playerIds = dreamTeamData.team.map(player => player.element);
      
      const { data: playerData, error } = await supabase
        .from('plplayerdata')
        .select('*')
        .in('id', playerIds);

      if (error) {
        console.error('Error fetching player data:', error);
        return;
      }

      const dreamTeamPlayers = dreamTeamData.team.map(dreamTeamMember => {
        const playerDetails = playerData?.find(p => p.id === dreamTeamMember.element) as PlayerData | undefined;
        const liveStats = liveData.elements.find(e => e.id === dreamTeamMember.element);

        if (!playerDetails || !liveStats) return null;

        return {
          id: playerDetails.id,
          name: `${playerDetails.first_name} ${playerDetails.second_name}`,
          position: playerDetails.element_type === 1 ? 'GK' : 
                   playerDetails.element_type === 2 ? 'DEF' :
                   playerDetails.element_type === 3 ? 'MID' : 'FWD',
          club: playerDetails.team_code?.toString() || '',
          points: dreamTeamMember.points,
          selectedBy: playerDetails.selected_by_percent,
          goals: liveStats.stats.goals_scored,
          assists: liveStats.stats.assists,
          cleanSheet: liveStats.stats.clean_sheets === 1,
          ictIndex: liveStats.stats.ict_index,
          xG: liveStats.stats.expected_goals,
          xA: liveStats.stats.expected_assists,
          bonusPoints: liveStats.stats.bonus,
        };
      }).filter((player): player is DreamTeamPlayer => player !== null);

      setPlayers(dreamTeamPlayers);
    };

    fetchPlayerDetails();
  }, [dreamTeamData, liveData]);

  if (isDreamTeamLoading || isLiveDataLoading) {
    return <div>Loading dream team data...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold">
          Dream Team Performance – Gameweek {displayedWeek}
        </h2>
        <p className="text-muted-foreground">
          An overview of the top performers in Fantasy Premier League for this
          gameweek.
        </p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Player</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Club</TableHead>
              <TableHead className="text-right">Points</TableHead>
              <TableHead className="text-right">Selected By</TableHead>
              <TableHead className="text-right">Goals</TableHead>
              <TableHead className="text-right">Assists</TableHead>
              <TableHead className="text-center">Clean Sheet</TableHead>
              <TableHead>ICT Index</TableHead>
              <TableHead>Expected Stats</TableHead>
              <TableHead className="text-right">Bonus</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {players.map((player) => (
              <TableRow
                key={player.id}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {player.name}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {player.position}
                  </div>
                </TableCell>
                <TableCell>{player.club}</TableCell>
                <TableCell className="text-right">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>{player.points}</TooltipTrigger>
                      <TooltipContent>
                        <p>Goals: {player.goals * 4} pts</p>
                        <p>Assists: {player.assists * 3} pts</p>
                        <p>Clean Sheet: {player.cleanSheet ? "4" : "0"} pts</p>
                        <p>Bonus: {player.bonusPoints} pts</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell className="text-right">{player.selectedBy}</TableCell>
                <TableCell className="text-right">{player.goals}</TableCell>
                <TableCell className="text-right">{player.assists}</TableCell>
                <TableCell className="text-center">
                  {player.cleanSheet ? (
                    <Check className="mx-auto h-4 w-4 text-green-500" />
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="text-sm">{player.ictIndex}</div>
                    <Progress
                      value={parseFloat(player.ictIndex) * 5}
                      className="h-1"
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>xG: {player.xG}</div>
                    <div>xA: {player.xA}</div>
                    <div>
                      xGI:{" "}
                      {(
                        parseFloat(player.xG) + parseFloat(player.xA)
                      ).toFixed(2)}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {player.bonusPoints}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}