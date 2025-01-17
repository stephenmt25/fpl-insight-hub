import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, ZAxis, Dot } from 'recharts';
import { useState, useEffect, FC } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface PlayerData {
  web_name: string;
  now_cost: number;
  form: string;
  selected_by_percent: string;
  team: number;
}

export function FormValueAnalysis() {
  const [playerData, setPlayerData] = useState<PlayerData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from('plplayerdata')
          .select('web_name, now_cost, form, selected_by_percent, team')
          .not('form', 'is', null)

        if (error) throw error;
        setPlayerData(data || []);
      } catch (error) {
        console.error('Error fetching player data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const processedData = playerData
  .filter(player => parseFloat(player.form || '0') >= 1) // Exclude players with form < 1
  .filter(player => parseFloat(player.selected_by_percent || '0') > 0) // Exclude players with 0% ownership
  .map(player => ({
    name: player.web_name,
    price: player.now_cost / 10,
    form: parseFloat(player.form || '0'),
    ownership: parseFloat(player.selected_by_percent || '0'),
  }));

  const averageForm = processedData.reduce((acc, curr) => acc + curr.form, 0) / processedData.length;
  const averagePrice = processedData.reduce((acc, curr) => acc + curr.price, 0) / processedData.length;

  const goodValuePlayers = processedData
    .filter(player => player.form > averageForm && player.price < averagePrice)
    .sort((a, b) => (b.form / b.price) - (a.form / a.price))
    .slice(0, 5);

  const badValuePlayers = processedData
    .filter(player => player.form < averageForm && player.price > averagePrice)
    .sort((a, b) => (a.form / a.price) - (b.form / b.price))
    .slice(0, 5);

  if (loading) return <div>Loading...</div>;

  // interface DotProps {
  //   cx: number;
  //   cy: number;
  // }

  // const RenderDot: FC<DotProps> = ({ cx, cy }) => {
  //   return (
  //     <Dot cx={cx} cy={cy} r={5} />
  //   )
  // }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Form vs Value Analysis</CardTitle>
        <CardDescription>
          Visualizing players based on their form, price, and ownership
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col lg:flex-row gap-4">
        <div className="w-full lg:w-3/5 h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number" 
                dataKey="price" 
                name="Price" 
                unit="m" 
                domain={['dataMin', 'dataMax']}
              />
              <YAxis 
                type="number" 
                dataKey="form" 
                name="Form" 
                domain={['dataMin', 'dataMax']}
                hide
              />
              <ZAxis range={[40, 41]} />
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
              <ReferenceLine x={averagePrice} stroke="#666" strokeDasharray="3 3" />
              <ReferenceLine y={averageForm} stroke="#666" strokeDasharray="3 3" />
              <Scatter
                data={processedData}
                fill="#8884d8"
                fillOpacity={0.6}
                // shape={<RenderDot/>}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div className="w-full lg:w-2/5 gap-2 grid grid-cols-2">
          <div className="col-span-1">
            <h4 className="font-semibold mb-2">Top 5 Good Value Players</h4>
            {goodValuePlayers.map((player, index) => (
              <div key={index} className="mb-2 p-2 bg-green-50 rounded">
                <div className="font-medium">{player.name}</div>
                <div className="text-sm text-gray-600">
                  Price: £{player.price}m | Form: {player.form}
                </div>
              </div>
            ))}
          </div>
          <div>
            <h4 className="font-semibold mb-2">Bottom 5 Bad Value Players</h4>
            {badValuePlayers.map((player, index) => (
              <div key={index} className="mb-2 p-2 bg-red-50 rounded">
                <div className="font-medium">{player.name}</div>
                <div className="text-sm text-gray-600">
                  Price: £{player.price}m | Form: {player.form}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}