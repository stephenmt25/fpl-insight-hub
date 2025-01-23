import { useState, useEffect, useContext } from "react";
import { GameweekPaginator } from "@/components/GameweekPaginator";
import { useAuth } from "@/context/auth-context";
import { leagueService, playerService } from "@/services/fpl-api";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { LeagueSection } from "@/components/dashboard/LeagueSection";
import { VisualizationSection } from "@/components/dashboard/VisualizationSection";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LiveGWContext } from "@/context/livegw-context";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";

const Index = () => {
  const { isSignedIn, signIn } = useAuth();
  const [pageNumber, setPageNumber] = useState("1");
  const { updateLiveGWData, eventStatus, updateOverallData } = useContext(LiveGWContext);
  const overallLeagueId = "314";
  const [leagueId, setLeagueId] = useState(overallLeagueId);
  const [currentGameweekNumber, setCurrentGameweekNumber] = useState<number | null>(null);

  // Use React Query for FPL overall data
  const { data: overallFPLData } = useQuery({
    queryKey: ['overallFPLData'],
    queryFn: async () => {
      const { data } = await supabase.from('fploveralldata').select();
      return data;
    },
  });

  useEffect(() => {
    if (overallFPLData) {
      updateOverallData(overallFPLData);
      const currentGW = overallFPLData.find(gw => gw.is_current === "true");
      if (currentGW) {
        setCurrentGameweekNumber(currentGW.id);
      }
    }
  }, [overallFPLData, updateOverallData]);

  const previousGWData = overallFPLData?.filter((gw) => gw.is_previous === "true")[0];
  const liveGameweekData = overallFPLData?.filter((gw) => gw.is_current === "true")[0] || null;
  const [selectedGameweekData, setSelectedGameweekData] = useState(liveGameweekData);

  // Use React Query for gameweek stats
  const { data: liveGWStats = [] } = useQuery({
    queryKey: ['gameweekStats', liveGameweekData?.id || previousGWData?.id],
    queryFn: async () => {
      const gameweekData = liveGameweekData || previousGWData;
      if (!gameweekData?.id) {
        throw new Error('No valid gameweek data available');
      }
      const stats = await playerService.getGameweekPlayerStats(gameweekData.id.toString());
      return stats?.elements || [];
    },
    enabled: !!(liveGameweekData?.id || previousGWData?.id)
  });

  // Use React Query for league data
  const {
    data: leagueData,
    error: overallLeagueDataError,
    isLoading: isLoadingoverallLeagueData,
  } = useQuery({
    queryKey: ['leagueData', leagueId],
    queryFn: () => leagueService.getStandings(leagueId),
  });

  // Use React Query for selected gameweek data
  const { data: currentGameweekData } = useQuery({
    queryKey: ['selectedGameweek', currentGameweekNumber],
    queryFn: async () => {
      if (!currentGameweekNumber) return null;
      const { data } = await supabase
        .from('fploveralldata')
        .select()
        .eq('id', currentGameweekNumber)
        .single();
      return data;
    },
    enabled: !!currentGameweekNumber
  });

  useEffect(() => {
    if (liveGameweekData) {
      updateLiveGWData(liveGameweekData);
    } else if (previousGWData) {
      updateLiveGWData(previousGWData);
    }
  }, [liveGameweekData, previousGWData, updateLiveGWData]);

  useEffect(() => {
    setSelectedGameweekData(currentGameweekData || liveGameweekData);
  }, [currentGameweekData, liveGameweekData]);

  // Player and team data queries with proper type checking
  const { data: highScorePlayerData } = useQuery({
    queryKey: ['highScorePlayer', selectedGameweekData?.top_element],
    queryFn: async () => {
      if (!selectedGameweekData?.top_element) return null;
      const { data } = await supabase
        .from('plplayerdata')
        .select()
        .eq('id', selectedGameweekData.top_element);
      return data || null;
    },
    enabled: !!selectedGameweekData?.top_element
  });

  const { data: highScorePlayerTeam } = useQuery({
    queryKey: ['highScorePlayerTeam', highScorePlayerData?.[0]?.team],
    queryFn: async () => {
      if (!highScorePlayerData?.[0]?.team) return null;
      const { data } = await supabase
        .from('plteams')
        .select()
        .eq('id', highScorePlayerData[0].team);
      return data || null;
    },
    enabled: !!(highScorePlayerData?.[0]?.team)
  });

  const { data: mostCaptPlayerData } = useQuery({
    queryKey: ['mostCaptPlayer', selectedGameweekData?.most_captained],
    queryFn: async () => {
      if (!selectedGameweekData?.most_captained) return [{ status: "loading" }];
      const { data } = await supabase
        .from('plplayerdata')
        .select()
        .eq('id', selectedGameweekData.most_captained);
      return data ? [...data, { status: "success" }] : [{ status: "loading" }];
    },
    enabled: !!selectedGameweekData?.most_captained
  });

  const { data: mostCaptPlayerTeam } = useQuery({
    queryKey: ['mostCaptPlayerTeam', mostCaptPlayerData?.[0]?.team],
    queryFn: async () => {
      if (!mostCaptPlayerData?.[0]?.team) return null;
      const { data } = await supabase
        .from('plteams')
        .select()
        .eq('id', mostCaptPlayerData[0].team);
      return data || null;
    },
    enabled: !!(mostCaptPlayerData?.[0]?.team && mostCaptPlayerData[0].status !== "loading")
  });

  useEffect(() => {
    const storedFplId = localStorage.getItem('fplId');
    const storedManagerData = JSON.parse(localStorage.getItem('managerData') || 'null');
    if (storedManagerData && storedFplId && !isSignedIn) {
      signIn(storedFplId, storedManagerData);
    }
  }, [isSignedIn, signIn]);

  const highScorePlayerFixture = highScorePlayerTeam?.[0]?.short_name && highScorePlayerData ? 
    `${highScorePlayerTeam[0].short_name} v ...` : '...';
  const mostCaptPlayerFixture = mostCaptPlayerTeam?.[0]?.short_name && mostCaptPlayerData ? 
    `${mostCaptPlayerTeam[0].short_name} v ...` : '...';

  return (
    <div className="space-y-6">
      {isSignedIn ?
        <section className="space-y-4">
          <WelcomeBanner />
        </section>
        :
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Here's the FPL 2025 season at a glance.
            </h2>
            <p className="mt-2 text-muted-foreground">
              Overall FPL data and statistics.
            </p>
          </div>
        </div>
      }
      <br />
      <Tabs defaultValue="charts" className="space-y-4">
        <div className="w-full overflow-x-auto no-scrollbar">
          <TabsList className="w-full justify-start inline-flex min-w-max">
            <TabsTrigger value="charts">FPL Data Visualized</TabsTrigger>
            <TabsTrigger value="table">FPL Standings</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="charts" className="space-y-4">
          <GameweekPaginator
            currentGameweekNumber={currentGameweekNumber}
            setCurrentGameweekNumber={setCurrentGameweekNumber}
            totalGameweeks={38}
            liveGameweekData={liveGameweekData}
          />

          <StatsOverview
            currentGW={selectedGameweekData}
            mostCaptPlayerData={mostCaptPlayerData || [{ status: "loading" }]}
            highScorePlayerData={highScorePlayerData}
            highScorePlayerFixture={highScorePlayerFixture}
            mostCaptPlayerFixture={mostCaptPlayerFixture}
          />
          <VisualizationSection
            selectedGameweekData={selectedGameweekData}
            mostCaptPlayerData={mostCaptPlayerData}
            mostCaptPlayerFixture={mostCaptPlayerFixture}
            mostTransferredPlayerData={null}
            mostTransferredPlayerTeam={null}
          />
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