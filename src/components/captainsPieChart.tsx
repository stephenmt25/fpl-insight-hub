"use client"

import { TrendingUp } from "lucide-react"
import { Cell, Pie, PieChart, Sector } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import React from "react"

const chartData = [
  { name: 'Salah', value: 400, fill: "hsl(var(--chart-1))" },
  { name: 'Haaland', value: 250, fill: "hsl(var(--chart-2))" },
  { name: 'Palmer', value: 100, fill: "hsl(var(--chart-3))" },
  { name: 'Watkins', value: 20, fill: "hsl(var(--chart-4))" },
];

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload } = props;

  return (
    <g>
      <text x={cx} y={cy} dy={8} className='text-2xl' textAnchor="middle" fill={fill}>
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
    </g>
  );
};

const chartConfig = {
  Salah: {
    label: "Salah",
    color: "hsl(var(--chart-1))",
  },
  Haaland: {
    label: "Haaland",
    color: "hsl(var(--chart-2))",
  },
  Palmer: {
    label: "Palmer",
    color: "hsl(var(--chart-3))",
  },
  Watkins: {
    label: "Watkins",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig

export function CaptaincyPieChart() {
  const [activeIndex, setActiveIndex] = React.useState(0);


  const onPieEnter = (_: any, index: any) => {
    setActiveIndex(index);
  };
  return (
    <Card>
      <CardHeader className="items-center pb-4">
        <CardTitle>Top 5 Captains Distribution</CardTitle>
        <CardDescription>
          
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart width={400} height={400}>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value: number, name: string) => (
                    <div className="flex min-w-full items-center text-xs text-muted-foreground">
                      <div
                        className="h-2.5 w-2.5 shrink-0 mr-auto rounded-[2px] bg-[--color-bg]"
                        style={
                          {
                            "--color-bg": `var(--color-${name})`,
                          } as React.CSSProperties
                        }
                      />
                      {chartConfig[name as keyof typeof chartConfig]?.label || name}
                      <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                        {((value / chartData.reduce((acc, curr) => acc + curr.value, 0)) * 100).toFixed(2)}%
                      </div>
                    </div>
                  )}
                />
              }
            />
            <Pie
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              dataKey="value"
              onMouseEnter={onPieEnter}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="flex items-center gap-2 leading-none text-muted-foreground">
          January - June 2024
        </div>
      </CardFooter>
    </Card>
  )
}
