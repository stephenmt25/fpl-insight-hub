import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, Legend } from 'recharts';
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { kMeansClustering, identifyDifferentials, getClusterStats } from "@/lib/ml/differential-clustering";
import { PlayerFeatures } from "@/lib/ml/types";

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
  cluster: number;
  confidenceScore: number;
  reasoning: string[];
  xgPer90: number;
  xaPer90: number;
  ictIndex: number;
  priceValue: number;
}

export function DifferentialPicks() {
  const [loading, setLoading] = useState(true);
  const [processedData, setProcessedData] = useState<ProcessedPlayerData[]>([]);
  const [clusterStats, setClusterStats] = useState<any[]>([]);

  useEffect(() => {
    const fetchPlayersAndTeams = async () => {
      try {
        const { data: playerData, error: playerError } = await supabase
          .from('plplayerdata')
          .select('id, web_name, form, selected_by_percent, team, element_type, expected_goals_per_90, expected_assists_per_90, ict_index, value_form, now_cost, points_per_game')
          .not('form', 'is', null)
          .not('expected_goals_per_90', 'is', null)
          .not('ict_index', 'is', null);

        if (playerError) throw playerError;

        const filteredPlayers = playerData
          .filter(player => parseFloat(player.form || '0') >= 2)
          .filter(player => parseFloat(player.selected_by_percent || '0') > 0)
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

        // Prepare features for ML clustering
        const playerFeatures: PlayerFeatures[] = filteredPlayers.map(player => ({
          playerId: player.id,
          name: player.web_name,
          teamName: teamMap[player.team] || null,
          form: parseFloat(player.form || '0'),
          ownership: parseFloat(player.selected_by_percent || '0'),
          xgPer90: parseFloat(player.expected_goals_per_90 || '0'),
          xaPer90: parseFloat(player.expected_assists_per_90 || '0'),
          ictIndex: parseFloat(player.ict_index || '0'),
          priceValue: parseFloat(player.value_form || '0'),
          pointsPerGame: parseFloat(player.points_per_game || '0')
        }));

        // Apply K-means clustering
        const clusteredPlayers = kMeansClustering(playerFeatures, 4);
        
        // Identify differentials
        const differentials = identifyDifferentials(clusteredPlayers, 35, 5.0);
        
        // Get cluster statistics
        const stats = getClusterStats(clusteredPlayers);
        setClusterStats(stats);

        // Map all clustered players for visualization
        const processed = clusteredPlayers.map(cp => ({
          name: cp.name,
          form: cp.features.form,
          ownership: cp.features.ownership,
          teamName: cp.teamName,
          cluster: cp.cluster,
          confidenceScore: cp.confidenceScore,
          reasoning: [],
          xgPer90: cp.features.xgPer90,
          xaPer90: cp.features.xaPer90,
          ictIndex: cp.features.ictIndex,
          priceValue: cp.features.priceValue
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

  const OWNERSHIP_THRESHOLD = 35;
  const averageForm = processedData.reduce((acc, curr) => acc + curr.form, 0) / (processedData.length || 1);

  const differentialPicks = processedData
    .filter(player => player.form > 5.0 && player.ownership < OWNERSHIP_THRESHOLD && player.reasoning)
    .sort((a, b) => {
      const scoreA = a.form * (a.confidenceScore / 100);
      const scoreB = b.form * (b.confidenceScore / 100);
      return scoreB - scoreA;
    })
    .slice(0, 5);

  const CLUSTER_COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];
  const CLUSTER_NAMES = ['Cluster 1', 'Cluster 2', 'Cluster 3', 'Cluster 4'];

  if (loading) return <div>Loading...</div>;

  return (
    <div className="w-full gap-4 grid grid-cols-5">
      <Card className="col-span-5 lg:col-span-3">
        <CardHeader>
          <CardTitle>ML-Powered Differential Analysis</CardTitle>
          <CardDescription>
            K-means clustering identifies player groups based on form, ownership, xG/xA, and ICT index
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="w-full h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <XAxis
                  type="number"
                  dataKey="ownership"
                  name="Ownership"
                  unit="%"
                  domain={[0, 100]}
                  label={{ value: 'Ownership %', angle: 0, position: 'insideBottomRight', offset: -10 }}
                />
                <YAxis
                  type="number"
                  dataKey="form"
                  name="Form"
                  domain={['dataMin', 'dataMax']}
                  width={15}
                  label={{ value: 'Form', angle: 0, position: 'insideTopLeft', offset: -20 }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const clusterStat = clusterStats.find(c => c.cluster === data.cluster);
                      return (
                        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
                          <p className="font-bold text-foreground">{data.name}</p>
                          <p className="text-sm text-muted-foreground">{data.teamName}</p>
                          <div className="mt-2 space-y-1 text-sm">
                            <p>Form: <span className="font-medium">{data.form.toFixed(1)}</span></p>
                            <p>Ownership: <span className="font-medium">{data.ownership.toFixed(1)}%</span></p>
                            <p>xG/90: <span className="font-medium">{data.xgPer90.toFixed(2)}</span></p>
                            <p>xA/90: <span className="font-medium">{data.xaPer90.toFixed(2)}</span></p>
                            <p>ICT: <span className="font-medium">{data.ictIndex.toFixed(1)}</span></p>
                            <p className="pt-1">
                              <Badge variant="outline" style={{ backgroundColor: CLUSTER_COLORS[data.cluster] + '20', borderColor: CLUSTER_COLORS[data.cluster] }}>
                                {clusterStat?.label || `Cluster ${data.cluster}`}
                              </Badge>
                            </p>
                            <p className="text-xs text-muted-foreground">Confidence: {data.confidenceScore}%</p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine x={OWNERSHIP_THRESHOLD} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" label={{ value: '35%', angle: 90, position: "insideTopLeft", offset: 5 }} />
                <ReferenceLine y={averageForm} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" label={{ value: `Avg: ${averageForm.toFixed(1)}`, position: "insideTopRight" }} />
                
                {[0, 1, 2, 3].map(clusterIdx => (
                  <Scatter
                    key={clusterIdx}
                    name={clusterStats.find(c => c.cluster === clusterIdx)?.label || CLUSTER_NAMES[clusterIdx]}
                    data={processedData.filter(p => p.cluster === clusterIdx)}
                    fill={CLUSTER_COLORS[clusterIdx]}
                    fillOpacity={0.7}
                  />
                ))}
                <Legend />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          
          {clusterStats.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
              {clusterStats.map(stat => (
                <div 
                  key={stat.cluster}
                  className="p-2 rounded border border-border"
                  style={{ borderLeftWidth: '3px', borderLeftColor: CLUSTER_COLORS[stat.cluster] }}
                >
                  <p className="font-semibold text-foreground">{stat.label}</p>
                  <p className="text-muted-foreground">{stat.count} players</p>
                  <p className="text-muted-foreground">Avg Form: {stat.avgForm}</p>
                  <p className="text-muted-foreground">Avg Own: {stat.avgOwnership}%</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      {/* <div className="lg:col-span-1">

      </div> */}
      <Card className="col-span-5 lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Top Differentials
            <Badge variant="secondary">ML Powered</Badge>
          </CardTitle>
          <CardDescription>
            High-performing players with low ownership (&lt;35%), ranked by ML confidence
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 h-[500px] overflow-y-auto">
          {differentialPicks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No differentials found matching criteria</p>
          ) : (
            differentialPicks.map((player, index) => (
              <div
          key={index}
          className={`p-3 rounded-lg border transition-all ${
            index === 0 
              ? 'bg-primary/5 border-primary shadow-sm' 
              : 'bg-muted/30 border-border hover:bg-muted/50'
          }`}
              >
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="font-semibold text-foreground">{player.name}</p>
              <p className="text-xs text-muted-foreground">{player.teamName}</p>
            </div>
            <Badge 
              variant="outline" 
              style={{ 
                backgroundColor: CLUSTER_COLORS[player.cluster] + '20',
                borderColor: CLUSTER_COLORS[player.cluster]
              }}
            >
              {player.confidenceScore}%
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-2">
            <div>Form: <span className="font-medium text-foreground">{player.form.toFixed(1)}</span></div>
            <div>Own: <span className="font-medium text-foreground">{player.ownership.toFixed(1)}%</span></div>
            <div>xG/90: <span className="font-medium text-foreground">{player.xgPer90.toFixed(2)}</span></div>
            <div>xA/90: <span className="font-medium text-foreground">{player.xaPer90.toFixed(2)}</span></div>
          </div>
          
          {player.reasoning && player.reasoning.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {player.reasoning.slice(0, 3).map((reason, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {reason}
                </Badge>
              ))}
            </div>
          )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}