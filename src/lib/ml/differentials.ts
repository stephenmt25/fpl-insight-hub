import type { Player } from "@/lib/fpl/types";
import { num, per90 } from "@/lib/fpl/format";
import { kmeans, standardize } from "./kmeans";

export const FEATURES = ["Form", "Pts/game", "xGI/90", "ICT/90", "Value", "xPts next"] as const;

export interface ClusteredPlayer {
  player: Player;
  cluster: number;
  /** Raw feature values, same order as FEATURES. */
  features: number[];
  /** Mean z-score across features: how far above the average regular this player sits. */
  score: number;
  ownership: number;
}

export interface ClusterSummary {
  id: number;
  label: string;
  size: number;
  meanScore: number;
  meanOwnership: number;
}

export interface DifferentialPick extends ClusteredPlayer {
  /** 0-100, rank of `score` among all clustered players. */
  confidence: number;
  reasons: string[];
}

const LABELS = ["Elite", "Strong", "Rotation", "Fringe", "Avoid"];

function featuresOf(p: Player): number[] {
  return [
    num(p.form),
    num(p.points_per_game),
    per90(num(p.expected_goal_involvements), p.minutes),
    per90(num(p.ict_index), p.minutes),
    p.now_cost > 0 ? p.total_points / (p.now_cost / 10) : 0,
    num(p.ep_next),
  ];
}

/**
 * Clusters regular starters on six performance features, ranks the clusters,
 * and surfaces low-owned players from the best ones.
 */
export function findDifferentials(
  players: Player[],
  { maxOwnership = 10, minMinutes = 270, k = 4, limit = 8 } = {},
): { picks: DifferentialPick[]; clusters: ClusterSummary[]; clustered: ClusteredPlayer[] } {
  const pool = players.filter((p) => p.minutes >= minMinutes && p.status !== "u");
  if (pool.length < k) return { picks: [], clusters: [], clustered: [] };

  const raw = pool.map(featuresOf);
  const z = standardize(raw);
  const { assignments } = kmeans(z, k);

  const scores = z.map((row) => row.reduce((s, v) => s + v, 0) / row.length);

  // Order clusters best-first so cluster 0 is always "Elite"
  const ids = [...new Set(assignments)];
  const mean = (id: number) => {
    const idx = assignments.map((a, i) => (a === id ? i : -1)).filter((i) => i >= 0);
    return idx.reduce((s, i) => s + scores[i], 0) / idx.length;
  };
  const order = ids.sort((a, b) => mean(b) - mean(a));
  const rank = new Map(order.map((id, i) => [id, i]));

  const clustered: ClusteredPlayer[] = pool.map((player, i) => ({
    player,
    cluster: rank.get(assignments[i])!,
    features: raw[i],
    score: scores[i],
    ownership: num(player.selected_by_percent),
  }));

  const clusters: ClusterSummary[] = order.map((_, i) => {
    const members = clustered.filter((c) => c.cluster === i);
    return {
      id: i,
      label: LABELS[i] ?? `Cluster ${i + 1}`,
      size: members.length,
      meanScore: members.reduce((s, m) => s + m.score, 0) / members.length,
      meanOwnership: members.reduce((s, m) => s + m.ownership, 0) / members.length,
    };
  });

  const sortedScores = [...scores].sort((a, b) => a - b);
  const percentile = (s: number) => Math.round((sortedScores.filter((v) => v <= s).length / sortedScores.length) * 100);
  const medians = FEATURES.map((_, d) => [...raw.map((r) => r[d])].sort((a, b) => a - b)[Math.floor(raw.length / 2)]);

  const picks = clustered
    .filter((c) => c.cluster <= 1 && c.ownership <= maxOwnership && c.player.status === "a")
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((c) => {
      const strengths = c.features
        .map((v, d) => ({ name: FEATURES[d], ratio: medians[d] > 0 ? v / medians[d] : 0 }))
        .filter((s) => s.ratio > 1.15)
        .sort((a, b) => b.ratio - a.ratio)
        // FPL's expected points track form closely, so don't cite both
        .filter((s, _, all) => !(s.name === "xPts next" && all.some((o) => o.name === "Form")))
        .slice(0, 2);
      return {
        ...c,
        confidence: percentile(c.score),
        reasons: [
          `${clusters[c.cluster].label} cluster, owned by only ${c.ownership.toFixed(1)}%`,
          ...strengths.map((s) => `${s.name} is ${s.ratio.toFixed(1)}× the median regular`),
        ],
      };
    });

  return { picks, clusters, clustered };
}
