import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PriceChangePredictions } from "@/components/ml/PriceChangePredictions";
import { DifferentialPicks } from "@/components/DifferentialPicks";
import { FormTrendAnalyzer } from "@/components/ml/FormTrendAnalyzer";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { HistoricalFormGenerator } from "@/components/ml/HistoricalFormGenerator";
import { ArrowRightLeft, CalendarRange, Lightbulb, TrendingUpDown, Brain, LineChart } from "lucide-react";

export default function Insights() {
  return (
    <div className="space-y-4 pb-14 md:pb-0">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-center">
          ML-Powered Insights for Your FPL Success
        </h1>
        <p className="text-center text-muted-foreground text-sm">
          Advanced analytics and predictions using machine learning
        </p>
      </div>

      <Tabs defaultValue="differential-picks" className="space-y-4">
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t md:hidden">
          <TabsList className="w-full h-18 rounded-none bg-gray-900 justify-around">
            <TabsTrigger value="differential-picks" className="w-full h-full flex-col"><Brain className="h-5 w-5" /><span className="text-xs">Diffs</span></TabsTrigger>
            <TabsTrigger value="price-predictions" className="w-full h-full flex-col"><TrendingUpDown className="h-5 w-5" /><span className="text-xs">Prices</span></TabsTrigger>
            <TabsTrigger value="form-trends" className="w-full h-full flex-col"><LineChart className="h-5 w-5" /><span className="text-xs">Trends</span></TabsTrigger>
          </TabsList>
        </div>

        <div className="hidden md:block w-full overflow-x-auto no-scrollbar">
          <TabsList className="w-full justify-start inline-flex min-w-max">
            <TabsTrigger value="differential-picks">Differential Picks</TabsTrigger>
            <TabsTrigger value="price-predictions">Price Change Predictions</TabsTrigger>
            <TabsTrigger value="form-trends">Form Trend Analyzer</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="differential-picks" className="space-y-4">
          <CardHeader>
            <CardTitle>Player Cluster Analysis</CardTitle>
          </CardHeader>
          <DifferentialPicks />
        </TabsContent>

        <TabsContent value="price-predictions" className="space-y-4">
          <PriceChangePredictions />
        </TabsContent>

        <TabsContent value="form-trends" className="space-y-4">
          <FormTrendAnalyzer />
        </TabsContent>
      </Tabs>
    </div>
  );
}