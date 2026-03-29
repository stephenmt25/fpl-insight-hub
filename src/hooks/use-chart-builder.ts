import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { playerService } from "@/services/fpl-api";
import { buildChartData, buildRadarData } from "@/lib/chart-utils";
import type { MetricKey, ChartType, TimeRange, Aggregation } from "@/lib/chart-utils";
import type { PlayerStats } from "@/types/fpl";

interface SelectedPlayer {
  id: number;
  name: string;
}

export function useChartBuilder() {
  const [selectedPlayers, setSelectedPlayers] = useState<SelectedPlayer[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<MetricKey[]>(['total_points']);
  const [chartType, setChartType] = useState<ChartType>('line');
  const [timeRange, setTimeRange] = useState<TimeRange>('season');
  const [aggregation, setAggregation] = useState<Aggregation>('per_gw');

  // Fetch all players for search
  const { data: allPlayers } = useQuery({
    queryKey: ['allPlayersChartBuilder'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plplayerdata')
        .select('id, web_name, team, element_type')
        .order('total_points', { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000,
  });

  // Fetch per-GW histories for selected players
  const { data: histories, isLoading: isLoadingHistories } = useQuery({
    queryKey: ['playerHistories', selectedPlayers.map(p => p.id)],
    queryFn: async () => {
      const results = new Map<number, { name: string; history: PlayerStats[] }>();
      await Promise.all(
        selectedPlayers.map(async (player) => {
          const summary = await playerService.getPlayerSummary(player.id.toString());
          results.set(player.id, { name: player.name, history: summary.history });
        })
      );
      return results;
    },
    enabled: selectedPlayers.length > 0,
  });

  const chartData = useMemo(() => {
    if (!histories || histories.size === 0) return [];
    if (chartType === 'radar') return buildRadarData(histories, selectedMetrics);
    return buildChartData(histories, selectedMetrics, timeRange, aggregation);
  }, [histories, selectedMetrics, timeRange, aggregation, chartType]);

  const addPlayer = (id: number, name: string) => {
    if (selectedPlayers.length >= 8) return;
    if (selectedPlayers.find(p => p.id === id)) return;
    setSelectedPlayers(prev => [...prev, { id, name }]);
  };

  const removePlayer = (id: number) => {
    setSelectedPlayers(prev => prev.filter(p => p.id !== id));
  };

  const toggleMetric = (metric: MetricKey) => {
    setSelectedMetrics(prev =>
      prev.includes(metric)
        ? prev.filter(m => m !== metric)
        : prev.length < 4 ? [...prev, metric] : prev
    );
  };

  return {
    // Player selection
    allPlayers: allPlayers || [],
    selectedPlayers,
    addPlayer,
    removePlayer,
    // Metric selection
    selectedMetrics,
    toggleMetric,
    // Chart config
    chartType,
    setChartType,
    timeRange,
    setTimeRange,
    aggregation,
    setAggregation,
    // Data
    chartData,
    isLoadingHistories,
    histories,
  };
}
