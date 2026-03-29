import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { PlayerFilters as FiltersType } from "@/hooks/use-player-explorer";

interface PlayerFiltersProps {
  filters: FiltersType;
  updateFilter: (partial: Partial<FiltersType>) => void;
  resetFilters: () => void;
  totalCount: number;
}

export function PlayerFilters({ filters, updateFilter, resetFilters, totalCount }: PlayerFiltersProps) {
  const hasActiveFilters = filters.positions.length > 0 || filters.teams.length > 0 ||
    filters.search !== '' || filters.minForm > 0 || filters.minPrice > 3.5 || filters.maxPrice < 16;

  return (
    <div className="space-y-3">
      {/* Search */}
      <Input
        placeholder="Search player..."
        value={filters.search}
        onChange={e => updateFilter({ search: e.target.value })}
        className="max-w-sm"
      />

      <div className="flex flex-wrap items-center gap-3">
        {/* Position filter */}
        <ToggleGroup
          type="multiple"
          value={filters.positions.map(String)}
          onValueChange={vals => updateFilter({ positions: vals.map(Number) })}
          className="justify-start"
        >
          <ToggleGroupItem value="1" className="text-xs px-2.5">GK</ToggleGroupItem>
          <ToggleGroupItem value="2" className="text-xs px-2.5">DEF</ToggleGroupItem>
          <ToggleGroupItem value="3" className="text-xs px-2.5">MID</ToggleGroupItem>
          <ToggleGroupItem value="4" className="text-xs px-2.5">FWD</ToggleGroupItem>
        </ToggleGroup>

        {/* Price range */}
        <div className="flex items-center gap-1 text-xs">
          <span className="text-muted-foreground">Price:</span>
          <Input
            type="number"
            step="0.5"
            min="3.5"
            max="16"
            value={filters.minPrice}
            onChange={e => updateFilter({ minPrice: parseFloat(e.target.value) || 3.5 })}
            className="w-16 h-8 text-xs"
          />
          <span>-</span>
          <Input
            type="number"
            step="0.5"
            min="3.5"
            max="16"
            value={filters.maxPrice}
            onChange={e => updateFilter({ maxPrice: parseFloat(e.target.value) || 16 })}
            className="w-16 h-8 text-xs"
          />
        </div>

        {/* Result count + reset */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-muted-foreground">{totalCount} players</span>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-7 text-xs">
              <X className="h-3 w-3 mr-1" />Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
