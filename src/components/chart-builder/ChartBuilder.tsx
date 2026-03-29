import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Skeleton } from "@/components/ui/skeleton";
import { X, LineChart, BarChart3, ScatterChart, Radar, AreaChart } from "lucide-react";
import {
  LineChart as ReLineChart, Line, BarChart, Bar, AreaChart as ReAreaChart, Area,
  RadarChart, Radar as ReRadar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart as ReScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { useChartBuilder } from "@/hooks/use-chart-builder";
import { METRIC_DEFINITIONS, METRIC_CATEGORIES, PLAYER_COLORS } from "@/lib/chart-utils";
import type { MetricKey, ChartType } from "@/lib/chart-utils";
import { getPositionLabel } from "@/utils/player-utils";

const CHART_TYPE_OPTIONS: { type: ChartType; icon: typeof LineChart; label: string }[] = [
  { type: 'line', icon: LineChart, label: 'Line' },
  { type: 'bar', icon: BarChart3, label: 'Bar' },
  { type: 'area', icon: AreaChart, label: 'Area' },
  { type: 'radar', icon: Radar, label: 'Radar' },
];

export function ChartBuilder() {
  const {
    allPlayers,
    selectedPlayers,
    addPlayer,
    removePlayer,
    selectedMetrics,
    toggleMetric,
    chartType,
    setChartType,
    timeRange,
    setTimeRange,
    aggregation,
    setAggregation,
    chartData,
    isLoadingHistories,
    histories,
  } = useChartBuilder();

  const [search, setSearch] = useState('');

  const searchResults = search.length >= 2
    ? allPlayers.filter(p =>
        (p.web_name || '').toLowerCase().includes(search.toLowerCase())
      ).slice(0, 8)
    : [];

  // Build data keys for the chart
  const dataKeys: { key: string; name: string; color: string }[] = [];
  if (histories && chartType !== 'radar') {
    selectedPlayers.forEach((player, idx) => {
      selectedMetrics.forEach(metric => {
        dataKeys.push({
          key: `${player.name}_${metric}`,
          name: selectedPlayers.length > 1
            ? `${player.name} - ${METRIC_DEFINITIONS[metric].label}`
            : METRIC_DEFINITIONS[metric].label,
          color: PLAYER_COLORS[idx % PLAYER_COLORS.length],
        });
      });
    });
  }

  return (
    <div className="space-y-4">
      {/* Player Search */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Select Players (max 8)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="relative">
            <Input
              placeholder="Search player name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto">
                {searchResults.map(p => (
                  <button
                    key={p.id}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex justify-between"
                    onClick={() => { addPlayer(p.id, p.web_name || ''); setSearch(''); }}
                  >
                    <span className="font-medium">{p.web_name}</span>
                    <span className="text-muted-foreground text-xs">{getPositionLabel(p.element_type)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {selectedPlayers.map((player, idx) => (
              <Badge
                key={player.id}
                variant="outline"
                style={{ borderColor: PLAYER_COLORS[idx], color: PLAYER_COLORS[idx] }}
                className="gap-1"
              >
                {player.name}
                <button onClick={() => removePlayer(player.id)}><X className="h-3 w-3" /></button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Controls Row */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Metrics */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Metrics (max 4)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {METRIC_CATEGORIES.map(category => {
                const metrics = Object.entries(METRIC_DEFINITIONS)
                  .filter(([_, def]) => def.category === category);
                return (
                  <div key={category}>
                    <p className="text-[10px] text-muted-foreground font-medium mb-1">{category}</p>
                    <div className="flex flex-wrap gap-1">
                      {metrics.map(([key, def]) => {
                        const isSelected = selectedMetrics.includes(key as MetricKey);
                        return (
                          <button
                            key={key}
                            onClick={() => toggleMetric(key as MetricKey)}
                            className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                              isSelected
                                ? 'bg-fpl-secondary/20 border-fpl-secondary text-fpl-secondary'
                                : 'border-border text-muted-foreground hover:border-foreground'
                            }`}
                          >
                            {def.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Chart Type + Options */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Chart Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-[10px] text-muted-foreground font-medium mb-1">Chart Type</p>
              <div className="flex gap-2">
                {CHART_TYPE_OPTIONS.map(({ type, icon: Icon, label }) => (
                  <Button
                    key={type}
                    variant={chartType === type ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setChartType(type)}
                    className="gap-1"
                  >
                    <Icon className="h-3.5 w-3.5" />{label}
                  </Button>
                ))}
              </div>
            </div>

            {chartType !== 'radar' && (
              <>
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium mb-1">Time Range</p>
                  <ToggleGroup type="single" value={timeRange} onValueChange={v => v && setTimeRange(v as typeof timeRange)}>
                    <ToggleGroupItem value="season" className="text-xs">Full Season</ToggleGroupItem>
                    <ToggleGroupItem value="last10" className="text-xs">Last 10</ToggleGroupItem>
                    <ToggleGroupItem value="last5" className="text-xs">Last 5</ToggleGroupItem>
                  </ToggleGroup>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium mb-1">Aggregation</p>
                  <ToggleGroup type="single" value={aggregation} onValueChange={v => v && setAggregation(v as typeof aggregation)}>
                    <ToggleGroupItem value="per_gw" className="text-xs">Per GW</ToggleGroupItem>
                    <ToggleGroupItem value="cumulative" className="text-xs">Cumulative</ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {selectedPlayers.length > 0 && selectedMetrics.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            {isLoadingHistories ? (
              <Skeleton className="h-[350px] w-full" />
            ) : chartData.length > 0 ? (
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'line' ? (
                    <ReLineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="gameweek" />
                      <YAxis />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      {dataKeys.map(dk => (
                        <Line key={dk.key} type="monotone" dataKey={dk.key} name={dk.name} stroke={dk.color} dot={false} />
                      ))}
                    </ReLineChart>
                  ) : chartType === 'bar' ? (
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="gameweek" />
                      <YAxis />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      {dataKeys.map(dk => (
                        <Bar key={dk.key} dataKey={dk.key} name={dk.name} fill={dk.color} />
                      ))}
                    </BarChart>
                  ) : chartType === 'area' ? (
                    <ReAreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="gameweek" />
                      <YAxis />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      {dataKeys.map(dk => (
                        <Area key={dk.key} type="monotone" dataKey={dk.key} name={dk.name} stroke={dk.color} fill={dk.color} fillOpacity={0.15} />
                      ))}
                    </ReAreaChart>
                  ) : chartType === 'radar' ? (
                    <RadarChart data={chartData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                      {selectedPlayers.map((player, idx) => (
                        <ReRadar
                          key={player.id}
                          name={player.name}
                          dataKey={player.name}
                          stroke={PLAYER_COLORS[idx]}
                          fill={PLAYER_COLORS[idx]}
                          fillOpacity={0.15}
                        />
                      ))}
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </RadarChart>
                  ) : null}
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No data to display. Select players and metrics above.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {selectedPlayers.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium">Search and add players to get started</p>
          <p className="text-sm mt-1">Then pick metrics and a chart type to visualize their data</p>
        </div>
      )}
    </div>
  );
}
