import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface PlayerData {
  web_name: string;
  form: string;
  selected_by_percent: string;
  team: number;
}

interface ProcessedPlayerData {
  name: string;
  form: number;
  ownership: number;
  teamName: string | null;
}

export function DifferentialPicks() {
  const [loading, setLoading] = useState(true);
  const [processedData, setProcessedData] = useState<ProcessedPlayerData[]>([]);

  useEffect(() => {
    const fetchPlayersAndTeams = async () => {
      try {
        const { data: playerData, error: playerError } = await supabase
          .from('plplayerdata')
          .select('web_name, form, selected_by_percent, team')
          .not('form', 'is', null);

        if (playerError) throw playerError;

        const filteredPlayers = playerData
          .filter(player => parseFloat(player.form || '0') >= 4) // Exclude players with form < 4
          .filter(player => parseFloat(player.selected_by_percent || '0') > 0); // Exclude players with 0% ownership

        const teamIds = [...new Set(filteredPlayers.map(player => player.team))];
        const { data: teamData, error: teamError } = await supabase
          .from('plteams')
          .select('id, short_name')
          .in('id', teamIds);

        if (teamError) throw teamError;

        const teamMap = (teamData || []).reduce(
          (map, team) => ({ ...map, [team.id]: team.short_name }),
          {} as Record<number, string>
        );

        const processed = filteredPlayers.map(player => ({
          name: player.web_name,
          form: parseFloat(player.form || '0'),
          ownership: parseFloat(player.selected_by_percent || '0'),
          teamName: teamMap[player.team] || null,
        }));

        setProcessedData(processed);
      } catch (error) {
        console.error('Error fetching players or teams:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayersAndTeams();
  }, []);

  const OWNERSHIP_THRESHOLD = 15;
  const averageForm = processedData.reduce((acc, curr) => acc + curr.form, 0) / processedData.length;

  const differentialPicks = processedData
    .filter(player => player.form > averageForm && player.ownership < OWNERSHIP_THRESHOLD)
    .sort((a, b) => (b.form / b.ownership) - (a.form / a.ownership))
    .slice(0, 5);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="w-full gap-4 lg:gap-20 grid grid-cols-5">
      <Card className="col-span-5 lg:col-span-3">
        <CardHeader>
          <CardTitle>Differentials</CardTitle>
          <CardDescription>
            high-performing players with low ownership percentages
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col lg:flex-row gap-4">
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                {/* <CartesianGrid strokeDasharray="3 3" /> */}
                <XAxis
                  type="number"
                  dataKey="ownership"
                  name="Ownership"
                  unit="%"
                  domain={[0, 100]}
                />
                <YAxis
                  type="number"
                  dataKey="form"
                  name="Form"
                  domain={['dataMin', 'dataMax']}
                  hide
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-2 border rounded shadow">
                          <p className="font-bold">{data.name}</p>
                          <p>Form: {data.form}</p>
                          <p>Ownership: {data.ownership}%</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine x={OWNERSHIP_THRESHOLD} stroke="#666" strokeDasharray="3 3" />
                <ReferenceLine y={averageForm} stroke="#666" strokeDasharray="3 3" />
                <Scatter
                  data={processedData}
                  fill="#8884d8"
                  fillOpacity={0.6}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      {/* <div className="lg:col-span-1">

      </div> */}
      <Card className="col-span-5 lg:col-span-2">
        <CardHeader>
          <CardTitle>Top Differentials</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col lg:flex-row gap-4 ">
          <div className="w-full">
            {differentialPicks.map((player, index) => (
              <div
                key={index}
                className={`mb-2 p-2 flex justify-between  rounded ${index === 0 ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                  }`}
              >
                <div className="font-medium">
                  {player.name}
                  <br />
                  <div className="text-sm  text-gray-400">
                    {player.teamName && `${player.teamName}`}
                  </div>
                </div>
                <div className="text-sm text-right text-gray-600">
                  Form: {player.form.toFixed(1)}
                  <br />
                  Ownership: {player.ownership.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}