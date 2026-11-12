import { useMemo } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { fplGet, getFixtures } from "./client";
import type {
  Bootstrap, DreamTeam, Entry, EntryHistory, EntryPicks, EventLive, EventStatus, Fixture,
  FplEvent, LeagueStandings, Player, PlayerSummary, Team, Transfer,
} from "./types";

const MIN = 60_000;

export function useBootstrap() {
  return useQuery({
    queryKey: ["bootstrap"],
    queryFn: () => fplGet<Bootstrap>("/bootstrap-static/"),
    staleTime: 5 * MIN,
  });
}

export interface Fpl {
  bootstrap: Bootstrap;
  players: Player[];
  teams: Team[];
  events: FplEvent[];
  playerById: Map<number, Player>;
  teamById: Map<number, Team>;
  /** The gameweek in play (or most recently played); null before the season starts. */
  current: FplEvent | null;
  next: FplEvent | null;
  /** current?.id, falling back to 1 pre-season. */
  gw: number;
}

/** Bootstrap data plus the lookups every screen needs. */
export function useFpl() {
  const query = useBootstrap();
  const fpl = useMemo<Fpl | null>(() => {
    const b = query.data;
    if (!b) return null;
    const current = b.events.find((e) => e.is_current) ?? null;
    const next = b.events.find((e) => e.is_next) ?? null;
    return {
      bootstrap: b,
      players: b.elements,
      teams: b.teams,
      events: b.events,
      playerById: new Map(b.elements.map((p) => [p.id, p])),
      teamById: new Map(b.teams.map((t) => [t.id, t])),
      current,
      next,
      gw: current?.id ?? 1,
    };
  }, [query.data]);
  return { fpl, isLoading: query.isLoading, error: query.error, refetch: query.refetch };
}

export function useFixtures() {
  const { data: bootstrap } = useBootstrap();
  return useQuery({
    queryKey: ["fixtures"],
    queryFn: () => getFixtures(bootstrap!),
    enabled: !!bootstrap,
    staleTime: 5 * MIN,
  });
}

export function useEventLive(gw: number | null | undefined) {
  return useQuery({
    queryKey: ["live", gw],
    queryFn: () => fplGet<EventLive>(`/event/${gw}/live/`),
    enabled: !!gw,
    staleTime: MIN,
    select: (d) => new Map(d.elements.map((e) => [e.id, e.stats])),
  });
}

export function useDreamTeam(gw: number | null | undefined, enabled = true) {
  return useQuery({
    queryKey: ["dream-team", gw],
    queryFn: () => fplGet<DreamTeam>(`/dream-team/${gw}/`),
    enabled: !!gw && enabled,
    staleTime: 10 * MIN,
    retry: false,
  });
}

export function useEventStatus() {
  return useQuery({ queryKey: ["event-status"], queryFn: () => fplGet<EventStatus>("/event-status/"), staleTime: MIN });
}

export const playerSummaryQuery = (id: number) => ({
  queryKey: ["player-summary", id],
  queryFn: () => fplGet<PlayerSummary>(`/element-summary/${id}/`),
  staleTime: 10 * MIN,
});

export function usePlayerSummary(id: number | null | undefined) {
  return useQuery({ ...playerSummaryQuery(id ?? 0), enabled: !!id });
}

/** Summaries for several players at once; `data[i]` is undefined while loading. */
export function usePlayerSummaries(ids: number[]) {
  return useQueries({
    queries: ids.map((id) => playerSummaryQuery(id)),
    combine: (results) => ({
      data: results.map((r) => r.data),
      isLoading: results.some((r) => r.isLoading),
      loaded: results.filter((r) => r.data).length,
    }),
  });
}

export const fetchEntry = (id: string | number) => fplGet<Entry>(`/entry/${id}/`);

export function useEntry(id: string | number | null | undefined) {
  return useQuery({ queryKey: ["entry", String(id)], queryFn: () => fetchEntry(id!), enabled: !!id, staleTime: 2 * MIN });
}

export const entryHistoryQuery = (id: string | number) => ({
  queryKey: ["entry-history", String(id)],
  queryFn: () => fplGet<EntryHistory>(`/entry/${id}/history/`),
  staleTime: 2 * MIN,
});

export function useEntryHistory(id: string | number | null | undefined) {
  return useQuery({ ...entryHistoryQuery(id ?? 0), enabled: !!id });
}

export function useEntryHistories(ids: number[]) {
  return useQueries({
    queries: ids.map((id) => entryHistoryQuery(id)),
    combine: (results) => ({ data: results.map((r) => r.data), isLoading: results.some((r) => r.isLoading) }),
  });
}

export function useEntryPicks(id: string | number | null | undefined, gw: number | null | undefined) {
  return useQuery({
    queryKey: ["entry-picks", String(id), gw],
    queryFn: () => fplGet<EntryPicks>(`/entry/${id}/event/${gw}/picks/`),
    enabled: !!id && !!gw,
    staleTime: MIN,
    retry: false,
  });
}

export function useEntryTransfers(id: string | number | null | undefined) {
  return useQuery({
    queryKey: ["entry-transfers", String(id)],
    queryFn: () => fplGet<Transfer[]>(`/entry/${id}/transfers/`),
    enabled: !!id,
    staleTime: 2 * MIN,
  });
}

export function useLeagueStandings(leagueId: number | null, page = 1) {
  return useQuery({
    queryKey: ["league", leagueId, page],
    queryFn: () => fplGet<LeagueStandings>(`/leagues-classic/${leagueId}/standings/?page_standings=${page}`),
    enabled: !!leagueId,
    staleTime: 2 * MIN,
    retry: false,
    placeholderData: (prev) => (prev && prev.league.id === leagueId ? prev : undefined),
  });
}

export type { Fixture };
