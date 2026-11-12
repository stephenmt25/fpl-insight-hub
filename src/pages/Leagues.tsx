import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Empty, ErrorBlock, LoadingBlock, RankDelta, Section, Stat } from "@/components/shared/bits";
import { AXIS, ChartFrame, ChartTooltip, GRID, Legend, REFERENCE, SERIES } from "@/components/shared/charts";
import { useAuth } from "@/lib/auth";
import { int, signed } from "@/lib/fpl/format";
import { useEntryHistories, useLeagueStandings } from "@/lib/fpl/hooks";
import type { StandingRow } from "@/lib/fpl/types";
import { cn } from "@/lib/utils";

const OVERALL = 314;

function Standings({ rows, me, page, hasNext, onPage, busy }: {
  rows: StandingRow[]; me: number | null; page: number; hasNext: boolean; onPage: (p: number) => void; busy: boolean;
}) {
  return (
    <div className={cn("panel overflow-x-auto transition-opacity", busy && "opacity-60")}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground">
            <th className="p-3 text-left font-normal">Rank</th>
            <th className="p-3 text-left font-normal">Team &amp; manager</th>
            <th className="p-3 text-right font-normal">GW</th>
            <th className="p-3 text-right font-normal">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {rows.map((r) => (
            <tr key={r.entry} className={cn("hover:bg-accent/40", r.entry === me && "bg-blood/10")}>
              <td className="p-3">
                <span className={cn("num mr-2 font-semibold", r.rank <= 3 && "text-blood")}>{int(r.rank)}</span>
                <RankDelta rank={r.rank} last={r.last_rank} />
              </td>
              <td className="p-3">
                <p className="font-medium">{r.entry_name}{r.entry === me && <span className="eyebrow ml-2 text-blood">you</span>}</p>
                <p className="text-xs text-muted-foreground">{r.player_name}</p>
              </td>
              <td className="num p-3 text-right text-muted-foreground">{r.event_total}</td>
              <td className="num p-3 text-right font-semibold">{int(r.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <Empty>This league has no ranked teams yet.</Empty>}
      <div className="flex items-center justify-between border-t border-border p-3">
        <Button variant="outline" size="sm" disabled={page <= 1 || busy} onClick={() => onPage(page - 1)}>Previous</Button>
        <span className="num text-xs text-muted-foreground">Page {page}</span>
        <Button variant="outline" size="sm" disabled={!hasNext || busy} onClick={() => onPage(page + 1)}>Next</Button>
      </div>
    </div>
  );
}

function PageInsights({ rows, me }: { rows: StandingRow[]; me: number | null }) {
  if (rows.length === 0) return <Empty>Nothing to analyse yet.</Empty>;
  const mean = (xs: number[]) => xs.reduce((s, v) => s + v, 0) / xs.length;
  const avgGw = mean(rows.map((r) => r.event_total));
  const topGw = rows.reduce((a, b) => (b.event_total > a.event_total ? b : a));
  const climber = rows.filter((r) => r.last_rank > 0).reduce<StandingRow | null>((a, b) => (!a || b.last_rank - b.rank > a.last_rank - a.rank ? b : a), null);
  const gap = rows[0].total - rows[rows.length - 1].total;
  const bars = [...rows].sort((a, b) => b.event_total - a.event_total).slice(0, 20).map((r) => ({ name: r.entry_name, points: r.event_total, entry: r.entry }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Average this gameweek" value={avgGw.toFixed(1)} hint={`across ${rows.length} teams shown`} />
        <Stat label="Top gameweek score" value={topGw.event_total} hint={topGw.entry_name} tone="blood" />
        <Stat label="Biggest climber" value={climber && climber.last_rank > climber.rank ? `▲ ${int(climber.last_rank - climber.rank)}` : "–"} hint={climber && climber.last_rank > climber.rank ? climber.entry_name : "no movement"} tone="good" />
        <Stat label="Spread" value={`${int(gap)} pts`} hint={`rank ${int(rows[0].rank)} to ${int(rows[rows.length - 1].rank)}`} />
      </div>
      <Section eyebrow="Teams on this page" title="Gameweek Scores">
        <ChartFrame height={Math.max(220, bars.length * 24)}>
          <BarChart data={bars} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
            <CartesianGrid stroke={GRID} horizontal={false} />
            <XAxis type="number" {...AXIS} />
            <YAxis type="category" dataKey="name" width={130} {...AXIS} axisLine={false} tick={{ ...AXIS.tick, fontSize: 10 }} tickFormatter={(v: string) => (v.length > 18 ? `${v.slice(0, 17)}…` : v)} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(240 8% 14% / 0.6)" }} />
            <ReferenceLine x={avgGw} stroke={REFERENCE} strokeDasharray="4 4" />
            <Bar dataKey="points" name="Gameweek points" maxBarSize={14}>
              {bars.map((b) => <Cell key={b.entry} fill={b.entry === me ? SERIES[0] : "#8d93a3"} />)}
            </Bar>
          </BarChart>
        </ChartFrame>
        <Legend items={[...(me && bars.some((b) => b.entry === me) ? [{ label: "You", color: SERIES[0] }] : []), { label: "Other teams", color: "#8d93a3" }, { label: "Page average", color: REFERENCE, dashed: true }]} />
      </Section>
    </div>
  );
}

function TitleRace({ rows, me, myTeam }: { rows: StandingRow[]; me: number | null; myTeam?: string }) {
  const tracked = useMemo(() => {
    const top = rows.slice(0, 5).map((r) => ({ entry: r.entry, entry_name: r.entry_name }));
    // You are tracked even when you're not on this page of the standings
    return me && !top.some((r) => r.entry === me) ? [...top, { entry: me, entry_name: myTeam ?? "You" }] : top;
  }, [rows, me, myTeam]);
  const histories = useEntryHistories(tracked.map((r) => r.entry));

  const data = useMemo(() => {
    const leader = histories.data[0];
    if (!leader) return [];
    return leader.current.map((lead) => {
      const row: Record<string, number> = { gw: lead.event };
      histories.data.forEach((h, i) => {
        const at = h?.current.find((c) => c.event === lead.event);
        if (at) row[tracked[i].entry] = at.total_points - lead.total_points;
      });
      return row;
    });
  }, [histories.data, tracked]);

  if (tracked.length === 0) return <Empty>No teams to track.</Empty>;
  if (histories.isLoading && data.length === 0) return <LoadingBlock />;

  return (
    <Section eyebrow="Top five on this page, plus you" title="Title Race">
      <p className="mb-3 text-xs text-muted-foreground">
        Points ahead of or behind <span className="text-foreground">{tracked[0].entry_name}</span> (the current leader) after each gameweek. Zero is the leader's line.
      </p>
      <ChartFrame height={340}>
        <LineChart data={data} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="gw" {...AXIS} />
          <YAxis {...AXIS} axisLine={false} />
          <Tooltip content={<ChartTooltip labelPrefix="Gameweek " format={(v) => `${signed(v)} pts`} />} cursor={{ stroke: REFERENCE, strokeDasharray: "3 3" }} />
          <ReferenceLine y={0} stroke={REFERENCE} />
          {tracked.map((r, i) => (
            <Line key={r.entry} dataKey={String(r.entry)} name={r.entry_name} stroke={SERIES[i]} strokeWidth={r.entry === me ? 3 : 2} dot={false} connectNulls activeDot={{ r: 5, stroke: "#08080b", strokeWidth: 2 }} />
          ))}
        </LineChart>
      </ChartFrame>
      <Legend items={tracked.map((r, i) => ({ label: `${r.entry_name}${r.entry === me ? " (you)" : ""}`, color: SERIES[i] }))} />
    </Section>
  );
}

export default function Leagues() {
  const { manager, managerId } = useAuth();
  const [params] = useSearchParams();
  const linked = Number(params.get("id"));
  const [leagueId, setLeagueId] = useState(linked > 0 ? linked : OVERALL);
  const [page, setPage] = useState(1);
  const [custom, setCustom] = useState("");
  useEffect(() => {
    if (linked > 0) { setLeagueId(linked); setPage(1); }
  }, [linked]);
  const { data, isLoading, isFetching, error, refetch } = useLeagueStandings(leagueId, page);
  const me = managerId ? Number(managerId) : null;

  const mine = manager?.leagues.classic ?? [];
  const options = [{ id: OVERALL, name: "Overall" }, ...mine.filter((l) => l.id !== OVERALL).map((l) => ({ id: l.id, name: l.name }))];
  if (!options.some((o) => o.id === leagueId)) options.push({ id: leagueId, name: data?.league.name ?? `League ${leagueId}` });
  const choose = (id: number) => { setLeagueId(id); setPage(1); };
  const myRef = mine.find((l) => l.id === leagueId);
  const rows = data?.standings.results ?? [];

  return (
    <>
      <p className="text-sm text-muted-foreground">
        <span className="text-foreground">{data?.league.name ?? "…"}</span>
        {myRef?.entry_rank ? ` · you are ranked ${int(myRef.entry_rank)}${myRef.rank_count ? ` of ${int(myRef.rank_count)}` : ""}` : ""}
        {!managerId && " · sign in to list your own leagues"}
      </p>

      <div className="panel flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-56 flex-1 space-y-1.5">
          <p className="eyebrow">League</p>
          <Select value={String(leagueId)} onValueChange={(v) => choose(Number(v))}>
            <SelectTrigger aria-label="League"><SelectValue /></SelectTrigger>
            <SelectContent>{options.map((o) => <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <form className="flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); if (/^\d{1,10}$/.test(custom.trim())) { choose(Number(custom.trim())); setCustom(""); } }}>
          <div className="space-y-1.5">
            <label htmlFor="league-id" className="eyebrow block">Open by league ID</label>
            <Input id="league-id" inputMode="numeric" placeholder="e.g. 314" value={custom} onChange={(e) => setCustom(e.target.value)} className="num w-36" />
          </div>
          <Button type="submit" variant="outline" disabled={!/^\d{1,10}$/.test(custom.trim())}>Open</Button>
        </form>
      </div>

      {isLoading ? <LoadingBlock className="h-96" /> : error || !data ? (
        <ErrorBlock message="That league could not be loaded. Check the ID; private head-to-head leagues are not supported." onRetry={() => void refetch()} />
      ) : (
        <Tabs defaultValue="table" className="space-y-5">
          <TabsList>
            <TabsTrigger value="table">Standings</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="race">Title Race</TabsTrigger>
          </TabsList>
          <TabsContent value="table"><Standings rows={rows} me={me} page={page} hasNext={data.standings.has_next} onPage={setPage} busy={isFetching} /></TabsContent>
          <TabsContent value="insights"><PageInsights rows={rows} me={me} /></TabsContent>
          <TabsContent value="race"><TitleRace rows={rows} me={me} myTeam={manager?.name} /></TabsContent>
        </Tabs>
      )}
    </>
  );
}
