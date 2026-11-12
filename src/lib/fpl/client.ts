import type { Bootstrap, Fixture, PlayerSummary } from "./types";

/**
 * The FPL API sends no CORS headers, so the browser can't call it directly.
 * Two transports, tried in order and remembered once one works:
 *   1. "local": same-origin `/fpl-api/*` (Vite dev/preview proxy, or a host rewrite)
 *   2. "edge":  the Supabase `fpl-api-proxy` edge function
 */
export type Transport = "local" | "edge";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export class FplError extends Error {
  constructor(message: string, public status = 0) {
    super(message);
    this.name = "FplError";
  }
}

// A host known to have no `/fpl-api` rewrite (GitHub Pages) says so at build time, which skips the doomed first attempt
let active: Transport | null = import.meta.env.VITE_FPL_TRANSPORT === "edge" ? "edge" : null;
export const getTransport = () => active;

async function viaLocal(path: string): Promise<unknown> {
  const res = await fetch(`/fpl-api${path}`, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new FplError(`FPL API returned ${res.status}`, res.status);
  // A static host answers unknown paths with index.html; treat that as "no proxy here".
  if (!(res.headers.get("content-type") ?? "").includes("json")) throw new FplError("No local proxy", -1);
  return res.json();
}

async function viaEdge(path: string): Promise<unknown> {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new FplError("Edge proxy is not configured", -1);
  const res = await fetch(`${SUPABASE_URL}/functions/v1/fpl-api-proxy`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    body: JSON.stringify({ endpoint: path }),
  });
  if (!res.ok) throw new FplError(`FPL proxy returned ${res.status}`, res.status);
  return res.json();
}

const transports: Record<Transport, (path: string) => Promise<unknown>> = { local: viaLocal, edge: viaEdge };

/** GET a path of the FPL API, e.g. `/bootstrap-static/`. */
export async function fplGet<T>(path: string, only?: Transport): Promise<T> {
  if (only) return transports[only](path) as Promise<T>;
  if (active) return transports[active](path) as Promise<T>;

  try {
    const data = await viaLocal(path);
    active = "local";
    return data as T;
  } catch (localError) {
    // A real 4xx from FPL (e.g. unknown manager id) is an answer, not a transport failure.
    if (localError instanceof FplError && localError.status >= 400 && localError.status < 500 && localError.status !== 404) {
      throw localError;
    }
    try {
      const data = await viaEdge(path);
      active = "edge";
      return data as T;
    } catch (edgeError) {
      throw edgeError instanceof FplError && edgeError.status !== -1 ? edgeError : localError;
    }
  }
}

/**
 * All fixtures of the season. Older deployments of the edge proxy don't allow
 * `/fixtures/`; in that case rebuild the list from one player summary per club.
 */
export async function getFixtures(bootstrap: Bootstrap): Promise<Fixture[]> {
  try {
    return await fplGet<Fixture[]>("/fixtures/");
  } catch {
    return fixturesFromSummaries(bootstrap);
  }
}

export async function fixturesFromSummaries(bootstrap: Bootstrap): Promise<Fixture[]> {
  const byId = new Map<number, Fixture>();
  await Promise.all(
    bootstrap.teams.map(async (team) => {
      const rep = bootstrap.elements
        .filter((p) => p.team === team.id)
        .sort((a, b) => b.minutes - a.minutes)[0];
      if (!rep) return;
      const summary = await fplGet<PlayerSummary>(`/element-summary/${rep.id}/`);
      for (const h of summary.history) {
        const home = h.was_home ? team.id : h.opponent_team;
        const away = h.was_home ? h.opponent_team : team.id;
        if (!byId.has(h.fixture)) {
          byId.set(h.fixture, {
            id: h.fixture, event: h.round, kickoff_time: h.kickoff_time, started: true, finished: true, minutes: 90,
            team_h: home, team_a: away, team_h_score: h.team_h_score, team_a_score: h.team_a_score,
            team_h_difficulty: 3, team_a_difficulty: 3,
          });
        }
      }
      for (const f of summary.fixtures) {
        const existing = byId.get(f.id) ?? {
          id: f.id, event: f.event, kickoff_time: f.kickoff_time, started: false, finished: false, minutes: 0,
          team_h: f.team_h, team_a: f.team_a, team_h_score: null, team_a_score: null,
          team_h_difficulty: 3, team_a_difficulty: 3,
        };
        if (f.is_home) existing.team_h_difficulty = f.difficulty;
        else existing.team_a_difficulty = f.difficulty;
        byId.set(f.id, existing);
      }
    }),
  );
  return [...byId.values()].sort((a, b) => (a.event ?? 99) - (b.event ?? 99) || a.id - b.id);
}
