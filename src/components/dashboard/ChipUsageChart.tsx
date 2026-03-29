import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/services/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import type { BootstrapStatic } from "@/types/bootstrap";
import { Zap } from "lucide-react";

const CHIP_COLORS: Record<string, string> = {
  wildcard: "#8b5cf6",
  freehit: "#06b6d4",
  bboost: "#22c55e",
  "3xc": "#f59e0b",
};

const CHIP_LABELS: Record<string, string> = {
  wildcard: "Wildcard",
  freehit: "Free Hit",
  bboost: "Bench Boost",
  "3xc": "Triple Captain",
};

export function ChipUsageChart() {
  const { data: bootstrap, isLoading } = useQuery<BootstrapStatic>({
    queryKey: ['bootstrapStatic'],
    queryFn: () => apiClient.get('/bootstrap-static/'),
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading) return <Skeleton className="h-[300px] w-full" />;
  if (!bootstrap) return null;

  const finishedEvents = bootstrap.events.filter(e => e.finished && e.chip_plays);

  const chartData = finishedEvents.map(event => {
    const point: Record<string, string | number> = { gameweek: `GW${event.id}` };
    for (const play of event.chip_plays) {
      point[play.chip_name] = Math.round(play.num_played / 1000);
    }
    return point;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Zap className="h-4 w-4" /> Chip Usage Across the Season (thousands)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="gameweek" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(value: number, name: string) =>
                  [`${value}k managers`, CHIP_LABELS[name] || name]
                }
              />
              <Legend
                formatter={(value: string) => CHIP_LABELS[value] || value}
                wrapperStyle={{ fontSize: 11 }}
              />
              {Object.entries(CHIP_COLORS).map(([chip, color]) => (
                <Bar key={chip} dataKey={chip} stackId="chips" fill={color} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
