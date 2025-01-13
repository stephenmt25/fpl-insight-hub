import { StatsCard } from "@/components/StatsCard";
import { LeagueTable } from "@/components/LeagueTable";
import { TransferSuggestion } from "@/components/TransferSuggestion";
import { Button } from "@/components/ui/button";
import { BarChart } from "lucide-react";

const Index = () => {
  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Hello, John! Here's your FPL journey at a glance.
          </h2>
          <p className="mt-2 text-muted-foreground">
            Track your progress and make informed decisions for your team.
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <BarChart className="h-4 w-4" />
          View League Standings
        </Button>
      </div>

      {/* Dashboard Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Points"
          value="1,234"
          description="Top 12% Overall"
        />
        <StatsCard
          title="Overall Rank"
          value="#123,456"
          description="↑ 5,432 from last week"
        />
        <StatsCard
          title="Gameweek Points"
          value="78"
          description="Above average by 12"
        />
        <StatsCard
          title="Transfers Made"
          value="24"
          description="£0.4m in the bank"
        />
      </div>

      {/* League Standings and Transfer Suggestions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2">
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
            <TransferSuggestion
              playerName="Erling Haaland"
              team="Man City"
              position="FWD"
              price="£14.0m"
              prediction={7.8}
            />
            <TransferSuggestion
              playerName="Bukayo Saka"
              team="Arsenal"
              position="MID"
              price="£9.2m"
              prediction={7.2}
            />
            <Button variant="outline" className="w-full mt-4">
              View Full Suggestions
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;