import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PerformanceMetricsProps {
  gameweek: number;
}

export function PerformanceMetrics({ gameweek }: PerformanceMetricsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-semibold">Performance Overview</h3>
      <p className="text-muted-foreground">
        Detailed breakdown of your performance metrics for Gameweek {gameweek}
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Points Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Points distribution visualization will go here</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Transfer Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Transfer impact visualization will go here</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}