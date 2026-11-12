import type { Fixture } from "./types";

export interface TableRow {
  team: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
  /** Most recent result last, e.g. ["W","D","L"]. */
  form: ("W" | "D" | "L")[];
}

/** Premier League table computed from finished fixtures (the API's own team stats are empty). */
export function leagueTable(fixtures: Fixture[], teamIds: number[]): TableRow[] {
  const rows = new Map<number, TableRow>(
    teamIds.map((team) => [team, { team, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0, form: [] }]),
  );
  const finished = fixtures
    .filter((f) => f.finished && f.team_h_score != null && f.team_a_score != null)
    .sort((a, b) => (a.kickoff_time ?? "").localeCompare(b.kickoff_time ?? ""));

  for (const f of finished) {
    const sides: [number, number, number][] = [
      [f.team_h, f.team_h_score!, f.team_a_score!],
      [f.team_a, f.team_a_score!, f.team_h_score!],
    ];
    for (const [team, scored, conceded] of sides) {
      const row = rows.get(team);
      if (!row) continue;
      row.played++;
      row.gf += scored;
      row.ga += conceded;
      if (scored > conceded) { row.won++; row.points += 3; row.form.push("W"); }
      else if (scored === conceded) { row.drawn++; row.points += 1; row.form.push("D"); }
      else { row.lost++; row.form.push("L"); }
    }
  }
  return [...rows.values()]
    .map((r) => ({ ...r, gd: r.gf - r.ga, form: r.form.slice(-5) }))
    .sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf || a.team - b.team);
}

export interface TeamFixture {
  event: number;
  opponent: number;
  home: boolean;
  difficulty: number;
}

/** Each team's fixtures for gameweeks [fromGw, fromGw + count). A gameweek may hold 0 (blank) or 2 (double). */
export function upcomingByTeam(fixtures: Fixture[], teamIds: number[], fromGw: number, count: number) {
  const out = new Map<number, TeamFixture[][]>(teamIds.map((id) => [id, Array.from({ length: count }, () => [])]));
  for (const f of fixtures) {
    if (f.event == null || f.event < fromGw || f.event >= fromGw + count) continue;
    const slot = f.event - fromGw;
    out.get(f.team_h)?.[slot].push({ event: f.event, opponent: f.team_a, home: true, difficulty: f.team_h_difficulty });
    out.get(f.team_a)?.[slot].push({ event: f.event, opponent: f.team_h, home: false, difficulty: f.team_a_difficulty });
  }
  return out;
}

/** Mean difficulty over a run; blanks count as the hardest fixture (5). */
export function runDifficulty(run: TeamFixture[][]) {
  if (run.length === 0) return 3;
  const total = run.reduce((sum, gw) => sum + (gw.length === 0 ? 5 : gw.reduce((s, f) => s + f.difficulty, 0) / gw.length / Math.sqrt(gw.length)), 0);
  return total / run.length;
}
