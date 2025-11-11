import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, Minus, RefreshCw, Calendar, Percent } from 'lucide-react';
import { PriceChangePrediction } from "@/lib/ml/types";

export function PriceChangePredictions() {
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState<PriceChangePrediction[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [gameweek, setGameweek] = useState<number>(0);
  const [selectedTab, setSelectedTab] = useState<'all' | 'rise' | 'fall'>('all');

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('predict-price-changes');

      if (error) throw error;

      setPredictions(data.predictions || []);
      setLastUpdated(data.generatedAt);
      setGameweek(data.gameweek);
    } catch (error) {
      console.error('Error fetching price predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, []);

  const risePredictions = predictions.filter(p => p.priceChangeDirection === 'rise');
  const fallPredictions = predictions.filter(p => p.priceChangeDirection === 'fall');

  const getPriorityIcon = (direction: string) => {
    switch (direction) {
      case 'rise':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'fall':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getConfidenceBadgeVariant = (confidence: string): "default" | "secondary" | "outline" => {
    switch (confidence) {
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const renderPredictionCard = (prediction: PriceChangePrediction) => (
    <div
      key={prediction.playerId}
      className="p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {getPriorityIcon(prediction.priceChangeDirection)}
            <span className="font-semibold text-foreground">{prediction.playerName}</span>
            <Badge variant="outline" className="text-xs">
              {prediction.position}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{prediction.teamName}</span>
            <span>•</span>
            <span>£{prediction.currentPrice.toFixed(1)}m</span>
          </div>
        </div>
        
        <div className="text-right">
          <div className={`text-2xl font-bold ${
            prediction.priceChangeDirection === 'rise' 
              ? 'text-green-600' 
              : 'text-red-600'
          }`}>
            {prediction.probability}%
          </div>
          <Badge variant={getConfidenceBadgeVariant(prediction.confidence)} className="text-xs mt-1">
            {prediction.confidence}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
        <div className="bg-muted/50 p-2 rounded">
          <div className="text-muted-foreground mb-1">Form</div>
          <div className="font-medium text-foreground">{prediction.form.toFixed(1)}</div>
        </div>
        <div className="bg-muted/50 p-2 rounded">
          <div className="text-muted-foreground mb-1">Ownership</div>
          <div className="font-medium text-foreground">{prediction.ownership.toFixed(1)}%</div>
        </div>
        <div className="bg-muted/50 p-2 rounded">
          <div className="text-muted-foreground mb-1">Net Δ</div>
          <div className={`font-medium ${
            prediction.transferDelta > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {prediction.transferDelta > 0 ? '+' : ''}{prediction.transferDelta.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
        <Calendar className="h-3 w-3" />
        <span>Expected: {prediction.expectedChangeDate}</span>
      </div>

      <div className="flex flex-wrap gap-1">
        {prediction.reasoning.slice(0, 3).map((reason, i) => (
          <Badge key={i} variant="secondary" className="text-xs">
            {reason}
          </Badge>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Price Change Predictions</CardTitle>
          <CardDescription>Loading predictions...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Price Change Predictions
              <Badge variant="secondary">ML Powered</Badge>
            </CardTitle>
            <CardDescription>
              Players likely to change price in the next 1-3 days (GW{gameweek})
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPredictions}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        {lastUpdated && (
          <div className="text-xs text-muted-foreground mt-2">
            Last updated: {new Date(lastUpdated).toLocaleString()} • Updates every 6 hours
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="all">
              All ({predictions.length})
            </TabsTrigger>
            <TabsTrigger value="rise" className="text-green-600">
              <TrendingUp className="h-4 w-4 mr-1" />
              Risers ({risePredictions.length})
            </TabsTrigger>
            <TabsTrigger value="fall" className="text-red-600">
              <TrendingDown className="h-4 w-4 mr-1" />
              Fallers ({fallPredictions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3">
            {predictions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No significant price change predictions at this time
              </p>
            ) : (
              predictions.slice(0, 20).map(renderPredictionCard)
            )}
          </TabsContent>

          <TabsContent value="rise" className="space-y-3">
            {risePredictions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No price rise predictions at this time
              </p>
            ) : (
              risePredictions.slice(0, 15).map(renderPredictionCard)
            )}
          </TabsContent>

          <TabsContent value="fall" className="space-y-3">
            {fallPredictions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No price fall predictions at this time
              </p>
            ) : (
              fallPredictions.slice(0, 15).map(renderPredictionCard)
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-4 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
          <p className="font-medium text-foreground mb-1">How it works:</p>
          <p>
            Predictions use net transfers, ownership %, form, and historical patterns to estimate 
            price changes. High confidence (70%+) predictions are most likely to occur within 1-2 days.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
