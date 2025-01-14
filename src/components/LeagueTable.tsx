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
  gwPoints: number;
  total_points: number;
  movement: "up" | "down" | "same";
  transfers: number
}

interface LeagueTableProps {
  onManagerSelect?: (manager: string) => void;
}

const mockData: LeagueEntry[] = [
  {
    rank: 1,
    team: "The Invincibles",
    manager: "Alex Ferguson",
    gwPoints: 85,
    total_points: 1020,
    movement: "up",
    transfers: 2
  },
  {
    rank: 2,
    team: "Goal Diggers",
    manager: "Pep Guardiola",
    gwPoints: 78,
    total_points: 1012,
    movement: "down",
    transfers: 2
  },
  {
    rank: 3,
    team: "Penalty Kings",
    manager: "Jurgen Klopp",
    gwPoints: 80,
    total_points: 1008,
    movement: "same",
    transfers: 2
  },
  {
    rank: 4,
    team: "Clean Sheet Warriors",
    manager: "Jose Mourinho",
    gwPoints: 72,
    total_points: 995,
    movement: "same",
    transfers: 2
  },
  {
    rank: 5,
    team: "The Flying Dutchmen",
    manager: "Louis van Gaal",
    gwPoints: 67,
    total_points: 980,
    movement: "up",
    transfers: 2
  },
  {
    rank: 6,
    team: "Tactical Masters",
    manager: "Antonio Conte",
    gwPoints: 75,
    total_points: 970,
    movement: "up",
    transfers: 2
  },
  {
    rank: 7,
    team: "Striker’s Army",
    manager: "Carlo Ancelotti",
    gwPoints: 65,
    total_points: 950,
    movement: "same",
    transfers: 2
  },
  {
    rank: 8,
    team: "Midfield Magicians",
    manager: "Zinedine Zidane",
    gwPoints: 69,
    total_points: 920,
    movement: "down",
    transfers: 2
  },
  {
    rank: 9,
    team: "Defensive Masters",
    manager: "Rafael Benitez",
    gwPoints: 60,
    total_points: 900,
    movement: "down",
    transfers: 2
  },
  {
    rank: 10,
    team: "Super Strikers",
    manager: "Mauricio Pochettino",
    gwPoints: 63,
    total_points: 880,
    movement: "same",
    transfers: 2
  }
]




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
            <TableHead className="w-[100px]">Rank</TableHead>
            <TableHead>Team & Manager</TableHead>
            <TableHead className="text-right">GW Points</TableHead>
            <TableHead className="text-right">Total Points</TableHead>
            <TableHead className="w-[100px] text-right">Movement</TableHead>
            <TableHead className="text-right">Transfers</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mockData.map((entry) => (
            <TableRow
              key={entry.rank}
              // className={entry.team === "Your Team" ? "bg-gray-50" : ""}
              className={`${entry.team === "Your Team" ? "bg-gray-50" : ""} cursor-pointer hover:bg-gray-100`}
              onClick={() =>
                onManagerSelect?.(
                  entry.team === "Your Team" ? null : entry.team
                )
              }
            >
              <TableCell className="font-medium">{entry.rank}</TableCell>
              <TableCell>
                <div className="font-medium">{entry.team}</div>
                <div className="text-gray-600 text-xs">{entry.manager}</div>
              </TableCell>
              <TableCell className="text-right">{entry.gwPoints}</TableCell>
              <TableCell className="text-right">{entry.total_points}</TableCell>
              <TableCell className="align-right">
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