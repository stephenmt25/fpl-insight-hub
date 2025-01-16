import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarChart } from "lucide-react";
import { LeagueSelector } from "./LeagueSelector";

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
  selectedLeague: string;
  pageNumber: string;
  setPageNumber: (pageNumber: any) => void;
  updateSelectedLeague: (leagueId: string) => void;
  hasNext: boolean;
  leagueId: string;
}

export function LeagueTable({ onManagerSelect, leagueData, selectedLeague, pageNumber, setPageNumber, updateSelectedLeague, hasNext, leagueId }: LeagueTableProps) {
  const getMovementIcon = (currentRank: number, lastRank: number) => {
    if (lastRank === 0) {
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
    <>
      <div className="p-2 items-center justify-between hidden lg:flex">
        <h3 className="text-lg font-medium">{selectedLeague} Standings</h3>
        <div className="flex gap-2 items-center">
          <div className="flex gap-2 items-center">
            <span className="whitespace-nowrap">Page: {pageNumber}</span>
            <Button
              variant="outline"
              disabled={parseInt(pageNumber) === 1}
              onClick={() => setPageNumber((prev) => (parseInt(prev) - 1).toString())}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={!hasNext}
              onClick={() => setPageNumber((prev) => (parseInt(prev) + 1).toString())}
            >
              Next
            </Button>
          </div>
          <div className="flex w-full gap-2">
            <div className="flex items-center">
              <BarChart className="h-4 w-4" />
              <label className="text-sm font-medium whitespace-nowrap">League Select:</label>
            </div>
            <LeagueSelector
              leagueId={leagueId}
              updateSelectedLeague={updateSelectedLeague}
            />
          </div>
        </div>
      </div>
      <div className="flex justify-between pb-2 lg:hidden">
        <div className="grid gap-2">
          <div className="flex w-full max-w-[75%]">
            <LeagueSelector
              leagueId={leagueId}
              updateSelectedLeague={updateSelectedLeague}
            />
          </div>
          <h3 className="px-1 text-lg font-medium">{selectedLeague} League Standings</h3>
        </div>
        <div className="grid gap-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={parseInt(pageNumber) === 1}
              onClick={() => setPageNumber((prev) => (parseInt(prev) - 1).toString())}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={!hasNext}
              onClick={() => setPageNumber((prev) => (parseInt(prev) + 1).toString())}
            >
              Next
            </Button>
          </div>
          <span className="whitespace-nowrap justify-self-end px-1">Page: {pageNumber}</span>
        </div>
      </div>
      <div className="rounded-md border max-h-screen	 overflow-y-auto no-scrollbar">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="max-w-[100px] lg:max-w-[50px] text-center">Movement</TableHead>
              <TableHead className="max-w-[50px] text-center lg:text-left">Rank</TableHead>
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
                <TableCell className="font-medium text-center lg:text-left">{entry.rank}</TableCell>
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
    </>
  );
}