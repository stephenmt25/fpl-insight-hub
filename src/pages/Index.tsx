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

const Index = () => {
  const [currentGameweek, setCurrentGameweek] = useState(20);
  const [liveGameweek, setLiveGameweek] = useState(20);
  const [selectedLeague, setSelectedLeague] = useState("Overall");
  const [gameweekData, setGameweekData] = useState<any[] | null>(null);
  const [highScorePlayer, setHighScorePlayer] = useState<any | null>(null);
  const [mostCaptPlayer, setMostCaptPlayer] = useState<any | null>(null);
  const { isSignedIn, signIn } = useAuth();
  const [pageNumber, setPageNumber] = useState("1");

  const overallLeagueId = "314";
  const secondChanceLeagueId = "321";
  const gameweek1LeagueId = "276";

  const [leagueId, setLeagueId] = useState(overallLeagueId);

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
  };

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
    <div className="space-y-8">
      <WelcomeBanner
        selectedLeague={selectedLeague}
        updateSelectedLeague={updateSelectedLeague}
      />
      
      <GameweekPaginator
        currentGameweek={currentGameweek}
        setCurrentGameweek={setCurrentGameweek}
        totalGameweeks={38}
        liveGameweek={liveGameweek}
      />
      
      <StatsOverview
        currentGW={currentGW}
        mostCaptPlayer={mostCaptPlayer}
        highScorePlayer={highScorePlayer}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <LeagueSection
          selectedLeague={selectedLeague}
          pageNumber={pageNumber}
          setPageNumber={setPageNumber}
          isLoadingoverallLeagueData={isLoadingoverallLeagueData}
          leagueData={leagueData}
        />
        <VisualizationSection />
      </div>
    </div>
  );
};

export default Index;