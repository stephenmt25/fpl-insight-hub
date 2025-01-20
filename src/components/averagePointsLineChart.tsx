"use client";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useContext } from "react";
import { LiveGWContext } from "@/context/livegw-context";

const chartConfig = {
  avgPoints: {
    label: "Average Points",
    color: "hsl(var(--chart-2))",
  }
} satisfies ChartConfig;

export function AveragePtsLineChart() {
  const { overallData } = useContext(LiveGWContext);
  // Sort the overallData by id
  const sortedData = Array.isArray(overallData)
    ? overallData
      .filter((item) => item.finished) // Optional: Filter only finished gameweeks
      .map((item) => ({
        id: item.id,
        gameweek: `GW ${item.id}`,
        avgPoints: item.average_entry_score,
      }))
      .sort((a, b) => a.id - b.id) // Sort by id
    : [];

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
            data={sortedData}
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
              cursor={true}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Line
              dataKey="avgPoints"
              type="natural"
              stroke="var(--color-avgPoints)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
