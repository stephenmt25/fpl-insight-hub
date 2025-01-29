import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlayerInsights } from "@/components/PlayerInsights";
import { FixtureDifficulty } from "@/components/FixtureDifficulty";
import { TransferSuggestions } from "@/components/TransferSuggestions";
import { HistoricalTrends } from "@/components/HistoricalTrends";
import { ArrowRightLeft, CalendarRange, Lightbulb, TrendingUpDown } from "lucide-react";

export default function Insights() {
  return (
    <div className="space-y-4 pb-14 md:pb-0">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-center">
          Actionable Insights for Your FPL Success
        </h1>
      </div>

      <Tabs defaultValue="transfer-suggestions" className="space-y-4">
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t md:hidden">
          <TabsList className="w-full h-18 rounded-none bg-gray-900 justify-around">
            <TabsTrigger value="player-insights" className="w-full h-full flex-col"><Lightbulb />Insights</TabsTrigger>
            <TabsTrigger value="fixture-difficulty" className="w-full h-full flex-col"><CalendarRange />Fixtures</TabsTrigger>
            <TabsTrigger value="transfer-suggestions" className="w-full h-full flex-col"><ArrowRightLeft />Transfers</TabsTrigger>
            <TabsTrigger value="historical-trends" className="w-full h-full flex-col"><TrendingUpDown />Trends</TabsTrigger>
          </TabsList>
        </div>

        <div className="hidden md:block w-full overflow-x-auto no-scrollbar">
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