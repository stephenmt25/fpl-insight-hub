import { StatsCard } from "@/components/StatsCard";
import { LeagueTable } from "@/components/LeagueTable";
import { Button } from "@/components/ui/button";
import { BarChart } from "lucide-react";
import { GameweekPaginator } from "@/components/GameweekPaginator";
import { useEffect, useState } from "react";
import { AveragePtsLineChart } from "@/components/averagePointsLineChart";
import { AverageTeamValueAreaChart } from "@/components/averageTeamValueAreaChart";
import { OverallCaptains } from "@/components/overallCaptainsPieChart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth-context";
import { leagueService } from "@/services/fpl-api";
import { useQuery } from "@tanstack/react-query";
import { ResponsiveContainer } from "recharts";
import { TempRadarChart } from "@/components/tempRadarChart";

const Index = () => {
  const [currentGameweek, setCurrentGameweek] = useState(20);
  const [liveGameweek, setLiveGameweek] = useState(20)
  const [selectedLeague, setSelectedLeague] = useState("Overall");
  const [gameweekData, setGameweekData] = useState<any[] | null>(null)
  const [highScorePlayer, setHighScorePlayer] = useState<any | null>(null)
  const [mostCaptPlayer, setMostCaptPlayer] = useState<any | null>(null)
  const { isSignedIn, signIn, currentManager } = useAuth();
  const [pageNumber, setPageNumber] = useState("1")

  const overallLeagueId = "314"
  const secondChanceLeagueId = "321"
  const gameweek1LeagueId = "276"

  const [leagueId, setLeagueId] = useState(overallLeagueId)

  const {
    data: leagueData,
    error: overallLeagueDataError,
    isLoading: isLoadingoverallLeagueData,
  } = useQuery({
    queryKey: ['leagueData', leagueId, pageNumber],
    queryFn: () => leagueService.getStandings(leagueId, pageNumber),
  });

  const updateSelectedLeague = (leagueName: string) => {
    setSelectedLeague(leagueName);
    switch (leagueName) {
      case "Overall":
        setLeagueId(overallLeagueId);
        break;
      case "Second Chance":
        setLeagueId(secondChanceLeagueId);
        break;
      case "Gameweek 1":
        setLeagueId(gameweek1LeagueId);
        break;
      default:
        setLeagueId(overallLeagueId);
        break;
    }
  }

  useEffect(() => {
    const getData = async () => {
      const { data } = await supabase.from('fploveralldata').select()
      setGameweekData(data)
    }
    getData()
  }, [])

  const currentGW = gameweekData?.filter((gw) => gw.is_current === "true")[0]

  useEffect(() => {
    const getHighScorePlayer = async () => {
      if (currentGW?.top_element) {
        const { data } = await supabase.from('plplayerdata')
          .select()
          .eq('id', currentGW.top_element);
        setHighScorePlayer(data)
      }
    }
    getHighScorePlayer()
  }, [currentGW])

  useEffect(() => {
    const getMostCaptPlayer = async () => {
      if (currentGW?.most_captained) {
        const { data } = await supabase.from('plplayerdata')
          .select()
          .eq('id', currentGW.most_captained);
        setMostCaptPlayer(data)
      }
    }
    getMostCaptPlayer()
  }, [currentGW])

  // Check for stored FPL ID on component mount
  useEffect(() => {
    const storedFplId = localStorage.getItem('fplId');
    const storedManagerData = JSON.parse(localStorage.getItem('managerData'));
    if (storedManagerData && storedFplId && !isSignedIn) {
      // Re-authenticate if FPL ID exists in localStorage
      signIn(storedFplId, storedManagerData);
    }
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {isSignedIn &&
          <>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                Hello, {currentManager?.player_first_name}! Here's your FPL journey at a glance.
              </h2>
              <p className="mt-2 text-muted-foreground">
                Track your progress and make informed decisions for your team.
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-xs ">
              <div className="flex items-center gap-2">
                <BarChart className="h-4 w-4" />
                <label className="text-sm font-medium">League Select</label>
              </div>
              <Select value={selectedLeague} onValueChange={(value) => updateSelectedLeague(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a league" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Overall">Overall</SelectItem>
                  <SelectItem value="Man Utd">Man Utd</SelectItem>
                  <SelectItem value="India">India</SelectItem>
                  <SelectItem value="Second Chance">Second Chance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        }
        {!isSignedIn &&
          <>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                Here's the FPL 2025 season at a glance.
              </h2>
              <p className="mt-2 text-muted-foreground">
                Overall FPL data and statistics.
              </p>
            </div>

            <div className="flex flex-col gap-2 w-full max-w-xs ">
              <div className="flex items-center gap-2">
                <BarChart className="h-4 w-4" />
                <label className="text-sm font-medium">League Select</label>
              </div>
              <Select value={selectedLeague} onValueChange={(value) => updateSelectedLeague(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a league" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Overall">Overall</SelectItem>
                  <SelectItem value="Second Chance">Second Chance</SelectItem>
                  <SelectItem value="Gameweek 1">Gameweek 1</SelectItem>
                </SelectContent>
              </Select>
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
        {currentGW ?
          <StatsCard
            title="Highest GW Points"
            value={currentGW.highest_score}
            description="↓ 12 from last week"
          /> :
          <StatsCard
            title="Highest GW Points"
            value="..."
            description="Loading..."
          />}
        {currentGW ?
          <StatsCard
            title="Average GW Points"
            value={currentGW.average_entry_score}
            description="↑ 9 from last week"
          /> :
          <StatsCard
            title="Average GW Points"
            value="..."
            description="Loading..."
          />
        }
        {mostCaptPlayer ?
          <StatsCard
            title="Most Captained"
            value={mostCaptPlayer[0].web_name}
            description="MUN v LIV"
          /> :
          <StatsCard
            title="Most Captained"
            value="..."
            description="Loading..."
          />}
        {highScorePlayer ?
          <StatsCard
            title="Highest Scoring Player"
            value={highScorePlayer[0].web_name}
            description="BRE v BHA"
          /> :
          <StatsCard
            title="Highest Scoring Player"
            value="..."
            description="Loading..."
          />}
      </div>

      {/* League Standings and Transfer Suggestions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 ">
        <div className="lg:col-span-1 max-w-[95%] lg:max-w-full">
          <div className="mb-4 flex justify-between items-center">
            <h3 className="text-lg font-medium">{selectedLeague} League Standings</h3>
            <div className="flex gap-2 items-center">
              <span>Page: {pageNumber}</span>
              <Button
                variant="outline"
                disabled={parseInt(pageNumber) === 1}
                onClick={() => setPageNumber((prev) => (parseInt(prev) - 1).toString())}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={!leagueData?.standings?.has_next}
                onClick={() => setPageNumber((prev) => (parseInt(prev) + 1).toString())}
              >
                Next
              </Button>
            </div>
          </div>

          {
            isLoadingoverallLeagueData ?
              <StatsCard
                title="Loading Table Data"
                value="..."
                description=""
              /> :
              <>
                <LeagueTable leagueData={leagueData.standings.results} />
                <div className="p-1 mt-4 flex justify-between">
                  <span>Page: {pageNumber}</span>
                  <div className="flex">

                    <Button
                      variant="outline"
                      disabled={parseInt(pageNumber) === 1}
                      onClick={() => setPageNumber((prev) => (parseInt(prev) - 1).toString())}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      disabled={!leagueData?.standings?.has_next}
                      onClick={() => setPageNumber((prev) => (parseInt(prev) + 1).toString())}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
          }
        </div>
        <div className="max-w-[94%] lg:max-w-full">
          <h3 className="text-lg font-medium mb-4">Data Visualization</h3>
          <div className="grid gap-2 lg:grid-cols-2">
            <div className="col-span-2 lg:col-span-1">
              <p className="text-gray-600">Overall Captaincy</p>
              {/* <ResponsiveContainer width="100%" height="100%">
                <OverallCaptains />
              </ResponsiveContainer> */}
              <TempRadarChart />
            </div>
            <div className="col-span-2 lg:col-span-1">
              <p className="text-gray-600">Distribution</p>
              <TempRadarChart />
            </div>
            <div className="col-span-2">
              <AverageTeamValueAreaChart />
            </div>
            <div className="col-span-2">
              <AveragePtsLineChart />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
