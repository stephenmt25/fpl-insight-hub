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
  manager: string;
  points: number;
  gwPoints: number;
  movement: "up" | "down" | "same";
  transfers: number;
}

interface LeagueTableProps {
  onManagerSelect?: (manager: string) => void;
}

const mockData: LeagueEntry[] = [
  {
    rank: 1,
    team: "Team Alpha",
    manager: "John Doe",
    points: 1587,
    gwPoints: 78,
    movement: "up",
    transfers: 2,
  },
  {
    rank: 2,
    team: "Your Team",
    manager: "You",
    points: 1234,
    gwPoints: 65,
    movement: "down",
    transfers: 1,
  },
  {
    rank: 3,
    team: "Team Beta",
    manager: "Jane Smith",
    points: 1100,
    gwPoints: 55,
    movement: "same",
    transfers: 0,
  },
  {
    rank: 4,
    team: "Team Gamma",
    manager: "Bob Wilson",
    points: 1050,
    gwPoints: 62,
    movement: "up",
    transfers: 1,
  },
  {
    rank: 5,
    team: "Team Delta",
    manager: "Alice Brown",
    points: 980,
    gwPoints: 45,
    movement: "down",
    transfers: 2,
  },
];

export function LeagueTable({ onManagerSelect }: LeagueTableProps) {
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
            <TableHead className="w-[80px]">Rank</TableHead>
            <TableHead>Team</TableHead>
            <TableHead>Manager</TableHead>
            <TableHead className="text-right">Points</TableHead>
            <TableHead className="text-right">GW Points</TableHead>
            <TableHead className="w-[100px] text-right">Movement</TableHead>
            <TableHead className="text-right">Transfers</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mockData.map((entry) => (
            <TableRow
              key={entry.rank}
              className={`${
                entry.team === "Your Team" ? "bg-gray-50" : ""
              } cursor-pointer hover:bg-gray-100`}
              onClick={() =>
                onManagerSelect?.(
                  entry.team === "Your Team" ? null : entry.team
                )
              }
            >
              <TableCell className="font-medium">{entry.rank}</TableCell>
              <TableCell>{entry.team}</TableCell>
              <TableCell>{entry.manager}</TableCell>
              <TableCell className="text-right">{entry.points}</TableCell>
              <TableCell className="text-right">{entry.gwPoints}</TableCell>
              <TableCell className="text-right">
                {getMovementIcon(entry.movement)}
              </TableCell>
              <TableCell className="text-right">{entry.transfers}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}