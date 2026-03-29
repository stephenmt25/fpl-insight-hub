import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PriceChangePredictions } from "@/components/ml/PriceChangePredictions";
import { DifferentialPicks } from "@/components/DifferentialPicks";
import { FormTrendAnalyzer } from "@/components/ml/FormTrendAnalyzer";
import { CardHeader, CardTitle } from "@/components/ui/card";

export default function Insights() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-center">
          ML-Powered Insights for Your FPL Success
        </h1>
        <p className="text-center text-muted-foreground text-sm">
          Advanced analytics and predictions using machine learning
        </p>
      </div>

      <Tabs defaultValue="differential-picks" className="space-y-4">
        <div className="w-full overflow-x-auto no-scrollbar">
          <TabsList className="w-full justify-start inline-flex min-w-max">
            <TabsTrigger value="differential-picks">Differential Picks</TabsTrigger>
            <TabsTrigger value="price-predictions">Price Predictions</TabsTrigger>
            <TabsTrigger value="form-trends">Form Trends</TabsTrigger>
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