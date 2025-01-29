import { StatsCard } from "@/components/StatsCard";
import { LiveGWContext } from "@/context/livegw-context";
import { useContext } from "react";

interface StatsOverviewProps {
  currentGW: any;
  mostCaptPlayerData: any;
  highScorePlayerData: any;
  highScorePlayerFixture: any;
  mostCaptPlayerFixture: any
}

export function StatsOverview({ currentGW, mostCaptPlayerData, highScorePlayerData, highScorePlayerFixture, mostCaptPlayerFixture  }: StatsOverviewProps) {
  const { overallData } = useContext(LiveGWContext)
  const previousGWData = Array.isArray(overallData) ? overallData.filter((gw) => gw.id === currentGW?.id - 1)[0] : undefined;
  
  const averageDelta = currentGW?.average_entry_score - previousGWData?.average_entry_score
  const averageStyle = averageDelta > 0 ? 'text-green-500 text-sm font-medium gap-2 justify-end' : averageDelta < 0 ? 'text-red-500 text-sm font-medium gap-2 justify-end' : 'text-black text-sm font-medium gap-2 justify-end'

  const highscoreDelta = currentGW?.highest_score - previousGWData?.highest_score
  const highscoreStyle = highscoreDelta > 0 ? 'text-green-500 text-sm font-medium gap-2 justify-end' : highscoreDelta < 0 ? 'text-red-500 text-sm font-medium gap-2 justify-end' : 'text-black text-sm font-medium gap-2 justify-end'

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {currentGW ? (
        <StatsCard
          title="Highest GW Points"
          value={currentGW.highest_score}
          description={highscoreDelta > 0 ? `+${highscoreDelta} ` : `${highscoreDelta} ` }
          style={highscoreStyle}
        />
      ) : (
        <StatsCard
          title="Highest GW Points"
          value="..."
          description="Loading..."
        />
      )}
      {currentGW ? (
        <StatsCard
          title="Average GW Points"
          value={currentGW.average_entry_score}
          description={averageDelta > 0 ? `+${averageDelta} ` : `${averageDelta} ` }
          style={averageStyle}
        />
      ) : (
        <StatsCard
          title="Average GW Points"
          value="..."
          description="Loading..."
        />
      )}
      {mostCaptPlayerData[0].status !== "loading" ? (
        <StatsCard
          title="Most Captained"
          value={mostCaptPlayerData[0]?.web_name || "..."}
          description={mostCaptPlayerFixture}
        />
      ) : (
        <StatsCard
          title="Most Captained"
          value="..."
          description="Loading..."
        />
      )}
      {highScorePlayerData ? (
        <StatsCard
          title="Highest Scoring Player"
          value={highScorePlayerData[0]?.web_name}
          description={highScorePlayerFixture}
        />
      ) : (
        <StatsCard
          title="Highest Scoring Player"
          value="..."
          description="Loading..."
        />
      )}
    </div>
  );
}