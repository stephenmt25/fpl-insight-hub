"use client";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function AveragePtsLineChart() {
  const { data: gameweekData } = useQuery({
    queryKey: ['gameweekScores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fploveralldata')
        .select('name, average_entry_score, highest_score')
        .order('id', { ascending: true })
        .limit(6);

      if (error) throw error;

      return data.map(gw => ({
        gameweek: gw.name,
        avgPoints: gw.average_entry_score,
        top10kAvgPoints: gw.highest_score
      }));
    }
  });

  const chartConfig = {
    avgPoints: {
      label: "All Managers",
      color: "hsl(var(--chart-1))",
    },
    top10kAvgPoints: {
      label: "Top Score",
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Average Points</CardTitle>
        <CardDescription></CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart
            accessibilityLayer
            data={gameweekData || []}
            margin={{
              top: 20,
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="gameweek"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Line
              dataKey="avgPoints"
              type="linear"
              stroke="var(--color-avgPoints)"
              strokeWidth={2}
              dot={{
                fill: "var(--color-avgPoints)",
              }}
              activeDot={{
                r: 6,
              }}
            />
            <Line
              dataKey="top10kAvgPoints"
              type="linear"
              stroke="var(--color-top10kAvgPoints)"
              strokeWidth={2}
              dot={{
                fill: "var(--color-top10kAvgPoints)",
              }}
              activeDot={{
                r: 6,
              }}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}