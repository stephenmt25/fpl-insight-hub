import { StatsCard } from "@/components/StatsCard";
import { LeagueTable } from "@/components/LeagueTable";
import { TransferSuggestion } from "@/components/TransferSuggestion";

const Index = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Hello, John! Here's your FPL journey at a glance.
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Points" value="1,234" />
        <StatsCard title="Overall Rank" value="#123,456" />
        <StatsCard title="Gameweek Points" value="78" />
        <StatsCard title="Transfers Made" value="24" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="col-span-2">
          <h3 className="text-lg font-medium mb-4">League Standings</h3>
          <LeagueTable />
        </div>
        <div>
          <h3 className="text-lg font-medium mb-4">Transfer Suggestions</h3>
          <div className="space-y-4">
            <TransferSuggestion
              playerName="Mohamed Salah"
              team="Liverpool"
              position="MID"
              price="£12.5m"
              prediction={8.5}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;