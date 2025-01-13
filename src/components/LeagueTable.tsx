import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";

interface LeagueEntry {
  rank: number;
  team: string;
  points: number;
  movement: "up" | "down" | "same";
}

const mockData: LeagueEntry[] = [
  { rank: 1, team: "Team Alpha", points: 1587, movement: "up" },
  { rank: 2, team: "Your Team", points: 1234, movement: "down" },
  { rank: 3, team: "Team Beta", points: 1100, movement: "same" },
  { rank: 4, team: "Team Gamma", points: 1050, movement: "up" },
  { rank: 5, team: "Team Delta", points: 980, movement: "down" },
];

export function LeagueTable() {
  const getMovementIcon = (movement: string) => {
    switch (movement) {
      case "up":
        return <ArrowUp className="h-4 w-4 text-green-500" />;
      case "down":
        return <ArrowDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Rank</TableHead>
            <TableHead>Team</TableHead>
            <TableHead className="text-right">Points</TableHead>
            <TableHead className="w-[100px] text-right">Movement</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mockData.map((entry) => (
            <TableRow
              key={entry.rank}
              className={entry.team === "Your Team" ? "bg-gray-50" : ""}
            >
              <TableCell className="font-medium">{entry.rank}</TableCell>
              <TableCell>{entry.team}</TableCell>
              <TableCell className="text-right">{entry.points}</TableCell>
              <TableCell className="text-right">
                {getMovementIcon(entry.movement)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}