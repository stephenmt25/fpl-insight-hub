import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDown, ArrowUp, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Empty, ErrorBlock, FdrChip, LoadingBlock, PositionTag, Section, Stat } from "@/components/shared/bits";
import { AXIS, ChartFrame, ChartTooltip, GRID, Legend, REFERENCE, SERIES } from "@/components/shared/charts";
import { PageHeader } from "@/components/shared/ornaments";
import { fullName, num, per90, positionLabel, price } from "@/lib/fpl/format";
import { useFpl, usePlayerSummaries, usePlayerSummary, type Fpl } from "@/lib/fpl/hooks";
import type { Player, PlayerHistoryRow } from "@/lib/fpl/types";
import { cn } from "@/lib/utils";

interface Column {
  key: string;
  label: string;
  title: string;
  get: (p: Player) => number;
  show: (p: Player) => string;
  hideOnMobile?: boolean;
}

const COLUMNS: Column[] = [
  { key: "price", label: "£", title: "Price", get: (p) => p.now_cost, show: (p) => (p.now_cost / 10).toFixed(1) },
  { key: "points", label: "Pts", title: "Total points", get: (p) => p.total_points, show: (p) => String(p.total_points) },
  { key: "form", label: "Form", title: "Average points over the last 30 days", get: (p) => num(p.form), show: (p) => p.form },
  { key: "ppg", label: "PPG", title: "Points per game", get: (p) => num(p.points_per_game), show: (p) => p.points_per_game, hideOnMobile: true },
  { key: "own", label: "Own%", title: "Selected by", get: (p) => num(p.selected_by_percent), show: (p) => p.selected_by_percent },
  { key: "xgi", label: "xGI", title: "Expected goal involvements", get: (p) => num(p.expected_goal_involvements), show: (p) => num(p.expected_goal_involvements).toFixed(1), hideOnMobile: true },
  { key: "ict", label: "ICT", title: "Influence, creativity, threat index", get: (p) => num(p.ict_index), show: (p) => num(p.ict_index).toFixed(0), hideOnMobile: true },
  { key: "value", label: "Val", title: "Points per £1m", get: (p) => (p.now_cost ? p.total_points / (p.now_cost / 10) : 0), show: (p) => (p.now_cost ? (p.total_points / (p.now_cost / 10)).toFixed(1) : "0"), hideOnMobile: true },
  { key: "xp", label: "xPts", title: "FPL expected points next gameweek", get: (p) => num(p.ep_next), show: (p) => num(p.ep_next).toFixed(1) },
];

const PAGE = 25;
const MAX_COMPARE = 4;

