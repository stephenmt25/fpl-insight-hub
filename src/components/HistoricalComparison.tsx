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
interface HistoricalComparisonProps {
  selectedManager: string | null;
}
export function HistoricalComparison({
  selectedManager,
}: HistoricalComparisonProps) {
  const data = [
    { gameweek: 1, you: 50, other: 45 },
    { gameweek: 2, you: 110, other: 100 },
    { gameweek: 3, you: 160, other: 170 },
    { gameweek: 4, you: 220, other: 230 },
    { gameweek: 5, you: 290, other: 280 },
  ];
  if (!selectedManager) {
    return null;
  }
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
              />
              <Line
                type="monotone"
                dataKey="other"
                name={selectedManager}
                stroke="#04f5ff"
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}