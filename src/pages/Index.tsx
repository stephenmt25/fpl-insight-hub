import { StatsCard } from "@/components/StatsCard";
import { LeagueTable } from "@/components/LeagueTable";
import { TransferSuggestion } from "@/components/TransferSuggestion";
import { Button } from "@/components/ui/button";
import * as Select from "@radix-ui/react-select"
import { BarChart } from "lucide-react";
import { GameweekPaginator } from "@/components/GameweekPaginator";
import { useState } from "react";
import { AveragePtsLineChart } from "@/components/averagePointsLineChart";
import { AverageTeamValueAreaChart } from "@/components/averageTeamValueAreaChart";
import { OverallCaptains } from "@/components/overallCaptainsPieChart";

const Index = () => {
  const [currentGameweek, setCurrentGameweek] = useState(20);
  const [liveGameweek, setLiveGameweek] = useState(20)
  const [signedIn, setSignedIn] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState("Overall");

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {signedIn &&
          <>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                Hello, John! Here's your FPL journey at a glance.
              </h2>
              <p className="mt-2 text-muted-foreground">
                Track your progress and make informed decisions for your team.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <BarChart className="h-4 w-4" />
                <label className="text-sm font-medium">League Select</label>
              </div>
              <select
                value={selectedLeague}
                onChange={(e) => setSelectedLeague(e.target.value)}
                className="w-[300px] border rounded border-black"
              >
                <option value="Overall">Overall</option>
                <option value="Man Utd">Man Utd</option>
                <option value="India">India</option>
                <option value="Second Chance">Second Chance</option>
              </select>
            </div>
          </>
        }
        {!signedIn &&
          <>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                Here's the FPL 2025 season at a glance.
              </h2>
              <p className="mt-2 text-muted-foreground">
                Overall FPL data and statistics.
              </p>
            </div>


            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <BarChart className="h-4 w-4" />
                <label className="text-sm font-medium">League Select</label>
              </div>
              <select
                value={selectedLeague}
                onChange={(e) => setSelectedLeague(e.target.value)}
                className="w-[300px] border rounded border-black"
              >
                <option value="Overall">Overall</option>
                <option value="Man Utd">Man Utd</option>
                <option value="India">India</option>
                <option value="Second Chance">Second Chance</option>
              </select>
            </div>
          </>
        }
      </div>
      {/* Gameweek Paginator */}
      <GameweekPaginator
        currentGameweek={currentGameweek}
        setCurrentGameweek={setCurrentGameweek}
        totalGameweeks={38}
        liveGameweek={liveGameweek}
      />
      {/* Dashboard Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Highest GW Points"
          value="136"
          description="↓ 12 from last week"
        />
        <StatsCard
          title="Average GW Points"
          value="60"
          description="↑ 9 from last week"
        />
        <StatsCard
          title="Most Captained"
          value="M.Salah"
          description="MUN v LIV"
        />
        <StatsCard
          title="Highest Scoring Player"
          value="Mbeumo"
          description="BRE v BHA"
        />
      </div>

      {/* League Standings and Transfer Suggestions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h3 className="text-lg font-medium mb-4">{selectedLeague} League Standings</h3>
          <LeagueTable />
        </div>
        <div>
          <h3 className="text-lg font-medium mb-4">Data Visualization</h3>
          <div className="space-y-4">
            <div>
              <p className="text-gray-600">Overall Captaincy</p>
              <OverallCaptains />
            </div>
            <AveragePtsLineChart />
            <AverageTeamValueAreaChart />
            {/* <TransferSuggestion
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
            </Button> */}
          </div>
        </div>
      </div>
    </div >
  );
};

export default Index;