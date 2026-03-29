import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { useQuery } from "@tanstack/react-query";
import { managerService } from "@/services/fpl-api";
import { Skeleton } from "@/components/ui/skeleton";

interface HistoricalComparisonProps {
  selectedManager: { id: number; name: string } | null;
}

export function HistoricalComparison({ selectedManager }: HistoricalComparisonProps) {
  const { fplId } = useAuth();

  // Fetch current user's history
  const { data: myHistory } = useQuery({
    queryKey: ['myHistory', fplId],
    queryFn: () => managerService.getHistory(fplId!),
    enabled: !!fplId,
  });

  // Fetch selected manager's history
  const { data: otherHistory, isLoading } = useQuery({
    queryKey: ['otherHistory', selectedManager?.id],
    queryFn: () => managerService.getHistory(selectedManager!.id.toString()),
    enabled: !!selectedManager?.id,
  });

  if (!selectedManager) {
    return null;
  }

  if (isLoading) {
    return <Skeleton className="h-[350px] w-full" />;
  }

  const myCurrent = myHistory?.current || [];
  const otherCurrent = otherHistory?.current || [];
  const maxGWs = Math.max(myCurrent.length, otherCurrent.length);

  const data = Array.from({ length: maxGWs }, (_, i) => ({
    gameweek: i + 1,
    you: myCurrent[i]?.total_points || 0,
    other: otherCurrent[i]?.total_points || 0,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historical Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="gameweek"
                label={{ value: "Gameweek", position: "insideBottom", offset: -5 }}
              />
              <YAxis label={{ value: "Points", angle: -90, position: "insideLeft" }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="you"
                name="You"
                stroke="#00ff87"
                activeDot={{ r: 8 }}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="other"
                name={selectedManager.name}
                stroke="#04f5ff"
                activeDot={{ r: 8 }}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
