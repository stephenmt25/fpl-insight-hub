import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlayerExplorer } from "@/hooks/use-player-explorer";
import { PlayerFilters } from "@/components/explore/PlayerFilters";
import { PlayerTable } from "@/components/explore/PlayerTable";
import { PlayerCompareDrawer } from "@/components/explore/PlayerCompareDrawer";
import { ChartBuilder } from "@/components/chart-builder/ChartBuilder";

export default function PlayerExplorer() {
  const {
    filters,
    updateFilter,
    resetFilters,
    sortField,
    sortDirection,
    toggleSort,
    players,
    totalCount,
    page,
    setPage,
    totalPages,
    isLoading,
    teams,
    compareIds,
    toggleCompare,
    comparePlayers,
    clearCompare,
  } = usePlayerExplorer();

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Player Explorer</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Search, filter, sort, and compare any player in the game.
        </p>
      </div>

      <Tabs defaultValue="table" className="space-y-4">
        <div className="w-full overflow-x-auto no-scrollbar">
          <TabsList className="w-full justify-start inline-flex min-w-max">
            <TabsTrigger value="table">Player Table</TabsTrigger>
            <TabsTrigger value="charts">Chart Builder</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="table" className="space-y-4">
          <PlayerFilters
            filters={filters}
            updateFilter={updateFilter}
            resetFilters={resetFilters}
            totalCount={totalCount}
          />

          {isLoading ? (
            <Skeleton className="h-[500px] w-full" />
          ) : (
            <PlayerTable
              players={players}
              teams={teams}
              sortField={sortField}
              sortDirection={sortDirection}
              toggleSort={toggleSort}
              page={page}
              setPage={setPage}
              totalPages={totalPages}
              totalCount={totalCount}
              compareIds={compareIds}
              toggleCompare={toggleCompare}
            />
          )}

          {comparePlayers.length > 0 && (
            <PlayerCompareDrawer
              players={comparePlayers}
              teams={teams}
              onClear={clearCompare}
              onRemove={toggleCompare}
            />
          )}
        </TabsContent>

        <TabsContent value="charts">
          <ChartBuilder />
        </TabsContent>
      </Tabs>
    </div>
  );
}
