import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface LeagueTrendsProps {
  selectedLeague: string;
}

export function LeagueTrends({ selectedLeague }: LeagueTrendsProps) {
  const data = [
    { gameweek: 1, points: 450, transfers: 15, benchPoints: 45 },
    { gameweek: 2, points: 520, transfers: 12, benchPoints: 38 },
    { gameweek: 3, points: 480, transfers: 18, benchPoints: 52 },
  ];

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>League-Wide Gameweek Points</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="gameweek" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="points" name="Total Points" fill="#00ff87" />
                <Bar dataKey="benchPoints" name="Bench Points" fill="#04f5ff" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transfer Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="gameweek" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="transfers" name="Transfers Made" fill="#ff04a1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}