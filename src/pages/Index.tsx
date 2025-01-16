import { useState, useEffect } from "react";
import { GameweekPaginator } from "@/components/GameweekPaginator";
import { useAuth } from "@/context/auth-context";
import { leagueService } from "@/services/fpl-api";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { LeagueSection } from "@/components/dashboard/LeagueSection";
import { VisualizationSection } from "@/components/dashboard/VisualizationSection";
import { FixtureDifficulty } from "@/components/FixtureDifficulty";
import { HistoricalTrends } from "@/components/HistoricalTrends";
import { PlayerInsights } from "@/components/PlayerInsights";
import { TransferSuggestions } from "@/components/TransferSuggestions";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [currentGameweek, setCurrentGameweek] = useState(20);
  const [liveGameweek, setLiveGameweek] = useState(20);
  const [gameweekData, setGameweekData] = useState<any[] | null>(null);
  const [highScorePlayer, setHighScorePlayer] = useState<any | null>(null);
  const [mostCaptPlayer, setMostCaptPlayer] = useState<any | null>(null);
  const { isSignedIn, signIn } = useAuth();
  const [pageNumber, setPageNumber] = useState("1");

  const overallLeagueId = "314";

  const [leagueId, setLeagueId] = useState(overallLeagueId);

  const {
    data: leagueData,
    error: overallLeagueDataError,
    isLoading: isLoadingoverallLeagueData,
  } = useQuery({
    queryKey: ['leagueData', leagueId, pageNumber],
    queryFn: () => leagueService.getStandings(leagueId, pageNumber),
  });

  useEffect(() => {
    const getData = async () => {
      const { data } = await supabase.from('fploveralldata').select();
      setGameweekData(data);
    };
    getData();
  }, []);

  const currentGW = gameweekData?.filter((gw) => gw.is_current === "true")[0];

  useEffect(() => {
    const getHighScorePlayer = async () => {
      if (currentGW?.top_element) {
        const { data } = await supabase
          .from('plplayerdata')
          .select()
          .eq('id', currentGW.top_element);
        setHighScorePlayer(data);
      }
    };
    getHighScorePlayer();
  }, [currentGW]);

  useEffect(() => {
    const getMostCaptPlayer = async () => {
      if (currentGW?.most_captained) {
        const { data } = await supabase
          .from('plplayerdata')
          .select()
          .eq('id', currentGW.most_captained);
        setMostCaptPlayer(data);
      }
    };
    getMostCaptPlayer();
  }, [currentGW]);

  useEffect(() => {
    const storedFplId = localStorage.getItem('fplId');
    const storedManagerData = JSON.parse(localStorage.getItem('managerData'));
    if (storedManagerData && storedFplId && !isSignedIn) {
      signIn(storedFplId, storedManagerData);
    }
  }, []);

  return (
    <div className="space-y-1">
      <WelcomeBanner/>

      <GameweekPaginator
        currentGameweek={currentGameweek}
        setCurrentGameweek={setCurrentGameweek}
        totalGameweeks={38}
        liveGameweek={liveGameweek}
      />

      <Tabs defaultValue="charts" className="space-y-4">
        <div className="w-full overflow-x-auto no-scrollbar">
          <TabsList className="w-full justify-start inline-flex min-w-max">
            <TabsTrigger value="charts">FPL Data Visualized</TabsTrigger>
            <TabsTrigger value="table">FPL Standings</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="charts" className="space-y-4">
        <StatsOverview
            currentGW={currentGW}
            mostCaptPlayer={mostCaptPlayer}
            highScorePlayer={highScorePlayer}
          />
          <VisualizationSection />
        </TabsContent>

        <TabsContent value="table">
          <LeagueSection
            pageNumber={pageNumber}
            setPageNumber={setPageNumber}
            isLoadingoverallLeagueData={isLoadingoverallLeagueData}
            leagueData={leagueData}
            setLeagueId={setLeagueId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;