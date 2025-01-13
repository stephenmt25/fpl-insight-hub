import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CaptaincyImpactProps {
  gameweek: number;
}

export function CaptaincyImpact({ gameweek }: CaptaincyImpactProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-semibold">Captaincy Analysis</h3>
      <p className="text-muted-foreground">
        Captain and vice-captain performance for Gameweek {gameweek}
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Captain Points</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Captain points visualization will go here</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Captain success rate visualization will go here</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}