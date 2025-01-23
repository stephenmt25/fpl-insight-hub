import { StatsCard } from "@/components/StatsCard";
import { LiveGWContext } from "@/context/livegw-context";
import { useContext } from "react";

interface StatsOverviewProps {
  currentGW: any;
  mostCaptPlayerData: any[];
  highScorePlayerData: any;
  highScorePlayerFixture: string;
  mostCaptPlayerFixture: string;
}

export function StatsOverview({ 
  currentGW, 
  mostCaptPlayerData = [{ status: "loading" }], 
  highScorePlayerData, 
  highScorePlayerFixture, 
  mostCaptPlayerFixture 
}: StatsOverviewProps) {
  const { overallData } = useContext(LiveGWContext);
  const previousGWData = Array.isArray(overallData) ? overallData.find((gw) => gw.id === (currentGW?.id ?? 0) - 1) : undefined;
  
  const averageDelta = currentGW?.average_entry_score && previousGWData?.average_entry_score
    ? currentGW.average_entry_score - previousGWData.average_entry_score
    : 0;
  const averageStyle = averageDelta > 0 ? 'text-green-500 text-sm font-medium gap-2' 
    : averageDelta < 0 ? 'text-red-500 text-sm font-medium gap-2' 
    : 'text-black text-sm font-medium gap-2';

  const highscoreDelta = currentGW?.highest_score && previousGWData?.highest_score
    ? currentGW.highest_score - previousGWData.highest_score
    : 0;
  const highscoreStyle = highscoreDelta > 0 ? 'text-green-500 text-sm font-medium gap-2' 
    : highscoreDelta < 0 ? 'text-red-500 text-sm font-medium gap-2' 
    : 'text-black text-sm font-medium gap-2';

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Highest GW Points"
        value={currentGW?.highest_score ?? "..."}
        description={highscoreDelta !== 0 ? `${highscoreDelta > 0 ? '+' : ''}${highscoreDelta}` : "Loading..."}
        style={highscoreStyle}
      />
      <StatsCard
        title="Average GW Points"
        value={currentGW?.average_entry_score ?? "..."}
        description={averageDelta !== 0 ? `${averageDelta > 0 ? '+' : ''}${averageDelta}` : "Loading..."}
        style={averageStyle}
      />
      <StatsCard
        title="Most Captained"
        value={mostCaptPlayerData?.[0]?.web_name ?? "..."}
        description={mostCaptPlayerFixture || "Loading..."}
      />
      <StatsCard
        title="Highest Scoring Player"
        value={highScorePlayerData?.[0]?.web_name ?? "..."}
        description={highScorePlayerFixture || "Loading..."}
      />
    </div>
  );
}