function PlayerDialog({ player, fpl, onClose }: { player: Player | null; fpl: Fpl; onClose: () => void }) {
  const { data, isLoading } = usePlayerSummary(player?.id);
  const rows = (data?.history ?? []).map((h) => ({ gw: h.round, points: h.total_points, minutes: h.minutes }));
  return (
    <Dialog open={!!player} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto border-border bg-popover">
        {player && (
          <>
            <DialogHeader>
              <DialogTitle className="h-gothic chrome-text text-3xl">{fullName(player)}</DialogTitle>
              <DialogDescription>
                {fpl.teamById.get(player.team)?.name} · {positionLabel(player.element_type)} · {price(player.now_cost)}
                {player.news && <span className="mt-1 block text-warn">{player.news}</span>}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-4 gap-2">
              <Stat label="Points" value={player.total_points} />
              <Stat label="Form" value={player.form} />
              <Stat label="Goals" value={player.goals_scored} hint={`xG ${num(player.expected_goals).toFixed(1)}`} />
              <Stat label="Assists" value={player.assists} hint={`xA ${num(player.expected_assists).toFixed(1)}`} />
            </div>
            <div>
              <p className="eyebrow mb-2">Points by gameweek</p>
              {isLoading ? <LoadingBlock className="h-40" /> : rows.length === 0 ? <Empty>No matches played yet.</Empty> : (
                <ChartFrame height={170}>
                  <BarChart data={rows} margin={{ top: 4, right: 4, left: -26, bottom: 0 }}>
                    <CartesianGrid stroke={GRID} vertical={false} />
                    <XAxis dataKey="gw" {...AXIS} />
                    <YAxis {...AXIS} axisLine={false} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip labelPrefix="Gameweek " />} cursor={{ fill: "hsl(240 8% 14% / 0.6)" }} />
                    <Bar dataKey="points" name="Points" maxBarSize={22}>
                      {rows.map((r, i) => <Cell key={i} fill={r.minutes === 0 ? "hsl(232 9% 24%)" : SERIES[0]} />)}
                    </Bar>
                  </BarChart>
                </ChartFrame>
              )}
            </div>
            <div>
              <p className="eyebrow mb-2">Next fixtures</p>
              <div className="flex flex-wrap gap-1.5">
                {(data?.fixtures ?? []).slice(0, 6).map((f) => (
                  <FdrChip key={f.id} difficulty={f.difficulty} label={`GW${f.event ?? "?"} ${fpl.teamById.get(f.is_home ? f.team_a : f.team_h)?.short_name} ${f.is_home ? "H" : "A"}`} />
                ))}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

const RADAR_AXES: { label: string; get: (p: Player) => number }[] = [
  { label: "Form", get: (p) => num(p.form) },
  { label: "Pts/game", get: (p) => num(p.points_per_game) },
  { label: "xGI/90", get: (p) => per90(num(p.expected_goal_involvements), p.minutes) },
  { label: "ICT", get: (p) => num(p.ict_index) },
  { label: "Value", get: (p) => (p.now_cost ? p.total_points / (p.now_cost / 10) : 0) },
  { label: "xPts", get: (p) => num(p.ep_next) },
];

function Compare({ players, fpl, onRemove, onClear }: { players: Player[]; fpl: Fpl; onRemove: (id: number) => void; onClear: () => void }) {
  // Each axis is scaled to the best player in the whole game, so shapes are comparable across selections
  const maxima = useMemo(() => RADAR_AXES.map((a) => Math.max(...fpl.players.filter((p) => p.minutes >= 180).map(a.get), 0.001)), [fpl]);
  const data = RADAR_AXES.map((axis, i) => ({
    axis: axis.label,
    ...Object.fromEntries(players.map((p) => [p.id, Math.min(100, Math.round((axis.get(p) / maxima[i]) * 100))])),
  }));

  return (
    <Section eyebrow={`${players.length} of ${MAX_COMPARE} selected`} title="Head to Head" action={<Button variant="ghost" size="sm" onClick={onClear}>Clear</Button>}>
      <div className="grid items-center gap-4 lg:grid-cols-2">
        <div>
          <ChartFrame height={300}>
            <RadarChart data={data} outerRadius="72%">
              <PolarGrid stroke={GRID} />
              <PolarAngleAxis dataKey="axis" tick={{ fill: "hsl(226 9% 62%)", fontSize: 11, fontFamily: "JetBrains Mono, monospace" }} />
              <Tooltip content={<ChartTooltip format={(v) => `${v} / 100`} />} />
              {players.map((p, i) => (
                <Radar key={p.id} dataKey={String(p.id)} name={p.web_name} stroke={SERIES[i]} strokeWidth={2} fill={SERIES[i]} fillOpacity={0.12} />
              ))}
            </RadarChart>
          </ChartFrame>
          <p className="text-center text-xs text-muted-foreground">Each axis: 100 = the best regular in the game.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th />
                {players.map((p, i) => (
                  <th key={p.id} className="px-2 pb-2 text-right font-semibold">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2 w-2" style={{ background: SERIES[i] }} />
                      {p.web_name}
                      <button onClick={() => onRemove(p.id)} aria-label={`Remove ${p.web_name}`} className="text-muted-foreground hover:text-blood"><X className="h-3 w-3" /></button>
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {COLUMNS.map((col) => {
                const best = Math.max(...players.map(col.get));
                return (
                  <tr key={col.key}>
                    <td className="py-1.5 text-xs text-muted-foreground">{col.title}</td>
                    {players.map((p) => (
                      <td key={p.id} className={cn("num px-2 py-1.5 text-right", players.length > 1 && col.get(p) === best && !["price", "own"].includes(col.key) && "font-semibold text-good")}>{col.show(p)}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Section>
  );
}

function Explorer({ fpl }: { fpl: Fpl }) {
  const [search, setSearch] = useState("");
  const [positions, setPositions] = useState<number[]>([]);
  const [team, setTeam] = useState("all");
  const prices = useMemo(() => fpl.players.map((p) => p.now_cost / 10), [fpl]);
  const priceMax = Math.ceil(Math.max(...prices));
  const priceMin = Math.floor(Math.min(...prices));
  const [maxPrice, setMaxPrice] = useState(priceMax);
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 }>({ key: "points", dir: -1 });
  const [page, setPage] = useState(0);
  const [compare, setCompare] = useState<number[]>([]);
  const [detail, setDetail] = useState<Player | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const col = COLUMNS.find((c) => c.key === sort.key)!;
    return fpl.players
      .filter((p) =>
        (positions.length === 0 || positions.includes(p.element_type)) &&
        (team === "all" || p.team === Number(team)) &&
        p.now_cost / 10 <= maxPrice &&
        (!q || p.web_name.toLowerCase().includes(q) || fullName(p).toLowerCase().includes(q)))
      .sort((a, b) => (col.get(a) - col.get(b)) * sort.dir || b.total_points - a.total_points);
  }, [fpl, search, positions, team, maxPrice, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const current = Math.min(page, pages - 1);
  const rows = filtered.slice(current * PAGE, current * PAGE + PAGE);
  const reset = <T,>(fn: (v: T) => void) => (v: T) => { fn(v); setPage(0); };
  const toggleCompare = (id: number) =>
    setCompare((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length < MAX_COMPARE ? [...c, id] : c));
  const comparePlayers = compare.map((id) => fpl.playerById.get(id)).filter(Boolean) as Player[];

  return (
    <div className="space-y-5">
      <div className="panel flex flex-wrap items-end gap-4 p-4">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Search players" placeholder="Search players" value={search} onChange={(e) => reset(setSearch)(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1" role="group" aria-label="Position">
          {[1, 2, 3, 4].map((type) => (
            <Button key={type} size="sm" variant={positions.includes(type) ? "default" : "outline"} aria-pressed={positions.includes(type)}
              onClick={() => reset(setPositions)(positions.includes(type) ? positions.filter((x) => x !== type) : [...positions, type])}>
              {positionLabel(type)}
            </Button>
          ))}
        </div>
        <Select value={team} onValueChange={reset(setTeam)}>
          <SelectTrigger className="w-44" aria-label="Team"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All teams</SelectItem>
            {fpl.teams.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="w-44 space-y-2">
          <p className="eyebrow">Max price <span className="num text-foreground">£{maxPrice.toFixed(1)}m</span></p>
          <Slider aria-label="Maximum price" min={priceMin} max={priceMax} step={0.5} value={[maxPrice]} onValueChange={([v]) => reset(setMaxPrice)(v)} />
        </div>
        <p className="num text-xs text-muted-foreground">{filtered.length} players</p>
      </div>

      {comparePlayers.length > 0 && <Compare players={comparePlayers} fpl={fpl} onRemove={toggleCompare} onClear={() => setCompare([])} />}

      <div className="panel overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="w-8 p-2"><span className="sr-only">Compare</span></th>
              <th className="p-2 text-left font-mono text-[10px] font-normal uppercase tracking-widest text-muted-foreground">Player</th>
              {COLUMNS.map((col) => (
                <th key={col.key} className={cn("p-2 text-right", col.hideOnMobile && "hidden md:table-cell")} aria-sort={sort.key === col.key ? (sort.dir === -1 ? "descending" : "ascending") : "none"}>
                  <button title={col.title} onClick={() => reset(setSort)({ key: col.key, dir: sort.key === col.key ? (sort.dir === -1 ? 1 : -1) : -1 })}
                    className={cn("inline-flex items-center gap-0.5 font-mono text-[10px] uppercase tracking-widest hover:text-foreground", sort.key === col.key ? "text-blood" : "text-muted-foreground")}>
                    {col.label}
                    {sort.key === col.key && (sort.dir === -1 ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />)}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {rows.map((p) => (
              <tr key={p.id} className="hover:bg-accent/40">
                <td className="p-2 text-center">
                  <input type="checkbox" className="h-3.5 w-3.5 accent-[#e11d48]" aria-label={`Compare ${p.web_name}`} checked={compare.includes(p.id)}
                    disabled={!compare.includes(p.id) && compare.length >= MAX_COMPARE} onChange={() => toggleCompare(p.id)} />
                </td>
                <td className="p-2">
                  <button className="flex items-center gap-2 text-left hover:text-blood" onClick={() => setDetail(p)}>
                    <span className="font-medium">{p.web_name}</span>
                    <PositionTag type={p.element_type} />
                    <span className="num text-[10px] text-muted-foreground">{fpl.teamById.get(p.team)?.short_name}</span>
                    {p.status !== "a" && <span className="h-2 w-2 bg-warn" title={p.news || "Availability doubt"} />}
                  </button>
                </td>
                {COLUMNS.map((col) => (
                  <td key={col.key} className={cn("num p-2 text-right", col.hideOnMobile && "hidden md:table-cell", sort.key === col.key && "text-foreground", sort.key !== col.key && "text-muted-foreground")}>{col.show(p)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <Empty>No players match these filters.</Empty>}
        <div className="flex items-center justify-between border-t border-border p-3">
          <Button variant="outline" size="sm" disabled={current === 0} onClick={() => setPage(current - 1)}>Previous</Button>
          <span className="num text-xs text-muted-foreground">Page {current + 1} of {pages}</span>
          <Button variant="outline" size="sm" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>Next</Button>
        </div>
      </div>
      <PlayerDialog player={detail} fpl={fpl} onClose={() => setDetail(null)} />
    </div>
  );
}

const METRICS: { key: string; label: string; get: (h: PlayerHistoryRow) => number }[] = [
  { key: "total_points", label: "Points", get: (h) => h.total_points },
  { key: "expected_goal_involvements", label: "Expected goal involvements (xGI)", get: (h) => num(h.expected_goal_involvements) },
  { key: "expected_goals", label: "Expected goals (xG)", get: (h) => num(h.expected_goals) },
  { key: "expected_assists", label: "Expected assists (xA)", get: (h) => num(h.expected_assists) },
  { key: "goals_scored", label: "Goals", get: (h) => h.goals_scored },
  { key: "assists", label: "Assists", get: (h) => h.assists },
  { key: "ict_index", label: "ICT index", get: (h) => num(h.ict_index) },
  { key: "bps", label: "Bonus points system", get: (h) => h.bps },
  { key: "minutes", label: "Minutes", get: (h) => h.minutes },
  { key: "value", label: "Price (£m)", get: (h) => h.value / 10 },
  { key: "selected", label: "Owned by (managers)", get: (h) => h.selected },
];

function ChartBuilder({ fpl }: { fpl: Fpl }) {
  const top = useMemo(() => [...fpl.players].sort((a, b) => b.total_points - a.total_points), [fpl]);
  const [ids, setIds] = useState<number[]>(() => top.slice(0, 3).map((p) => p.id));
  const [metricKey, setMetricKey] = useState("total_points");
  const [mode, setMode] = useState<"per" | "cumulative">("cumulative");
  const [query, setQuery] = useState("");
  const summaries = usePlayerSummaries(ids);
  const metric = METRICS.find((m) => m.key === metricKey)!;
  const additive = !["value", "selected"].includes(metricKey);
  const cumulative = mode === "cumulative" && additive;

  const data = useMemo(() => {
    const byGw = new Map<number, Record<string, number>>();
    summaries.data.forEach((summary, i) => {
      if (!summary) return;
      const perGw = new Map<number, number>();
      // A double gameweek has two rows for one round
      for (const h of summary.history) perGw.set(h.round, additive ? (perGw.get(h.round) ?? 0) + metric.get(h) : metric.get(h));
      let running = 0;
      [...perGw.entries()].sort((a, b) => a[0] - b[0]).forEach(([gw, v]) => {
        running += v;
        const row = byGw.get(gw) ?? { gw };
        row[ids[i]] = +(cumulative ? running : v).toFixed(2);
        byGw.set(gw, row);
      });
    });
    return [...byGw.values()].sort((a, b) => a.gw - b.gw);
  }, [summaries.data, ids, metric, additive, cumulative]);

  const matches = query.trim().length >= 2
    ? top.filter((p) => !ids.includes(p.id) && (p.web_name.toLowerCase().includes(query.toLowerCase()) || fullName(p).toLowerCase().includes(query.toLowerCase()))).slice(0, 6)
    : [];

  return (
    <Section eyebrow="Up to 6 players, one measure" title="Chart Builder">
      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_16rem_auto]">
        <div className="relative">
          <Input aria-label="Add a player to the chart" placeholder={ids.length >= 6 ? "Remove a player to add another" : "Add a player…"} disabled={ids.length >= 6} value={query} onChange={(e) => setQuery(e.target.value)} />
          {matches.length > 0 && (
            <ul className="absolute z-20 mt-1 w-full border border-border bg-popover">
              {matches.map((p) => (
                <li key={p.id}>
                  <button className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent" onClick={() => { setIds([...ids, p.id]); setQuery(""); }}>
                    {p.web_name} <span className="num text-[10px] text-muted-foreground">{fpl.teamById.get(p.team)?.short_name} · {p.total_points} pts</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Select value={metricKey} onValueChange={setMetricKey}>
          <SelectTrigger aria-label="Measure"><SelectValue /></SelectTrigger>
          <SelectContent>{METRICS.map((m) => <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>)}</SelectContent>
        </Select>
        <div className="flex gap-1" role="group" aria-label="Aggregation">
          <Button size="sm" variant={cumulative ? "default" : "outline"} disabled={!additive} onClick={() => setMode("cumulative")}>Cumulative</Button>
          <Button size="sm" variant={!cumulative ? "default" : "outline"} onClick={() => setMode("per")}>Per GW</Button>
        </div>
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        {ids.map((id, i) => (
          <span key={id} className="inline-flex items-center gap-1.5 border border-border bg-black/40 px-2 py-1 text-xs">
            <span className="h-2 w-2" style={{ background: SERIES[i] }} />
            {fpl.playerById.get(id)?.web_name}
            <button aria-label="Remove" onClick={() => setIds(ids.filter((x) => x !== id))} className="text-muted-foreground hover:text-blood"><X className="h-3 w-3" /></button>
          </span>
        ))}
      </div>
      {ids.length === 0 ? <Empty>Add a player to start charting.</Empty> : summaries.isLoading && data.length === 0 ? <LoadingBlock /> : (
        <>
          <ChartFrame height={340}>
            <LineChart data={data} margin={{ top: 8, right: 12, left: -6, bottom: 0 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="gw" {...AXIS} />
              <YAxis {...AXIS} axisLine={false} tickFormatter={(v: number) => (v >= 10000 ? Intl.NumberFormat("en", { notation: "compact" }).format(v) : String(v))} />
              <Tooltip content={<ChartTooltip labelPrefix="Gameweek " />} cursor={{ stroke: REFERENCE, strokeDasharray: "3 3" }} />
              {ids.map((id, i) => (
                <Line key={id} dataKey={String(id)} name={fpl.playerById.get(id)?.web_name} stroke={SERIES[i]} strokeWidth={2} dot={false} connectNulls activeDot={{ r: 5, stroke: "#08080b", strokeWidth: 2 }} />
              ))}
            </LineChart>
          </ChartFrame>
          <Legend items={ids.map((id, i) => ({ label: fpl.playerById.get(id)?.web_name ?? "", color: SERIES[i] }))} />
          <p className="mt-2 text-xs text-muted-foreground">{metric.label}, {cumulative ? "running total" : "per gameweek"}.</p>
        </>
      )}
    </Section>
  );
}

export default function Players() {
  const { fpl, isLoading, error, refetch } = useFpl();
  if (isLoading) return <LoadingBlock className="h-96" />;
  if (error || !fpl) return <ErrorBlock onRetry={() => void refetch()} />;
  return (
    <>
      <PageHeader eyebrow={`${fpl.players.length} players · ${fpl.teams.length} clubs`} title="Player Explorer">
        Filter and sort every player in the game, compare up to four head to head, or chart anyone's season.
      </PageHeader>
      <Tabs defaultValue="table" className="space-y-5">
        <TabsList>
          <TabsTrigger value="table">Explorer</TabsTrigger>
          <TabsTrigger value="charts">Chart Builder</TabsTrigger>
        </TabsList>
        <TabsContent value="table"><Explorer fpl={fpl} /></TabsContent>
        <TabsContent value="charts"><ChartBuilder fpl={fpl} /></TabsContent>
      </Tabs>
    </>
  );
}
