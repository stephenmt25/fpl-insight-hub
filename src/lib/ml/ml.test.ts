import { describe, expect, it } from "vitest";
import { kmeans, standardize } from "./kmeans";
import { ewma, forecastForm, slope } from "./form";
import { predictPriceChanges } from "./price";
import { findDifferentials } from "./differentials";
import { rankCaptains } from "./captain";
import type { Player } from "@/lib/fpl/types";

const player = (over: Partial<Player>): Player => ({
  id: 1, code: 1, first_name: "A", second_name: "B", web_name: "B", element_type: 3, team: 1, now_cost: 60,
  cost_change_event: 0, cost_change_start: 0, form: "3.0", total_points: 40, event_points: 3, points_per_game: "4.0",
  selected_by_percent: "5.0", ep_next: "4.0", status: "a", news: "", chance_of_playing_next_round: null, minutes: 800,
  starts: 9, goals_scored: 2, assists: 2, clean_sheets: 3, bonus: 4, bps: 150, influence: "200", creativity: "200",
  threat: "200", ict_index: "60", expected_goals: "2.0", expected_assists: "2.0", expected_goal_involvements: "4.0",
  expected_goals_conceded: "9.0", transfers_in_event: 0, transfers_out_event: 0, penalties_order: null, ...over,
});

describe("kmeans", () => {
  it("separates two obvious groups and is deterministic", () => {
    const pts = [[0, 0], [0.1, 0.2], [0.2, 0], [10, 10], [10.2, 9.9], [9.8, 10.1]];
    const a = kmeans(pts, 2);
    const b = kmeans(pts, 2);
    expect(a.assignments).toEqual(b.assignments);
    expect(new Set(a.assignments.slice(0, 3)).size).toBe(1);
    expect(new Set(a.assignments.slice(3)).size).toBe(1);
    expect(a.assignments[0]).not.toBe(a.assignments[3]);
  });

  it("standardizes columns to zero mean and leaves constant columns at zero", () => {
    const z = standardize([[1, 5], [3, 5], [5, 5]]);
    expect(z.reduce((s, r) => s + r[0], 0)).toBeCloseTo(0);
    expect(z.every((r) => r[1] === 0)).toBe(true);
  });
});

describe("form forecast", () => {
  it("computes slope and ewma", () => {
    expect(slope([1, 2, 3, 4])).toBeCloseTo(1);
    expect(slope([5])).toBe(0);
    expect(ewma([4, 4, 4])).toBeCloseTo(4);
  });

  it("classifies trends and keeps forecasts non-negative", () => {
    expect(forecastForm([1, 2, 4, 6, 8, 10]).trend).toBe("rising");
    const falling = forecastForm([10, 8, 6, 3, 1, 0]);
    expect(falling.trend).toBe("falling");
    expect(falling.forecast.every((f) => f.points >= 0 && f.low >= 0)).toBe(true);
    expect(forecastForm([5, 5, 5, 5, 5, 5]).trend).toBe("stable");
  });

  it("rates easy fixtures above hard ones", () => {
    const h = [4, 5, 4, 6, 5, 5];
    expect(forecastForm(h, [2]).forecast[0].points).toBeGreaterThan(forecastForm(h, [5]).forecast[0].points);
  });
});

describe("price predictions", () => {
  it("flags heavy buying as a rise and heavy selling as a fall", () => {
    const players = [
      player({ id: 1, transfers_in_event: 300_000, transfers_out_event: 5_000, selected_by_percent: "20.0", price_change_percent: 95 }),
      player({ id: 2, transfers_in_event: 1_000, transfers_out_event: 250_000, selected_by_percent: "15.0", price_change_percent: -90 }),
      player({ id: 3, transfers_in_event: 500, transfers_out_event: 400, selected_by_percent: "30.0" }),
    ];
    const { risers, fallers } = predictPriceChanges(players, 10_000_000);
    expect(risers.map((r) => r.player.id)).toEqual([1]);
    expect(fallers.map((r) => r.player.id)).toEqual([2]);
    expect(risers[0].probability).toBeGreaterThan(60);
  });
});

describe("differentials", () => {
  it("only returns low-owned, available players from the top clusters", () => {
    const pool = Array.from({ length: 40 }, (_, i) =>
      player({
        id: i + 1,
        form: String(1 + (i % 10)),
        points_per_game: String(2 + (i % 8)),
        total_points: 20 + i * 3,
        selected_by_percent: String(i % 2 === 0 ? 3 : 40),
        ep_next: String(1 + (i % 9)),
      }),
    );
    const { picks, clusters } = findDifferentials(pool);
    expect(clusters[0].meanScore).toBeGreaterThan(clusters[clusters.length - 1].meanScore);
    expect(picks.length).toBeGreaterThan(0);
    expect(picks.every((p) => p.ownership <= 10 && p.cluster <= 1)).toBe(true);
  });
});

describe("captain ranking", () => {
  it("prefers the better fixture and penalises doubts and blanks", () => {
    const a = player({ id: 1, team: 1, ep_next: "6.0", form: "6.0" });
    const b = player({ id: 2, team: 2, ep_next: "6.0", form: "6.0" });
    const c = player({ id: 3, team: 3, ep_next: "9.0", form: "9.0" });
    const fixtures = new Map([
      [1, [{ event: 5, opponent: 9, home: true, difficulty: 2 }]],
      [2, [{ event: 5, opponent: 8, home: false, difficulty: 5 }]],
    ]);
    const ranked = rankCaptains([b, c, a], fixtures);
    expect(ranked.map((r) => r.player.id)).toEqual([1, 2, 3]);
    expect(ranked[2].score).toBe(0);
  });
});
