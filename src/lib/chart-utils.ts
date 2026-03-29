import type { PlayerStats } from "@/types/fpl";

export type MetricKey = keyof typeof METRIC_DEFINITIONS;
export type ChartType = 'line' | 'bar' | 'scatter' | 'radar' | 'area';
export type TimeRange = 'season' | 'last5' | 'last10';
export type Aggregation = 'per_gw' | 'cumulative';

export const METRIC_DEFINITIONS = {
  total_points: { label: "Points", category: "Performance", color: "#00ff87" },
  goals_scored: { label: "Goals", category: "Attacking", color: "#04f5ff" },
  assists: { label: "Assists", category: "Attacking", color: "#ff04a1" },
  expected_goals: { label: "xG", category: "Attacking", color: "#ffd700" },
  expected_assists: { label: "xA", category: "Attacking", color: "#8b5cf6" },
  expected_goal_involvements: { label: "xGI", category: "Attacking", color: "#f97316" },
  clean_sheets: { label: "Clean Sheets", category: "Defensive", color: "#22c55e" },
  goals_conceded: { label: "Goals Conceded", category: "Defensive", color: "#ef4444" },
  expected_goals_conceded: { label: "xGC", category: "Defensive", color: "#dc2626" },
  influence: { label: "Influence", category: "ICT", color: "#a855f7" },
  creativity: { label: "Creativity", category: "ICT", color: "#06b6d4" },
  threat: { label: "Threat", category: "ICT", color: "#f43f5e" },
  ict_index: { label: "ICT Index", category: "ICT", color: "#eab308" },
  minutes: { label: "Minutes", category: "Other", color: "#6b7280" },
  bonus: { label: "Bonus", category: "Other", color: "#10b981" },
  bps: { label: "BPS", category: "Other", color: "#3b82f6" },
} as const;

export const METRIC_CATEGORIES = ["Performance", "Attacking", "Defensive", "ICT", "Other"] as const;

export interface ChartDataPoint {
  gameweek: number;
  [key: string]: number | string;
}

function extractMetric(history: PlayerStats, metric: MetricKey): number {
  const val = history[metric as keyof PlayerStats];
  if (typeof val === 'string') return parseFloat(val) || 0;
  if (typeof val === 'number') return val;
  return 0;
}

export function buildChartData(
  playerHistories: Map<number, { name: string; history: PlayerStats[] }>,
  metrics: MetricKey[],
  timeRange: TimeRange,
  aggregation: Aggregation,
): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];

  // Determine GW range
  let maxGWs = 0;
  playerHistories.forEach(({ history }) => {
    maxGWs = Math.max(maxGWs, history.length);
  });

  let startIdx = 0;
  if (timeRange === 'last5') startIdx = Math.max(0, maxGWs - 5);
  if (timeRange === 'last10') startIdx = Math.max(0, maxGWs - 10);

  for (let i = startIdx; i < maxGWs; i++) {
    const point: ChartDataPoint = { gameweek: i + 1 };

    playerHistories.forEach(({ name, history }, playerId) => {
      const gw = history[i];
      if (!gw) return;

      for (const metric of metrics) {
        const key = `${name}_${metric}`;
        let value = extractMetric(gw, metric);

        if (aggregation === 'cumulative') {
          // Sum all GWs up to this point
          value = 0;
          for (let j = 0; j <= i; j++) {
            if (history[j]) value += extractMetric(history[j], metric);
          }
        }

        point[key] = Math.round(value * 100) / 100;
      }
    });

    data.push(point);
  }

  return data;
}

export function buildRadarData(
  playerHistories: Map<number, { name: string; history: PlayerStats[] }>,
  metrics: MetricKey[],
): { metric: string; [key: string]: string | number }[] {
  return metrics.map(metric => {
    const point: Record<string, string | number> = {
      metric: METRIC_DEFINITIONS[metric].label,
    };

    // Find max for normalization
    let max = 0;
    playerHistories.forEach(({ history }) => {
      const sum = history.reduce((acc, gw) => acc + extractMetric(gw, metric), 0);
      max = Math.max(max, sum);
    });

    playerHistories.forEach(({ name, history }) => {
      const sum = history.reduce((acc, gw) => acc + extractMetric(gw, metric), 0);
      point[name] = max > 0 ? Math.round((sum / max) * 100) : 0;
    });

    return point;
  });
}

export const PLAYER_COLORS = [
  "#00ff87", "#04f5ff", "#ff04a1", "#ffd700",
  "#8b5cf6", "#f97316", "#22c55e", "#ef4444",
];
