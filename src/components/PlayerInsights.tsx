import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowDown, ArrowUp } from "lucide-react";

interface PlayerData {
  name: string;
  position: string;
  points: number;
  ownership: number;
  predictedPoints: number;
  trend: "up" | "down" | "neutral";
}

const mockData: PlayerData[] = [
  {
    name: "Erling Haaland",
    position: "FWD",
    points: 145,
    ownership: 85.4,
    predictedPoints: 8.5,
    trend: "up",
  },
  {
    name: "Mohamed Salah",
    position: "MID",
    points: 132,
    ownership: 45.2,
    predictedPoints: 7.8,
    trend: "down",
  },
  {
    name: "Bukayo Saka",
    position: "MID",
    points: 128,
    ownership: 38.7,
    predictedPoints: 7.2,
    trend: "up",
  },
];

export function PlayerInsights() {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <ArrowUp className="h-4 w-4 text-green-500" />;
      case "down":
        return <ArrowDown className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Top Performing Players</h2>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Player</TableHead>
              <TableHead>Position</TableHead>
              <TableHead className="text-right">Points</TableHead>
              <TableHead className="text-right">Ownership %</TableHead>
              <TableHead className="text-right">Predicted</TableHead>
              <TableHead className="text-right">Trend</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockData.map((player) => (
              <TableRow key={player.name}>
                <TableCell className="font-medium">{player.name}</TableCell>
                <TableCell>{player.position}</TableCell>
                <TableCell className="text-right">{player.points}</TableCell>
                <TableCell className="text-right">{player.ownership}%</TableCell>
                <TableCell className="text-right">
                  {player.predictedPoints}
                </TableCell>
                <TableCell className="text-right">
                  {getTrendIcon(player.trend)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}