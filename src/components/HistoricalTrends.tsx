import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function HistoricalTrends() {
  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-semibold">Historical Performance</h3>
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Points Progression</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Points progression chart will go here</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Rank Movement</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Rank movement chart will go here</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}