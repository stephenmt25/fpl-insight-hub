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
  id: number;
  event_total: number;
  player_name: string;
  rank: number;
  last_rank: number;
  rank_sort: number;
  total: number;
  entry: number;
  entry_name: string;
  has_played: boolean;
}

interface LeagueTableProps {
  onManagerSelect?: (manager: string) => void;
  leagueData: LeagueEntry[];
}

export function LeagueTable({ onManagerSelect, leagueData }: LeagueTableProps) {
  const getMovementIcon = (currentRank: number, lastRank: number) => {
    if (lastRank === 0 ) {
      return <Minus className="h-4 w-4 text-gray-500" />;
    } else if (currentRank < lastRank) {
      return <ArrowUp className="h-4 w-4 text-green-500" />;
    } else if (currentRank > lastRank) {
      return <ArrowDown className="h-4 w-4 text-red-500" />;
    } else {
      return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="rounded-md border max-h-screen	 overflow-y-auto no-scrollbar">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">Movement</TableHead>
            <TableHead className="w-[100px] text-center">Rank</TableHead>
            <TableHead>Team & Manager</TableHead>
            <TableHead className="text-center">GW Points</TableHead>
            <TableHead className="text-right">Total Points</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leagueData.map((entry) => (
            <TableRow
              key={entry.id}
              className="cursor-pointer hover:bg-gray-100"
              onClick={() => onManagerSelect?.(entry.player_name)}
            >
              <TableCell>
                <span className="flex justify-center">
                  {getMovementIcon(entry.rank, entry.last_rank)}
                </span>
              </TableCell>
              <TableCell className="font-medium text-center">{entry.rank}</TableCell>
              <TableCell>
                <div className="font-medium">{entry.entry_name}</div>
                <div className="text-gray-600 text-xs">{entry.player_name}</div>
              </TableCell>
              <TableCell className="text-center">{entry.event_total}</TableCell>
              <TableCell className="text-right">{entry.total}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}