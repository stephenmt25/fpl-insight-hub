import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, ChevronLeft, ChevronRight, GitCompareArrows } from "lucide-react";
import { getPositionLabel } from "@/utils/player-utils";
import type { SortField, SortDirection } from "@/hooks/use-player-explorer";
import type { Database } from "@/integrations/supabase/types";

type PlayerRow = Database['public']['Tables']['plplayerdata']['Row'];

interface PlayerTableProps {
  players: PlayerRow[];
  teams: { id: number; short_name: string }[] | null;
  sortField: SortField;
  sortDirection: SortDirection;
  toggleSort: (field: SortField) => void;
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
  totalCount: number;
  compareIds: number[];
  toggleCompare: (id: number) => void;
}

function SortHeader({ field, label, sortField, sortDirection, toggleSort }: {
  field: SortField; label: string; sortField: SortField; sortDirection: SortDirection;
  toggleSort: (f: SortField) => void;
}) {
  const isActive = sortField === field;
  return (
    <TableHead
      className="cursor-pointer select-none hover:text-foreground whitespace-nowrap"
      onClick={() => toggleSort(field)}
    >
      <span className="flex items-center gap-1">
        {label}
        <ArrowUpDown className={`h-3 w-3 ${isActive ? 'text-foreground' : 'text-muted-foreground/50'}`} />
        {isActive && <span className="text-[10px]">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
      </span>
    </TableHead>
  );
}

function StatusBadge({ status, news }: { status: string; news: string }) {
  if (status === 'a') return null;
  const variant = status === 'i' ? 'destructive' : status === 'd' ? 'secondary' : 'outline';
  const label = status === 'i' ? 'Injured' : status === 'u' ? 'Unavailable' : status === 'd' ? 'Doubt' : status === 's' ? 'Suspended' : status;
  return (
    <Badge variant={variant} className="text-[10px] ml-1" title={news}>
      {label}
    </Badge>
  );
}

export function PlayerTable({
  players, teams, sortField, sortDirection, toggleSort,
  page, setPage, totalPages, totalCount, compareIds, toggleCompare,
}: PlayerTableProps) {
  return (
    <div className="space-y-2">
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <SortHeader field="web_name" label="Player" sortField={sortField} sortDirection={sortDirection} toggleSort={toggleSort} />
              <TableHead>Pos</TableHead>
              <TableHead>Team</TableHead>
              <SortHeader field="now_cost" label="Price" sortField={sortField} sortDirection={sortDirection} toggleSort={toggleSort} />
              <SortHeader field="form" label="Form" sortField={sortField} sortDirection={sortDirection} toggleSort={toggleSort} />
              <SortHeader field="total_points" label="Pts" sortField={sortField} sortDirection={sortDirection} toggleSort={toggleSort} />
              <SortHeader field="ep_next" label="xPts" sortField={sortField} sortDirection={sortDirection} toggleSort={toggleSort} />
              <SortHeader field="ict_index" label="ICT" sortField={sortField} sortDirection={sortDirection} toggleSort={toggleSort} />
              <SortHeader field="selected_by_percent" label="Own%" sortField={sortField} sortDirection={sortDirection} toggleSort={toggleSort} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {players.map(player => {
              const isComparing = compareIds.includes(player.id);
              const teamName = teams?.find(t => t.id === player.team)?.short_name || '?';

              return (
                <TableRow key={player.id} className={isComparing ? 'bg-fpl-secondary/10' : ''}>
                  <TableCell className="p-1">
                    <button
                      onClick={() => toggleCompare(player.id)}
                      className={`p-1 rounded ${isComparing ? 'text-fpl-secondary' : 'text-muted-foreground/40 hover:text-muted-foreground'}`}
                      title={isComparing ? 'Remove from compare' : 'Add to compare'}
                    >
                      <GitCompareArrows className="h-3.5 w-3.5" />
                    </button>
                  </TableCell>
                  <TableCell className="font-medium whitespace-nowrap">
                    {player.web_name}
                    <StatusBadge status={player.status || ''} news={player.news || ''} />
                  </TableCell>
                  <TableCell className="text-xs">{getPositionLabel(player.element_type)}</TableCell>
                  <TableCell className="text-xs">{teamName}</TableCell>
                  <TableCell>{((player.now_cost || 0) / 10).toFixed(1)}</TableCell>
                  <TableCell className={parseFloat(player.form || '0') >= 6 ? 'text-green-500 font-medium' : ''}>{player.form}</TableCell>
                  <TableCell className="font-medium">{player.total_points}</TableCell>
                  <TableCell>{player.ep_next}</TableCell>
                  <TableCell>{player.ict_index}</TableCell>
                  <TableCell>{player.selected_by_percent}%</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {page * 50 + 1}–{Math.min((page + 1) * 50, totalCount)} of {totalCount}
        </span>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 0}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page >= totalPages - 1}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
