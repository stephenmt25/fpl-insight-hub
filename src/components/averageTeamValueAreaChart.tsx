"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartData = [
  { gameweek: "GW1", top10k: 100.5, allManagers: 100.3 },
  { gameweek: "GW2", top10k: 101.2, allManagers: 100.1 },
  { gameweek: "GW3", top10k: 102.0, allManagers: 100.0 },
  { gameweek: "GW4", top10k: 103.1, allManagers: 101.5 },
  { gameweek: "GW5", top10k: 104.5, allManagers: 102.2 },
  { gameweek: "GW6", top10k: 105.8, allManagers: 103.7 },
];

const chartConfig = {
  top10k: {
    label: "Top 10k",
    color: "hsl(var(--chart-2))",
  },
  allManagers: {
    label: "All Managers",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export function AverageTeamValueAreaChart() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardDescription>
          Average Team Value
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
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
            <YAxis
              domain={[93, 107]}
              tickLine={false}
              axisLine={false}
              tickMargin={38}
              hide
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />

            <Area
              dataKey="allManagers"
              type="natural"
              fill="var(--color-allManagers)"
              fillOpacity={0.4}
              stroke="var(--color-allManagers)"
            />
                        <Area
              dataKey="top10k"
              type="natural"
              fill="var(--color-top10k)"
              fillOpacity={0.4}
              stroke="var(--color-top10k)"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
