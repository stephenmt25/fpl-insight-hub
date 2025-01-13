import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GameweekAnalysisProps {
  gameweek: number;
}

export function GameweekAnalysis({ gameweek }: GameweekAnalysisProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-semibold">Gameweek {gameweek} Analysis</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Points by Position</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Position-based points visualization will go here</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Captain Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Captain performance visualization will go here</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}