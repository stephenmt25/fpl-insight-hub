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
import { useEffect, useState } from "react";
import { managerService } from "@/services/fpl-api";
import { supabase } from "@/integrations/supabase/client";

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
  gameweekNumber?: number;
  rowsPerPage?: number;
}

export function LeagueTable({
  onManagerSelect,
  leagueData,
  selectedLeague,
  pageNumber,
  setPageNumber,
  updateSelectedLeague,
  hasNext,
  leagueId,
  gameweekNumber = 21,
  rowsPerPage = 10,
}: LeagueTableProps) {
  const [rowsToDisplay, setRowsToDisplay] = useState(rowsPerPage);
  const [enhancedRows, setEnhancedRows] = useState({});

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

  useEffect(() => {
    const fetchDataForVisibleRows = async () => {
      const visibleEntries = leagueData.slice(0, rowsToDisplay);

      const updatedData = await Promise.all(
        visibleEntries.map(async (entry) => {
          if (enhancedRows[entry.id]) {
            // If data already exists, skip fetch
            return enhancedRows[entry.id];
          }

          try {
            const teamPicks = await managerService.getGameweekTeamPicks(
              String(entry.entry),
              String(gameweekNumber)
            );

            const captainPick = teamPicks.picks.find((pick) => pick.is_captain)?.element || "N/A";
            const chipUsed = teamPicks.active_chip || "";
            const transferCost = teamPicks.entry_history.event_transfers_cost || 0;
            let captainName;

            if (captainPick) {
              const { data: playerData, error: playerError } = await supabase
                .from('plplayerdata')
                .select()
                .eq('id', Number(captainPick));

              if (playerError) {
                console.error('Error fetching most-captained player data:', playerError);
                return;
              }

              captainName = playerData[0].web_name;
            }

            return {
              ...entry,
              chipUsed,
              transferCost,
              captainName,
            };
          } catch (error) {
            console.error(`Error fetching data for entry ${entry.entry}:`, error);
            return {
              ...entry,
              chipUsed: "Error",
              transferCost: "Error",
              captainPick: "Error",
            };
          }
        })
      );

      setEnhancedRows((prev) => ({
        ...prev,
        ...Object.fromEntries(updatedData.map((row) => [row.id, row])),
      }));
    };

    fetchDataForVisibleRows();
  }, [rowsToDisplay, leagueData, gameweekNumber]);

  const loadMoreRows = () => {
    if (rowsToDisplay < leagueData.length) {
      setRowsToDisplay((prev) => Math.min(prev + 10, leagueData.length));
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
              onClick={() => [setPageNumber((prev) => (parseInt(prev) - 1).toString()), setRowsToDisplay(10)]}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={!hasNext}
              onClick={() => [setPageNumber((prev) => (parseInt(prev) + 1).toString()), setRowsToDisplay(10)]}
            >
              Next
            </Button>
          </div>
          <div className="flex w-full gap-2">
            <div className="flex items-center">
              <BarChart className="h-4 w-4" />
              <label className="text-sm font-medium whitespace-nowrap">League Select:</label>
            </div>
            <LeagueSelector leagueId={leagueId} updateSelectedLeague={updateSelectedLeague} />
          </div>
        </div>
      </div>
      <div className="rounded-md border max-h-screen overflow-y-auto no-scrollbar">
        <div className="flex justify-between px-4 py-2 bg-gray-100">
          <span className="text-sm text-gray-600">
            Showing {Math.min(rowsToDisplay, leagueData.length)}/{leagueData.length} entries
          </span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="max-w-[100px] lg:max-w-[50px] text-center"></TableHead>
              <TableHead className="max-w-[50px] text-center lg:text-left">Rank [Prev]</TableHead>
              <TableHead>Team & Manager</TableHead>
              <TableHead className="text-center">Chip</TableHead>
              <TableHead className="text-center">GW Points</TableHead>
              <TableHead className="text-center">Hits</TableHead>
              <TableHead className="text-center">Total Points</TableHead>
              <TableHead className="text-center">Captain</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leagueData.slice(0, rowsToDisplay).map((entry) => {
              const enhancedRow = enhancedRows[entry.id] || entry;
              return (
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
                  <TableCell className="text-center lg:text-left">
                    {entry.rank} [{entry.last_rank}]
                  </TableCell>
                  <TableCell>
                    <div>{entry.entry_name}</div>
                    <div className="text-gray-600 text-xs">{entry.player_name}</div>
                  </TableCell>
                  <TableCell className="text-center">{enhancedRow.chipUsed || ""}</TableCell>
                  <TableCell className="text-center">{entry.event_total}</TableCell>
                  <TableCell className="text-center">{enhancedRow.transferCost || ""}</TableCell>
                  <TableCell className="text-center">{entry.total}</TableCell>
                  <TableCell className="text-center">{enhancedRow.captainName || "Loading..."}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        {rowsToDisplay < leagueData.length && (
          <div className="p-2">
            <Button
              className="w-full"
              variant="outline"
              onClick={loadMoreRows}
            >
              Load More
            </Button>
          </div>
        )}
        <div className="flex justify-between px-4 py-2 bg-gray-100">
          <span className="text-sm text-gray-600">
            Showing {Math.min(rowsToDisplay, leagueData.length)}/{leagueData.length} entries
          </span>
        </div>
      </div>
      <div className="mt-4 flex justify-between">
        <span>Page: {pageNumber}</span>
        <div className="gap-2 flex">
          <Button
            variant="outline"
            disabled={parseInt(pageNumber) === 1}
            onClick={() => [setPageNumber((prev) => (parseInt(prev) - 1).toString()), setRowsToDisplay(10)]}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            disabled={!hasNext}
            onClick={() => [setPageNumber((prev) => (parseInt(prev) + 1).toString()), setRowsToDisplay(10)]}
          >
            Next
          </Button>
        </div>
      </div>
    </>
  );
}


