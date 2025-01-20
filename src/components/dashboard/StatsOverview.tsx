import { StatsCard } from "@/components/StatsCard";

interface StatsOverviewProps {
  currentGW: any;
  mostCaptPlayer: any;
  highScorePlayer: any;
  highScorePlayerFixture: any;
  mostCaptPlayerFixture: any
}

export function StatsOverview({ currentGW, mostCaptPlayer, highScorePlayer, highScorePlayerFixture, mostCaptPlayerFixture  }: StatsOverviewProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {currentGW ? (
        <StatsCard
          title="Highest GW Points"
          value={currentGW.highest_score}
          description={`GW ${currentGW.id}`}
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
          description={`GW ${currentGW.id}`}
        />
      ) : (
        <StatsCard
          title="Average GW Points"
          value="..."
          description="Loading..."
        />
      )}
      {mostCaptPlayer ? (
        <StatsCard
          title="Most Captained"
          value={mostCaptPlayer[0]?.web_name || "N/A"}
          description={mostCaptPlayerFixture}
        />
      ) : (
        <StatsCard
          title="Most Captained"
          value="..."
          description="Loading..."
        />
      )}
      {highScorePlayer ? (
        <StatsCard
          title="Highest Scoring Player"
          value={highScorePlayer[0]?.web_name || "N/A"}
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