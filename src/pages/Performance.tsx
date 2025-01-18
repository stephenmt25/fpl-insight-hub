import { useState } from "react";
import { GameweekPaginator } from "@/components/GameweekPaginator";
import { PerformanceMetrics } from "@/components/PerformanceMetrics";
import { PlayerPerformanceTable } from "@/components/PlayerPerformanceTable";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

// Mock data for the player performance table
const mockPlayers = [
  {
    name: "Mohamed Salah",
    team: "LIV",
    position: "MID",
    points: 12,
    performance: "exceptional" as const,
  },
  {
    name: "Erling Haaland",
    team: "MCI",
    position: "FWD",
    points: 8,
    performance: "average" as const,
  },
  {
    name: "Bukayo Saka",
    team: "ARS",
    position: "MID",
    points: 2,
    performance: "poor" as const,
  },
];

export default function Performance() {
  const [currentGameweek, setCurrentGameweek] = useState(20);
  const [liveGameweek, setLiveGameweek] = useState(20);
  const { isSignedIn } = useAuth();

  if (!isSignedIn) {
    return (
      <Card className="h-screen">
        <CardHeader>
          <CardDescription>
            Please sign in to view performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent></CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <GameweekPaginator
        currentGameweek={currentGameweek}
        setCurrentGameweek={setCurrentGameweek}
        totalGameweeks={38}
        liveGameweek={liveGameweek}
      />
      
      <PerformanceMetrics gameweek={currentGameweek} />
      
      <div className="space-y-4">
        <h3 className="text-2xl font-semibold">Player Performance</h3>
        <PlayerPerformanceTable players={mockPlayers} />
      </div>
    </div>
  );
}