import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";
import type { FormTrendPrediction } from "@/lib/ml/types";

export function FormTrendAnalyzer() {
  const { data, isLoading } = useQuery({
    queryKey: ['form-trends'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('predict-form-trends');
      if (error) throw error;
      return data as { predictions: FormTrendPrediction[] };
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
  });

  const predictions = data?.predictions || [];

  const risingPlayers = predictions.filter(p => p.trend === 'rising');
  const fallingPlayers = predictions.filter(p => p.trend === 'falling');
  const stablePlayers = predictions.filter(p => p.trend === 'stable');

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Form Trend Analyzer
          </CardTitle>
          <CardDescription>
            Time series analysis predicting player form over next 3 gameweeks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Form Trend Analyzer
        </CardTitle>
        <CardDescription>
          Time series predictions for next 3 gameweeks • {predictions.length} players analyzed
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="rising" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="rising">
              <TrendingUp className="h-4 w-4 mr-2" />
              Rising ({risingPlayers.length})
            </TabsTrigger>
            <TabsTrigger value="falling">
              <TrendingDown className="h-4 w-4 mr-2" />
              Falling ({fallingPlayers.length})
            </TabsTrigger>
            <TabsTrigger value="stable">
              <Minus className="h-4 w-4 mr-2" />
              Stable ({stablePlayers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rising" className="space-y-4 mt-4">
            {risingPlayers.slice(0, 20).map(player => (
              <PlayerTrendCard key={player.playerId} player={player} />
            ))}
          </TabsContent>

          <TabsContent value="falling" className="space-y-4 mt-4">
            {fallingPlayers.slice(0, 20).map(player => (
              <PlayerTrendCard key={player.playerId} player={player} />
            ))}
          </TabsContent>

          <TabsContent value="stable" className="space-y-4 mt-4">
            {stablePlayers.slice(0, 20).map(player => (
              <PlayerTrendCard key={player.playerId} player={player} />
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function PlayerTrendCard({ player }: { player: FormTrendPrediction }) {
  const getTrendIcon = () => {
    switch (player.trend) {
      case 'rising': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'falling': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'bg-green-500/20 text-green-700 dark:text-green-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400';
      default: return 'bg-red-500/20 text-red-700 dark:text-red-400';
    }
  };

  // Prepare chart data
  const chartData = [
    ...player.gameweeks.map((gw, i) => ({
      gameweek: `GW${gw}`,
      actual: player.historicalForm[i],
      predicted: null,
    })),
    ...player.predictedForm.map(pred => ({
      gameweek: `GW${pred.gameweek}`,
      actual: null,
      predicted: pred.predictedPoints,
    }))
  ];

  return (
    <Card className="border-l-4" style={{
      borderLeftColor: player.trend === 'rising' ? 'rgb(34, 197, 94)' : 
                       player.trend === 'falling' ? 'rgb(239, 68, 68)' : 
                       'rgb(156, 163, 175)'
    }}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {getTrendIcon()}
              {player.playerName}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Badge variant="outline">{player.position}</Badge>
              <span>{player.teamName}</span>
            </CardDescription>
          </div>
          <Badge className={getConfidenceColor(player.overallConfidence)}>
            {player.overallConfidence} confidence
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Current Form</p>
            <p className="font-semibold text-lg">{player.currentForm.toFixed(1)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Trend Strength</p>
            <p className="font-semibold text-lg">{player.trendStrength.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Momentum</p>
            <p className="font-semibold text-lg">{player.momentum.toFixed(1)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Volatility</p>
            <p className="font-semibold text-lg">{player.volatility.toFixed(1)}</p>
          </div>
        </div>

        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="gameweek" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="actual" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Historical"
                dot={{ r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="predicted" 
                stroke="hsl(var(--accent))" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Predicted"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Predictions (Next 3 GWs):</p>
          <div className="flex gap-2">
            {player.predictedForm.map(pred => (
              <Badge key={pred.gameweek} variant="secondary" className="flex-1 justify-center py-2">
                GW{pred.gameweek}: {pred.predictedPoints} pts
                <span className="text-xs ml-1 opacity-70">
                  ({(pred.confidence * 100).toFixed(0)}%)
                </span>
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {player.reasoning.map((reason, i) => (
            <Badge key={i} variant="outline" className="text-xs">
              {reason}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
