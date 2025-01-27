import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, ZAxis, Dot, Legend } from 'recharts';
import { useState, useEffect, FC } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface PlayerData {
  web_name: string;
  now_cost: number;
  form: string;
  selected_by_percent: string;
  team: number;
}

interface ProcessedPlayerData {
  name: string;
  form: number;
  price: number;
  ownership: number;
  teamName: string | null;
}

export function FormValueAnalysis() {
  const [playerData, setPlayerData] = useState<PlayerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [processedData, setProcessedData] = useState<ProcessedPlayerData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: playerData, error: playerError } = await supabase
          .from('plplayerdata')
          .select('web_name, now_cost, form, selected_by_percent, team, element_type')
          .not('form', 'is', null)

        if (playerError) throw playerError;

        const filteredPlayers = playerData
          .filter(player => parseFloat(player.form || '0') >= 2) // Exclude players with form < 1
          .filter(player => parseFloat(player.selected_by_percent || '0') > 0) // Exclude players with 0% ownership
          .filter(player => player.element_type !== 5);
          
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
          price: player.now_cost / 10,
          form: parseFloat(player.form || '0'),
          ownership: parseFloat(player.selected_by_percent || '0'),
          teamName: teamMap[player.team] || null,
        }));
        setProcessedData(processed);
      } catch (error) {
        console.error('Error fetching player data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);



  const averageForm = processedData.reduce((acc, curr) => acc + curr.form, 0) / processedData.length;
  const averagePrice = processedData.reduce((acc, curr) => acc + curr.price, 0) / processedData.length;

  const goodValuePlayers = processedData
    .filter(player => player.form > averageForm && player.price < averagePrice)
    .sort((a, b) => (b.form) - (a.form))
    .slice(0, 5);

  const badValuePlayers = processedData
    .filter(player => player.form < averageForm && player.price > averagePrice)
    .sort((a, b) => (a.form) - (b.form))
    .slice(0, 5);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="w-full lg:gap-20 gap-4 grid grid-cols-5">
      <Card className="col-span-5 lg:col-span-2">
        <CardHeader>
          {/* <CardTitle>Top 5 Differential Picks</CardTitle> */}
        </CardHeader>
        <CardContent className="flex flex-col lg:flex-row gap-4 ">
        <div className="w-full gap-2 grid grid-cols-2">
            <div className="col-span-1">
              <h4 className="font-semibold mb-2">Good Value</h4>
              {goodValuePlayers.map((player, index) => (
                <div key={index} className="mb-2 p-2 flex justify-between  bg-green-50 rounded">
                  <div className="font-medium">
                    {player.name}
                    <br />
                    <div className="text-sm  text-gray-400">
                      {player.teamName && `${player.teamName}`}
                    </div>
                  </div>
                  <div className="text-sm text-right text-gray-600">
                    Price: £{player.price}m
                    <br />
                    Form: {player.form}
                  </div>
                </div>
              ))}
            </div>
            <div>
              <h4 className="font-semibold mb-2">Bad Value</h4>
              {badValuePlayers.map((player, index) => (
                <div key={index} className="mb-2 p-2 bg-red-50 flex justify-between  rounded">
                  <div className="font-medium">
                    {player.name}
                    <br />
                    <div className="text-sm text-gray-400">
                      {player.teamName && `${player.teamName}`}
                    </div>
                  </div>
                  <div className=" text-sm text-right text-gray-600">
                    Price: £{player.price}m
                    <br />
                    Form: {player.form}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-5 lg:col-span-3">
        <CardHeader>
          <CardTitle>Bargains</CardTitle>
          <CardDescription>
            Visualizing players based on their form, price, and ownership
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col lg:flex-row gap-4">
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                {/* <CartesianGrid strokeDasharray="3 3" /> */}
                <XAxis
                  type="number"
                  dataKey="price"
                  name="Price"
                  unit="m"
                  domain={['dataMin', 'dataMax']}
                  label={{ value: 'Price', angle: 0, position: 'insideBottomRight', offset: -10}}
                />
                <YAxis
                  type="number"
                  dataKey="form"
                  name="Form"
                  domain={['dataMin', 'dataMax']}
                  width={15}
                  label={{ value: 'Form', angle: 0, position: 'insideTopLeft', offset: -20}}
                />
                <ZAxis
                  type="number"
                  dataKey="ownership"
                  name="Ownership"
                  range={[50, 500]}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-2 border rounded shadow">
                          <p className="font-bold">{data.name}</p>
                          <p>Price: £{data.price}m</p>
                          <p>Form: {data.form}</p>
                          <p>Ownership: {data.ownership}%</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine x={averagePrice} stroke="#a6a6a6" strokeDasharray="3 3" label={{ value: `Average Price: £${averagePrice.toFixed(1)}m`, angle: 90, position: "left", offset: -12}} />
                <ReferenceLine y={averageForm} stroke="#a6a6a6" strokeDasharray="3 3" label={{ value: `Average Form: ${averageForm.toFixed(1)}`, position: "insideTop"}}/>
                <Scatter
                  data={processedData}
                  fill="#8884d8"
                  fillOpacity={0.6}
                // shape={<RenderDot/>}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          
        </CardContent>
      </Card>
    </div>
  );
}