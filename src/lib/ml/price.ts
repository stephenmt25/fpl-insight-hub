import type { Player } from "@/lib/fpl/types";
import { num } from "@/lib/fpl/format";

export interface PricePrediction {
  player: Player;
  direction: "rise" | "fall";
  /** 0-100 estimate that the price moves at the next daily update. */
  probability: number;
  /** Net transfers this gameweek (in − out). */
  netTransfers: number;
  /** Net transfers as a share of current owners. */
  pressure: number;
  /** Progress to the change threshold as published by FPL (−100..100), when available. */
  progress: number | null;
  confidence: "high" | "medium" | "low";
  reasons: string[];
}

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

/**
 * Price moves are driven by net transfers relative to ownership. Where FPL
 * publishes its own progress-to-threshold figure we lean on it; the transfer
 * pressure term covers players without one and breaks ties.
 */
export function predictPriceChanges(players: Player[], totalManagers: number, limit = 15) {
  const predictions: PricePrediction[] = [];

  for (const player of players) {
    const net = player.transfers_in_event - player.transfers_out_event;
    if (net === 0 || player.status === "u") continue;
    const owners = Math.max((num(player.selected_by_percent) / 100) * totalManagers, totalManagers * 0.002);
    const pressure = net / owners;
    const direction = net > 0 ? "rise" : "fall";
    const sign = net > 0 ? 1 : -1;

    // The API sends this as a number or a numeric string depending on the season
    const pct = player.price_change_percent;
    const progress = pct == null || pct === "" || !Number.isFinite(Number(pct)) ? null : Number(pct);
    const projected = num(player.price_change_projections?.[0]?.projected_percent);

    // Pressure alone: ~50% at 6% of owners moving, saturating by ~15%.
    const fromPressure = sigmoid((Math.abs(pressure) - 0.06) * 45);
    // Published progress: 100% means the threshold is met.
    const aligned = progress != null && Math.sign(progress) === sign;
    const fromProgress = aligned ? sigmoid((Math.max(Math.abs(progress!), Math.abs(projected)) - 82) / 9) : null;

    const p = fromProgress != null ? 0.75 * fromProgress + 0.25 * fromPressure : fromPressure * 0.85;
    const probability = Math.round(Math.min(0.99, Math.max(0.01, p)) * 100);
    if (probability < 8) continue;

    const reasons: string[] = [];
    if (aligned) reasons.push(`${Math.abs(progress!).toFixed(0)}% of the way to a price ${direction}`);
    reasons.push(`${Math.abs(net).toLocaleString("en-GB")} net transfers ${net > 0 ? "in" : "out"} this gameweek`);
    reasons.push(`${(Math.abs(pressure) * 100).toFixed(1)}% of owners ${net > 0 ? "added" : "sold"}`);
    if (player.cost_change_event !== 0) reasons.push(`Already moved ${player.cost_change_event > 0 ? "+" : "−"}£${Math.abs(player.cost_change_event / 10).toFixed(1)}m this gameweek`);
    if (direction === "fall" && player.status !== "a") reasons.push("Flagged: injured, suspended or doubtful");

    predictions.push({
      player, direction, probability, netTransfers: net, pressure, progress: aligned ? progress : null,
      confidence: probability >= 70 ? "high" : probability >= 40 ? "medium" : "low",
      reasons,
    });
  }

  const top = (d: "rise" | "fall") =>
    predictions.filter((p) => p.direction === d).sort((a, b) => b.probability - a.probability || Math.abs(b.netTransfers) - Math.abs(a.netTransfers)).slice(0, limit);
  return { risers: top("rise"), fallers: top("fall") };
}
