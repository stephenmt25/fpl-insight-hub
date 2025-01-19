import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export function DreamTeamTable({ liveGameweek }: { liveGameweek: number }) {
  const [currentGameweek, setCurrentGameweek] = useState(liveGameweek.toString());
  const [players, setPlayers] = useState<DreamTeamPlayer[]>([]);

  const { data: dreamTeamData, isLoading: isDreamTeamLoading } = useQuery({
    queryKey: ['dreamTeam', currentGameweek],
    queryFn: () => playerService.getGameweekDreamTeam(currentGameweek),
  });

  const { data: liveData, isLoading: isLiveDataLoading } = useQuery({
    queryKey: ['liveGameweek', currentGameweek],
    queryFn: () => playerService.getGameweekPlayerStats(currentGameweek),
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
        const playerDetails = playerData?.find(p => p.id === dreamTeamMember.element);
        const liveStats = liveData.elements.find(e => e.id === dreamTeamMember.element)?.stats;

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
          goals: liveStats.goals_scored,
          assists: liveStats.assists,
          cleanSheet: liveStats.clean_sheets === 1,
          ictIndex: liveStats.ict_index,
          xG: liveStats.expected_goals,
          xA: liveStats.expected_assists,
          bonusPoints: liveStats.bonus,
        };
      }).filter((player): player is DreamTeamPlayer => player !== null);

      setPlayers(dreamTeamPlayers);
    };

    fetchPlayerDetails();
  }, [dreamTeamData, liveData]);

  const getPositionIcon = (position: string) => {
    switch (position) {
      case "DEF":
        return <Shield className="h-4 w-4" />;
      case "FWD":
        return <Shirt className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getPerformanceIcon = (points: number, ictIndex: string) => {
    if (points > 10) return <Star className="h-4 w-4 text-yellow-500" />;
    if (parseFloat(ictIndex) > 10)
      return <Flame className="h-4 w-4 text-orange-500" />;
    return null;
  };

  const getRowStyle = (points: number) => {
    if (points > 10) return "bg-green-50";
    if (points < 5) return "bg-red-50";
    return "";
  };

  if (isDreamTeamLoading || isLiveDataLoading) {
    return <div>Loading dream team data...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold">
          Dream Team Performance – Gameweek {currentGameweek}
        </h2>
        <p className="text-muted-foreground">
          An overview of the top performers in Fantasy Premier League for this
          gameweek.
        </p>
      </div>

      <div className="flex justify-center mb-4">
        <Select
          value={currentGameweek}
          onValueChange={(value) => setCurrentGameweek(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Gameweek" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 38 }, (_, i) => (
              <SelectItem key={i + 1} value={(i + 1).toString()}>
                Gameweek {i + 1}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
                className={getRowStyle(player.points)}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {player.name}
                    {getPerformanceIcon(player.points, player.ictIndex)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {player.position}
                    {getPositionIcon(player.position)}
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