import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
interface LeagueInsightsProps {
  selectedLeague: string;
}
export function LeagueInsights({ selectedLeague }: LeagueInsightsProps) {
  const data = [
    { gameweek: 1, manager1: 50, manager2: 45, manager3: 55 },
    { gameweek: 2, manager1: 110, manager2: 100, manager3: 120 },
    { gameweek: 3, manager1: 160, manager2: 170, manager3: 180 },
  ];
  const topPerformers = [
    { name: "John Doe", points: 1587, badge: "Gameweek Hero" },
    { name: "Jane Smith", points: 1534, badge: "Most Consistent" },
    { name: "Bob Wilson", points: 1498, badge: "Best Captain" },
  ];
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Top Performers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {topPerformers.map((performer, index) => (
              <div
                key={index}
                className="flex flex-col items-center space-y-2 p-4 border rounded-lg"
              >
                <div className="w-12 h-12 bg-fpl-primary rounded-full" />
                <h3 className="font-semibold">{performer.name}</h3>
                <p className="text-sm text-muted-foreground">{performer.points} pts</p>
                <span className="text-xs bg-fpl-accent px-2 py-1 rounded-full">
                  {performer.badge}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>League Performance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="gameweek" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="manager1"
                  name="John Doe"
                  stroke="#00ff87"
                />
                <Line
                  type="monotone"
                  dataKey="manager2"
                  name="Jane Smith"
                  stroke="#04f5ff"
                />
                <Line
                  type="monotone"
                  dataKey="manager3"
                  name="Bob Wilson"
                  stroke="#ff04a1"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}