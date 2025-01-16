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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const Index = () => {
  const [gameweekData, setGameweekData] = useState<any[] | null>(null);
  const [currentGameweek, setCurrentGameweek] = useState<number | null>(null);
  const [selectedGameweekData, setSelectedGameweekData] = useState<any | null>(null);
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
      
      // Find the current gameweek and set it
      const currentGW = data?.find(gw => gw.is_current === "true");
      if (currentGW) {
        setCurrentGameweek(currentGW.id);
      }
    };
    getData();
  }, []);

  const currentGW = gameweekData?.filter((gw) => gw.is_current === "true")[0];
  const liveGameweek = currentGW?.id || 1;
  const totalGameweeks = 38;

  useEffect(() => {
    const getGameweekData = async () => {
      if (currentGameweek) {
        const { data } = await supabase
          .from('fploveralldata')
          .select()
          .eq('id', currentGameweek)
          .single();
        setSelectedGameweekData(data);
      }
    };
    getGameweekData();
  }, [currentGameweek]);

  useEffect(() => {
    const getHighScorePlayer = async () => {
      if (selectedGameweekData?.top_element) {
        const { data } = await supabase
          .from('plplayerdata')
          .select()
          .eq('id', selectedGameweekData.top_element);
        setHighScorePlayer(data);
      }
    };
    getHighScorePlayer();
  }, [selectedGameweekData]);

  useEffect(() => {
    const getMostCaptPlayer = async () => {
      if (selectedGameweekData?.most_captained) {
        const { data } = await supabase
          .from('plplayerdata')
          .select()
          .eq('id', selectedGameweekData.most_captained);
        setMostCaptPlayer(data);
      }
    };
    getMostCaptPlayer();
  }, [selectedGameweekData]);

  useEffect(() => {
    const storedFplId = localStorage.getItem('fplId');
    const storedManagerData = JSON.parse(localStorage.getItem('managerData'));
    if (storedManagerData && storedFplId && !isSignedIn) {
      signIn(storedFplId, storedManagerData);
    }
  }, []);

  if (!currentGameweek) return null;

  return (
    <div className="space-y-1">
      <WelcomeBanner/>

      <GameweekPaginator
        currentGameweek={currentGameweek}
        setCurrentGameweek={setCurrentGameweek}
        totalGameweeks={totalGameweeks}
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
            currentGW={selectedGameweekData}
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