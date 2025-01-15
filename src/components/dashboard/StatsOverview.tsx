import { StatsCard } from "@/components/StatsCard";

interface StatsOverviewProps {
  currentGW: any;
  mostCaptPlayer: any;
  highScorePlayer: any;
}

export function StatsOverview({ currentGW, mostCaptPlayer, highScorePlayer }: StatsOverviewProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {currentGW ? (
        <StatsCard
          title="Highest GW Points"
          value={currentGW.highest_score}
          description="↓ 12 from last week"
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
          description="↑ 9 from last week"
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
          value={mostCaptPlayer[0].web_name}
          description="MUN v LIV"
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
          value={highScorePlayer[0].web_name}
          description="BRE v BHA"
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