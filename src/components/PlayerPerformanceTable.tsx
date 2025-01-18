import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Star, AlertCircle, Minus } from "lucide-react";

interface Player {
  name: string;
  team: string;
  position: string;
  points: number;
  performance: 'exceptional' | 'average' | 'poor';
}

interface PlayerPerformanceTableProps {
  players: Player[];
}

export function PlayerPerformanceTable({ players }: PlayerPerformanceTableProps) {
  const getPerformanceIcon = (performance: string) => {
    switch (performance) {
      case 'exceptional':
        return <Star className="h-4 w-4 text-yellow-500" />;
      case 'poor':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Player</TableHead>
            <TableHead>Position</TableHead>
            <TableHead className="text-center">Points</TableHead>
            <TableHead className="text-center">Performance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.map((player) => (
            <TableRow key={player.name} className="hover:bg-gray-100">
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <span>{player.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({player.team})
                  </span>
                </div>
              </TableCell>
              <TableCell>{player.position}</TableCell>
              <TableCell className="text-center">{player.points}</TableCell>
              <TableCell className="flex justify-center">
                {getPerformanceIcon(player.performance)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}