import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
interface ComparisonMetricsProps {
  selectedManager: string | null;
}
export function ComparisonMetrics({ selectedManager }: ComparisonMetricsProps) {
  const metrics = [
    { title: "Total Points", you: 1234, other: 1300 },
    { title: "Gameweek Points", you: 65, other: 70 },
    { title: "Bench Points", you: 12, other: 8 },
    { title: "Captaincy Points", you: 24, other: 32 },
    { title: "Transfers Made", you: 15, other: 12 },
  ];
  if (!selectedManager) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select a Manager to Compare</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Click on a manager from the league table to see detailed comparisons
          </p>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparison with {selectedManager}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {metrics.map((metric) => (
            <div
              key={metric.title}
              className="grid grid-cols-3 items-center gap-4"
            >
              <span className="font-medium">{metric.title}</span>
              <div
                className={`text-right ${
                  metric.you >= metric.other
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {metric.you}
              </div>
              <div
                className={`text-right ${
                  metric.other >= metric.you
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {metric.other}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}