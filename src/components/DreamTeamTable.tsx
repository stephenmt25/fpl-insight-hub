import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Shirt,
  Star,
  Flame,
  Check,
  Download,
  Search,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";

interface DreamTeamPlayer {
  id: number;
  name: string;
  position: string;
  club: string;
  points: number;
  selectedBy: string;
  minutes: number;
  goals: number;
  assists: number;
  cleanSheet: boolean;
  ictIndex: string;
  xG: string;
  xA: string;
  bonusPoints: number;
  dreamTeamPosition: string;
}

export function DreamTeamTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentGameweek, setCurrentGameweek] = useState("1");
  const [rowsPerPage, setRowsPerPage] = useState("20");

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

  // Mock data - replace with actual API data
  const mockPlayers: DreamTeamPlayer[] = [
    {
      id: 1,
      name: "Erling Haaland",
      position: "FWD",
      club: "MCI",
      points: 13,
      selectedBy: "85.2%",
      minutes: 90,
      goals: 2,
      assists: 1,
      cleanSheet: true,
      ictIndex: "15.2",
      xG: "1.52",
      xA: "0.35",
      bonusPoints: 3,
      dreamTeamPosition: "FWD1",
    },
    // Add more mock players as needed
  ];

  const filteredPlayers = mockPlayers.filter(
    (player) =>
      player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.club.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportData = () => {
    // Implement CSV export functionality
    console.log("Exporting data...");
  };

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

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
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
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search players or clubs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <Button onClick={exportData} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
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
              <TableHead className="text-right">Minutes</TableHead>
              <TableHead className="text-right">Goals</TableHead>
              <TableHead className="text-right">Assists</TableHead>
              <TableHead className="text-center">Clean Sheet</TableHead>
              <TableHead>ICT Index</TableHead>
              <TableHead>Expected Stats</TableHead>
              <TableHead className="text-right">Bonus</TableHead>
              <TableHead>Dream Team Pos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPlayers.map((player) => (
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
                <TableCell className="text-right">{player.minutes}</TableCell>
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
                <TableCell>{player.dreamTeamPosition}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center">
        <div>
          Displaying {filteredPlayers.length} of {mockPlayers.length} players
        </div>
        <Select
          value={rowsPerPage}
          onValueChange={(value) => setRowsPerPage(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Rows per page" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 rows per page</SelectItem>
            <SelectItem value="20">20 rows per page</SelectItem>
            <SelectItem value="50">50 rows per page</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
