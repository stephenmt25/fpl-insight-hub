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

export function DifferentialPicks() {
  const [playerData, setPlayerData] = useState<PlayerData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from('plplayerdata')
          .select('web_name, form, selected_by_percent, team')
          .not('form', 'is', null);

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
    .filter(player => parseFloat(player.form || '0') >= 4) // Exclude players with form < 1
    .filter(player => parseFloat(player.selected_by_percent || '0') > 0) // Exclude players with 0% ownership
    .map(player => ({
      name: player.web_name,
      form: parseFloat(player.form || '0'),
      ownership: parseFloat(player.selected_by_percent || '0'),
    }));

  const OWNERSHIP_THRESHOLD = 15;
  const averageForm = processedData.reduce((acc, curr) => acc + curr.form, 0) / processedData.length;

  const differentialPicks = processedData
    .filter(player => player.form > averageForm && player.ownership < OWNERSHIP_THRESHOLD)
    .sort((a, b) => (b.form / b.ownership) - (a.form / a.ownership))
    .slice(0, 5);

  if (loading) return <div>Loading...</div>;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Differential Picks – Form vs Ownership</CardTitle>
        <CardDescription>
          Find high-performing players with low ownership percentages
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col lg:flex-row gap-4">
        <div className="w-full lg:w-3/5 h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
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
        <div className="w-full lg:w-2/5">
          <h4 className="font-semibold mb-2">Top 5 Differential Picks</h4>
          {differentialPicks.map((player, index) => (
            <div
              key={index}
              className={`mb-2 p-2 rounded ${index === 0 ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                }`}
            >
              <div className="font-medium">{player.name}</div>
              <div className="text-sm text-gray-600">
                Form: {player.form.toFixed(1)} | Ownership: {player.ownership.toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}