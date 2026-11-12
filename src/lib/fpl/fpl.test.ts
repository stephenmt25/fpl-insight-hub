import { describe, expect, it } from "vitest";
import { leagueTable, runDifficulty, upcomingByTeam } from "./fixtures";
import { chipLabel, countdown, num, per90, positionLabel, price, signed } from "./format";
import type { Fixture } from "./types";

const fx = (id: number, event: number, h: number, a: number, hs: number | null, as: number | null, hd = 3, ad = 3): Fixture => ({
  id, event, kickoff_time: `2026-08-${10 + id}T14:00:00Z`, started: hs != null, finished: hs != null, minutes: hs != null ? 90 : 0,
  team_h: h, team_a: a, team_h_score: hs, team_a_score: as, team_h_difficulty: hd, team_a_difficulty: ad,
});

describe("leagueTable", () => {
  const fixtures = [fx(1, 1, 1, 2, 3, 0), fx(2, 1, 3, 1, 1, 1), fx(3, 2, 2, 3, 2, 1), fx(4, 3, 1, 3, null, null)];
  const table = leagueTable(fixtures, [1, 2, 3]);

  it("awards points and sorts by points then goal difference", () => {
    expect(table.map((r) => r.team)).toEqual([1, 2, 3]);
    expect(table[0]).toMatchObject({ played: 2, won: 1, drawn: 1, points: 4, gd: 3 });
    expect(table[1]).toMatchObject({ points: 3, gd: -2 });
  });

  it("ignores unfinished fixtures and tracks form oldest-first", () => {
    expect(table.reduce((s, r) => s + r.played, 0)).toBe(6);
    expect(table[1].form).toEqual(["L", "W"]);
  });
});

describe("upcomingByTeam", () => {
  const fixtures = [fx(1, 5, 1, 2, null, null, 2, 4), fx(2, 6, 3, 1, null, null, 3, 5), fx(3, 6, 1, 2, null, null, 2, 4)];
  const run = upcomingByTeam(fixtures, [1, 2, 3], 5, 3);

  it("slots fixtures by gameweek, including doubles and blanks", () => {
    expect(run.get(1)![0]).toEqual([{ event: 5, opponent: 2, home: true, difficulty: 2 }]);
    expect(run.get(1)![1]).toHaveLength(2);
    expect(run.get(3)![0]).toHaveLength(0);
  });

  it("scores blank gameweeks as hard", () => {
    expect(runDifficulty(run.get(3)!)).toBeGreaterThan(runDifficulty(run.get(1)!));
  });
});

describe("format", () => {
  it("formats FPL values", () => {
    expect(price(105)).toBe("£10.5m");
    expect(num("4.50")).toBe(4.5);
    expect(num(null)).toBe(0);
    expect(per90(3, 270)).toBe(1);
    expect(per90(3, 0)).toBe(0);
    expect(positionLabel(4)).toBe("FWD");
    expect(chipLabel("3xc")).toBe("Triple Captain");
    expect(signed(2)).toBe("+2");
    expect(signed(0)).toBe("0");
  });

  it("counts down to a deadline", () => {
    const now = Date.parse("2026-11-20T11:00:00Z");
    expect(countdown("2026-11-21T12:30:10Z", now)).toMatchObject({ days: 1, hours: 1, minutes: 30, seconds: 10, done: false });
    expect(countdown("2026-11-19T12:00:00Z", now).done).toBe(true);
  });
});
