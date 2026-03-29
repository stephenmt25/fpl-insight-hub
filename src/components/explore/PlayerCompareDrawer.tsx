import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend,
} from "recharts";
import { getPositionLabel } from "@/utils/player-utils";
import type { Database } from "@/integrations/supabase/types";

type PlayerRow = Database['public']['Tables']['plplayerdata']['Row'];

interface PlayerCompareDrawerProps {
  players: PlayerRow[];
  teams: { id: number; short_name: string }[] | null;
  onClear: () => void;
  onRemove: (id: number) => void;
}

const COLORS = ["#00ff87", "#04f5ff", "#ff04a1", "#ffd700"];

function normalize(value: number, max: number): number {
  return max > 0 ? Math.round((value / max) * 100) : 0;
}

export function PlayerCompareDrawer({ players, teams, onClear, onRemove }: PlayerCompareDrawerProps) {
  if (players.length === 0) return null;

  // Build radar data
  const metrics = [
    { key: 'form', label: 'Form', extract: (p: PlayerRow) => parseFloat(p.form || '0'), max: 10 },
    { key: 'points', label: 'Points', extract: (p: PlayerRow) => p.total_points || 0, max: Math.max(...players.map(p => p.total_points || 0)) },
    { key: 'xG', label: 'xG', extract: (p: PlayerRow) => parseFloat(p.expected_goals || '0'), max: Math.max(...players.map(p => parseFloat(p.expected_goals || '0'))) },
    { key: 'xA', label: 'xA', extract: (p: PlayerRow) => parseFloat(p.expected_assists || '0'), max: Math.max(...players.map(p => parseFloat(p.expected_assists || '0'))) },
    { key: 'ict', label: 'ICT', extract: (p: PlayerRow) => parseFloat(p.ict_index || '0'), max: Math.max(...players.map(p => parseFloat(p.ict_index || '0'))) },
    { key: 'price', label: 'Price', extract: (p: PlayerRow) => (p.now_cost || 0) / 10, max: Math.max(...players.map(p => (p.now_cost || 0) / 10)) },
  ];

  const radarData = metrics.map(metric => {
    const point: Record<string, string | number> = { metric: metric.label };
    players.forEach((player, idx) => {
      point[`p${idx}`] = normalize(metric.extract(player), metric.max);
    });
    return point;
  });

  return (
    <Card className="border-fpl-secondary/30">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Comparing {players.length} Players</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClear} className="h-7 text-xs">
            Clear All
          </Button>
        </div>
        <div className="flex flex-wrap gap-1">
          {players.map((player, idx) => (
            <Badge
              key={player.id}
              style={{ borderColor: COLORS[idx], color: COLORS[idx] }}
              variant="outline"
              className="text-xs gap-1"
            >
              {player.web_name} ({teams?.find(t => t.id === player.team)?.short_name}) · {getPositionLabel(player.element_type)}
              <button onClick={() => onRemove(player.id)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
              {players.map((player, idx) => (
                <Radar
                  key={player.id}
                  name={player.web_name || ''}
                  dataKey={`p${idx}`}
                  stroke={COLORS[idx]}
                  fill={COLORS[idx]}
                  fillOpacity={0.15}
                />
              ))}
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Stat comparison table */}
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                <th className="text-left py-1 pr-2">Stat</th>
                {players.map((p, idx) => (
                  <th key={p.id} className="text-right py-1 px-1" style={{ color: COLORS[idx] }}>
                    {p.web_name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Price', fn: (p: PlayerRow) => `${((p.now_cost || 0) / 10).toFixed(1)}` },
                { label: 'Points', fn: (p: PlayerRow) => `${p.total_points}` },
                { label: 'Form', fn: (p: PlayerRow) => p.form || '0' },
                { label: 'xG', fn: (p: PlayerRow) => p.expected_goals || '0' },
                { label: 'xA', fn: (p: PlayerRow) => p.expected_assists || '0' },
                { label: 'ICT', fn: (p: PlayerRow) => p.ict_index || '0' },
                { label: 'Own%', fn: (p: PlayerRow) => `${p.selected_by_percent}%` },
                { label: 'xPts', fn: (p: PlayerRow) => p.ep_next || '-' },
              ].map(row => (
                <tr key={row.label} className="border-b border-dashed">
                  <td className="py-1 pr-2 text-muted-foreground">{row.label}</td>
                  {players.map(p => (
                    <td key={p.id} className="text-right py-1 px-1 font-medium">{row.fn(p)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
