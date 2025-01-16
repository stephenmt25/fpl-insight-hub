import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlayerInsights } from "@/components/PlayerInsights";
import { FixtureDifficulty } from "@/components/FixtureDifficulty";
import { TransferSuggestions } from "@/components/TransferSuggestions";
import { HistoricalTrends } from "@/components/HistoricalTrends";

export default function Insights() {
  return (
    <div className="space-y-2">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">
          Actionable Insights for Your FPL Success
        </h1>
        <p className="text-muted-foreground">
          Discover trends, find top players, and plan your transfers with
          data-driven recommendations.
        </p>
      </div>

      <Tabs defaultValue="transfer-suggestions" className="space-y-4">
        <div className="w-full overflow-x-auto no-scrollbar">
          <TabsList className="w-full justify-start inline-flex min-w-max">
            <TabsTrigger value="player-insights">Player Insights</TabsTrigger>
            <TabsTrigger value="fixture-difficulty">Fixture Difficulty</TabsTrigger>
            <TabsTrigger value="transfer-suggestions">
              Transfer Suggestions
            </TabsTrigger>
            <TabsTrigger value="historical-trends">Historical Trends</TabsTrigger>
          </TabsList>
        </div>


        <TabsContent value="player-insights" className="space-y-4">
          <PlayerInsights />
        </TabsContent>

        <TabsContent value="fixture-difficulty" className="space-y-4">
          <FixtureDifficulty />
        </TabsContent>

        <TabsContent value="transfer-suggestions" className="space-y-4">
          <TransferSuggestions />
        </TabsContent>

        <TabsContent value="historical-trends" className="space-y-4">
          <HistoricalTrends />
        </TabsContent>
      </Tabs>
    </div>
  );
}