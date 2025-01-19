import { TempRadarChart } from "@/components/tempRadarChart";
import { AverageTeamValueAreaChart } from "@/components/averageTeamValueAreaChart";
import { AveragePtsLineChart } from "@/components/averagePointsLineChart";
import { CaptaincyPieChart } from "../captainsPieChart";
import { FormValueAnalysis } from "../FormValueAnalysis";
import { DifferentialPicks } from "../DifferentialPicks";
import { Card, CardContent, CardDescription, CardHeader } from "../ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export function VisualizationSection() {
  const [currentGameweek, setCurrentGameweek] = useState<any>(null);
  const [captainStats, setCaptainStats] = useState<any>(null);

  const { data: gameweekData } = useQuery({
    queryKey: ['currentGameweek'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fploveralldata')
        .select('*')
        .eq('is_current', 'true')
        .single();

      if (error) throw error;
      return data;
    }
  });

  const { data: captainData } = useQuery({
    queryKey: ['captainData', gameweekData?.id],
    queryFn: async () => {
      if (!gameweekData?.most_captained) return null;
      
      const { data, error } = await supabase
        .from('plplayerdata')
        .select('web_name, team, form, selected_by_percent, total_points')
        .eq('id', gameweekData.most_captained)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!gameweekData?.most_captained
  });

  useEffect(() => {
    if (gameweekData) {
      setCurrentGameweek(gameweekData);
    }
    if (captainData) {
      setCaptainStats(captainData);
    }
  }, [gameweekData, captainData]);

  return (
    <div className="w-full lg:max-w-full">
      <h3 className="text-lg font-medium mb-4">Data Visualization</h3>
      <div className="grid gap-4">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="col-span-3 lg:col-span-1">
            <CaptaincyPieChart />
          </div>
          <div className="col-span-3 lg:col-span-1">
            <Card className="lg:h-[48%] lg:w-4/5">
              <CardHeader>
                <CardDescription>
                  Most Captained Player
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col lg:flex-row gap-4">
                <div className="w-full">
                  <div className='flex justify-between rounded'>
                    <div className="text-4xl">
                      {captainStats?.web_name || 'Loading...'}
                      <br />
                      <div className="text-sm text-gray-400">
                        Team: {captainStats?.team || '-'}
                        <br />
                        Ownership: {captainStats?.selected_by_percent || '0'}%
                      </div>
                    </div>
                    <div className="text-4xl text-right text-gray-600">
                      {captainStats?.total_points || '0'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="h-3 lg:h-[4%] lg:w-5/5"></div>
            <Card className="lg:h-[48%] lg:w-4/5 lg:float-right">
              <CardHeader>
                <CardDescription>
                  Gameweek Overview
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col lg:flex-row gap-4">
                <div className='flex-row w-full'>
                  <div className="flex justify-between rounded">
                    <div className="">
                      Total Transfers Made
                    </div>
                    <div className="text-xl text-right text-gray-600">
                      {currentGameweek?.transfers_made || '0'}
                    </div>
                  </div>
                  <div className="flex justify-between rounded">
                    <div className="">
                      Average Score
                    </div>
                    <div className="text-xl text-right text-gray-600">
                      {currentGameweek?.average_entry_score || '0'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="col-span-3 lg:col-span-1">
            <AveragePtsLineChart />
          </div>
          <div className="col-span-3">
            <DifferentialPicks />
          </div>
          <div className="col-span-3">
            <FormValueAnalysis />
          </div>
        </div>
      </div>
    </div>
  );
}