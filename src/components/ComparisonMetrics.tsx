import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { useQuery } from "@tanstack/react-query";
import { managerService } from "@/services/fpl-api";
import { Skeleton } from "@/components/ui/skeleton";

interface ComparisonMetricsProps {
  selectedManager: { id: number; name: string } | null;
}

export function ComparisonMetrics({ selectedManager }: ComparisonMetricsProps) {
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

  if (isLoading) {
    return <Skeleton className="h-[250px] w-full" />;
  }

  const myCurrent = myHistory?.current || [];
  const otherCurrent = otherHistory?.current || [];

  const myLastGW = myCurrent[myCurrent.length - 1];
  const otherLastGW = otherCurrent[otherCurrent.length - 1];

  const myTotalPoints = myLastGW?.total_points || 0;
  const otherTotalPoints = otherLastGW?.total_points || 0;

  const myGWPoints = myLastGW?.points || 0;
  const otherGWPoints = otherLastGW?.points || 0;

  const myBenchPoints = myCurrent.reduce((sum, gw) => sum + gw.points_on_bench, 0);
  const otherBenchPoints = otherCurrent.reduce((sum, gw) => sum + gw.points_on_bench, 0);

  const myTransfers = myCurrent.reduce((sum, gw) => sum + gw.event_transfers, 0);
  const otherTransfers = otherCurrent.reduce((sum, gw) => sum + gw.event_transfers, 0);

  const myTransferCost = myCurrent.reduce((sum, gw) => sum + gw.event_transfers_cost, 0);
  const otherTransferCost = otherCurrent.reduce((sum, gw) => sum + gw.event_transfers_cost, 0);

  const metrics = [
    { title: "Total Points", you: myTotalPoints, other: otherTotalPoints },
    { title: "GW Points", you: myGWPoints, other: otherGWPoints },
    { title: "Bench Points", you: myBenchPoints, other: otherBenchPoints },
    { title: "Transfers Made", you: myTransfers, other: otherTransfers },
    { title: "Transfer Cost", you: myTransferCost, other: otherTransferCost },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparison with {selectedManager.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 items-center gap-4 mb-2 text-sm font-medium text-muted-foreground">
          <span></span>
          <span className="text-right">You</span>
          <span className="text-right">Them</span>
        </div>
        <div className="grid gap-4">
          {metrics.map((metric) => (
            <div
              key={metric.title}
              className="grid grid-cols-3 items-center gap-4"
            >
              <span className="font-medium">{metric.title}</span>
              <div
                className={`text-right font-semibold ${
                  metric.title === "Transfer Cost"
                    ? metric.you <= metric.other ? "text-green-600" : "text-red-600"
                    : metric.you >= metric.other ? "text-green-600" : "text-red-600"
                }`}
              >
                {metric.you}
              </div>
              <div
                className={`text-right font-semibold ${
                  metric.title === "Transfer Cost"
                    ? metric.other <= metric.you ? "text-green-600" : "text-red-600"
                    : metric.other >= metric.you ? "text-green-600" : "text-red-600"
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
