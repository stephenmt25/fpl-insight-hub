import { useMemo, useState } from "react";
import { Area, CartesianGrid, ComposedChart, Line, ReferenceLine, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import type { AppProps } from "@/apps";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Empty, ErrorBlock, FdrChip, LoadingBlock, PositionTag, Section, Stat } from "@/components/shared/bits";
import { AXIS, ChartFrame, ChartTooltip, GRID, Legend, REFERENCE, SERIES } from "@/components/shared/charts";
import { leagueTable, runDifficulty, upcomingByTeam } from "@/lib/fpl/fixtures";
import { fullName, num, price, signed } from "@/lib/fpl/format";
import { useFixtures, useFpl, usePlayerSummaries, type Fpl } from "@/lib/fpl/hooks";
import type { PlayerSummary } from "@/lib/fpl/types";
import { FEATURES, findDifferentials } from "@/lib/ml/differentials";
import { forecastForm, type FormForecast } from "@/lib/ml/form";
import { predictPriceChanges, type PricePrediction } from "@/lib/ml/price";
import { cn } from "@/lib/utils";

/* ---------- Differentials ---------- */

export function Differentials({ fpl }: AppProps) {
  const [maxOwnership, setMaxOwnership] = useState(10);
  const { picks, clusters, clustered } = useMemo(() => findDifferentials(fpl.players, { maxOwnership }), [fpl, maxOwnership]);
  const team = (id: number) => fpl.teamById.get(id)?.short_name ?? "";

  if (clusters.length === 0) return <Empty>Not enough minutes have been played yet to cluster players. Check back after a few gameweeks.</Empty>;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {clusters.map((c, i) => (
          <div key={c.id} className="panel p-4">
            <p className="eyebrow flex items-center gap-2"><span className="h-2 w-2" style={{ background: SERIES[i] }} />Cluster {i + 1}</p>
            <p className="h-display mt-2 text-2xl">{c.label}</p>
            <p className="num mt-1 text-xs text-muted-foreground">{c.size} players · {c.meanOwnership.toFixed(1)}% avg owned</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        <Section eyebrow="k-means on six features" title="Quality vs Ownership">
          <ChartFrame height={340}>
            <ScatterChart margin={{ top: 8, right: 12, left: -18, bottom: 16 }}>
              <CartesianGrid stroke={GRID} />
              <XAxis type="number" dataKey="x" name="Owned by" unit="%" {...AXIS} label={{ value: "Owned by %", position: "insideBottom", offset: -8, fill: "hsl(226 9% 62%)", fontSize: 11 }} />
              <YAxis type="number" dataKey="y" name="Quality score" {...AXIS} axisLine={false} />
              <ZAxis range={[36, 36]} />
              <ReferenceLine x={maxOwnership} stroke={REFERENCE} strokeDasharray="4 4" />
              <Tooltip
                cursor={{ strokeDasharray: "3 3", stroke: REFERENCE }}
                content={({ active, payload }) => {
                  const d = active && payload?.[0]?.payload as { name: string; x: number; y: number; cluster: string } | undefined;
                  return d ? (
                    <div className="border border-border bg-popover/95 px-3 py-2 text-xs">
                      <p className="font-semibold text-foreground">{d.name}</p>
                      <p className="text-muted-foreground">{d.cluster} · owned by <span className="num text-foreground">{d.x}%</span> · score <span className="num text-foreground">{d.y}</span></p>
                    </div>
                  ) : null;
                }}
              />
              {clusters.map((c, i) => (
                <Scatter key={c.id} name={c.label} fill={SERIES[i]} fillOpacity={0.8} stroke="#0b0b0f" strokeWidth={1}
                  data={clustered.filter((p) => p.cluster === c.id).map((p) => ({ x: p.ownership, y: +p.score.toFixed(2), name: `${p.player.web_name} (${team(p.player.team)})`, cluster: c.label }))} />
              ))}
            </ScatterChart>
          </ChartFrame>
          <Legend items={[...clusters.map((c, i) => ({ label: c.label, color: SERIES[i] })), { label: "Ownership cut-off", color: REFERENCE, dashed: true }]} />
          <p className="mt-2 text-xs text-muted-foreground">Quality score is the mean z-score across {FEATURES.join(", ")}. Differentials sit top-left: strong numbers, few owners.</p>
        </Section>

        <Section eyebrow={`${picks.length} hidden gems`} title="Differential Picks"
          action={
            <div className="w-40 space-y-1.5">
              <p className="eyebrow">Owned by under <span className="num text-foreground">{maxOwnership}%</span></p>
              <Slider aria-label="Maximum ownership" min={2} max={25} step={1} value={[maxOwnership]} onValueChange={([v]) => setMaxOwnership(v)} />
            </div>
          }>
          {picks.length === 0 ? <Empty>No top-cluster players under that ownership.</Empty> : (
            <ul className="space-y-2">
              {picks.map((pick) => (
                <li key={pick.player.id} className="border border-border bg-black/30 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{pick.player.web_name}</span>
                    <PositionTag type={pick.player.element_type} />
                    <span className="num text-[10px] text-muted-foreground">{team(pick.player.team)} · {price(pick.player.now_cost)}</span>
                    <span className="num ml-auto text-sm" title="Percentile of quality score among regular starters">{pick.confidence}<span className="text-muted-foreground">th pct</span></span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{pick.reasons.join(" · ")}</p>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}

/* ---------- Price watch ---------- */

function PriceList({ title, list, fpl }: { title: string; list: PricePrediction[]; fpl: Fpl }) {
  const rise = title === "Likely Risers";
  return (
    <Section eyebrow={rise ? "Buy before the rise" : "Sell before the drop"} title={title}>
      {list.length === 0 ? <Empty>No strong signals right now. Transfer activity builds up towards the deadline.</Empty> : (
        <ul className="space-y-2">
          {list.map((p) => (
            <li key={p.player.id} className="border border-border bg-black/30 p-3">
              <div className="flex flex-wrap items-center gap-2">
                {rise ? <TrendingUp className="h-4 w-4 text-good" /> : <TrendingDown className="h-4 w-4 text-bad" />}
                <span className="font-semibold">{p.player.web_name}</span>
                <span className="num text-[10px] text-muted-foreground">{fpl.teamById.get(p.player.team)?.short_name} · {price(p.player.now_cost)} · {p.player.selected_by_percent}%</span>
                <Badge variant="outline" className={cn("ml-auto", p.confidence === "high" && "border-blood text-blood")}>{p.confidence}</Badge>
                <span className="num w-12 text-right text-lg font-semibold">{p.probability}%</span>
              </div>
              <div className="mt-2 h-1 bg-muted" role="img" aria-label={`${p.probability}% probability`}>
                <div className={cn("h-full", rise ? "bg-good" : "bg-bad")} style={{ width: `${p.probability}%` }} />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">{p.reasons.join(" · ")}</p>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

export function PriceWatch({ fpl }: AppProps) {
  const { risers, fallers } = useMemo(() => predictPriceChanges(fpl.players, fpl.bootstrap.total_players, 10), [fpl]);
  return (
    <div className="space-y-4">
      <p className="text-center text-xs text-muted-foreground">
        Probability of a £0.1m move at the next daily update, from net transfers relative to ownership and FPL's published progress towards the change threshold.
      </p>
      <div className="grid gap-5 lg:grid-cols-2">
        <PriceList title="Likely Risers" list={risers} fpl={fpl} />
        <PriceList title="Likely Fallers" list={fallers} fpl={fpl} />
      </div>
    </div>
  );
}

/* ---------- Form forecast ---------- */

function toForecast(summary: PlayerSummary): FormForecast {
  const byRound = new Map<number, number>();
  for (const h of summary.history) byRound.set(h.round, (byRound.get(h.round) ?? 0) + h.total_points);
  const history = [...byRound.entries()].sort((a, b) => a[0] - b[0]).map(([, pts]) => pts);
  return forecastForm(history, summary.fixtures.slice(0, 3).map((f) => f.difficulty));
}

const TREND_ICON = { rising: TrendingUp, falling: TrendingDown, stable: Minus };
const TREND_TONE = { rising: "text-good", falling: "text-bad", stable: "text-muted-foreground" };

export function FormForecastTab({ fpl }: AppProps) {
  const watch = useMemo(
    () => fpl.players.filter((p) => p.minutes >= 270 && p.status === "a").sort((a, b) => num(b.form) - num(a.form)).slice(0, 12),
    [fpl],
  );
  const [selected, setSelected] = useState<number>(watch[0]?.id ?? 0);
  const [query, setQuery] = useState("");
  const ids = useMemo(() => [...new Set([...watch.map((p) => p.id), selected])].filter(Boolean), [watch, selected]);
  const summaries = usePlayerSummaries(ids);

  const forecasts = useMemo(
    () => new Map(ids.map((id, i) => [id, summaries.data[i] ? toForecast(summaries.data[i]!) : null])),
    [ids, summaries.data],
  );
  const player = fpl.playerById.get(selected);
  const summary = summaries.data[ids.indexOf(selected)];
  const forecast = forecasts.get(selected);

  const chart = useMemo(() => {
    if (!summary || !forecast) return [];
    const rounds = [...new Set(summary.history.map((h) => h.round))].sort((a, b) => a - b);
    const rows: Record<string, number | number[] | undefined>[] = rounds.map((gw, i) => ({ gw, actual: forecast.history[i] }));
    const last = rounds[rounds.length - 1] ?? fpl.gw;
    if (rows.length) {
      const tail = rows[rows.length - 1];
      tail.forecast = tail.actual as number; // joins the dashed forecast to the last real point
      tail.band = [tail.actual as number, tail.actual as number];
    }
    forecast.forecast.forEach((f) => rows.push({ gw: last + f.step, forecast: f.points, band: [f.low, f.high] }));
    return rows;
  }, [summary, forecast, fpl.gw]);

  const matches = query.trim().length >= 2
    ? fpl.players.filter((p) => p.web_name.toLowerCase().includes(query.toLowerCase()) || fullName(p).toLowerCase().includes(query.toLowerCase())).sort((a, b) => b.total_points - a.total_points).slice(0, 6)
    : [];

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.5fr]">
      <Section eyebrow="Top 12 by current form" title="Form Watchlist">
        <div className="relative mb-3">
          <Input aria-label="Forecast any player" placeholder="Forecast any player…" value={query} onChange={(e) => setQuery(e.target.value)} />
          {matches.length > 0 && (
            <ul className="absolute z-20 mt-1 w-full border border-border bg-popover">
              {matches.map((p) => (
                <li key={p.id}><button className="w-full px-3 py-2 text-left text-sm hover:bg-accent" onClick={() => { setSelected(p.id); setQuery(""); }}>{p.web_name} <span className="num text-[10px] text-muted-foreground">{fpl.teamById.get(p.team)?.short_name}</span></button></li>
              ))}
            </ul>
          )}
        </div>
        <ul className="divide-y divide-border">
          {watch.map((p) => {
            const f = forecasts.get(p.id);
            const Icon = f ? TREND_ICON[f.trend] : Minus;
            return (
              <li key={p.id}>
                <button onClick={() => setSelected(p.id)} className={cn("flex w-full items-center gap-2 px-2 py-2 text-left text-sm hover:bg-accent/40", selected === p.id && "bg-blood/10")}>
                  <Icon className={cn("h-4 w-4 shrink-0", f ? TREND_TONE[f.trend] : "text-muted-foreground")} />
                  <span className="truncate font-medium">{p.web_name}</span>
                  <span className="num text-[10px] text-muted-foreground">{fpl.teamById.get(p.team)?.short_name}</span>
                  <span className="num ml-auto text-xs text-muted-foreground">form {p.form}</span>
                  <span className="num w-14 text-right font-semibold">{f ? f.forecast[0].points.toFixed(1) : "…"}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-right text-[10px] text-muted-foreground">Right column: forecast points next gameweek</p>
      </Section>

      <Section eyebrow={player ? `${fpl.teamById.get(player.team)?.name} · ${price(player.now_cost)}` : ""} title={player ? `${player.web_name}: Form Forecast` : "Form Forecast"}>
        {!forecast || !summary ? <LoadingBlock /> : forecast.history.length < 3 ? <Empty>Not enough matches played to forecast this player.</Empty> : (
          <>
            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat label="Trend" value={forecast.trend} tone={forecast.trend === "rising" ? "good" : forecast.trend === "falling" ? "bad" : undefined} hint={`${signed(forecast.slope, 2)} pts per gameweek`} />
              <Stat label="Next gameweek" value={forecast.forecast[0].points.toFixed(1)} hint={`${forecast.forecast[0].low.toFixed(1)} to ${forecast.forecast[0].high.toFixed(1)}`} />
              <Stat label="Momentum" value={signed(forecast.momentum, 1)} hint="last 3 vs previous 3" />
              <Stat label="Confidence" value={forecast.confidence} hint={`volatility ±${forecast.volatility.toFixed(1)}`} />
            </div>
            <ChartFrame height={280}>
              <ComposedChart data={chart} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="gw" {...AXIS} />
                <YAxis {...AXIS} axisLine={false} />
                <Tooltip cursor={{ stroke: REFERENCE, strokeDasharray: "3 3" }}
                  content={({ active, payload, label }) => <ChartTooltip active={active} label={label} labelPrefix="Gameweek " payload={(payload ?? []).filter((p) => p.dataKey !== "band") as never} />} />
                <Area dataKey="band" name="Likely range" stroke="none" fill={SERIES[0]} fillOpacity={0.14} isAnimationActive={false} />
                <Line dataKey="actual" name="Actual points" stroke="#c9ccd6" strokeWidth={2} dot={{ r: 3, fill: "#c9ccd6", strokeWidth: 0 }} />
                <Line dataKey="forecast" name="Forecast" stroke={SERIES[0]} strokeWidth={2} strokeDasharray="6 4" dot={{ r: 4, fill: SERIES[0], stroke: "#08080b", strokeWidth: 2 }} />
              </ComposedChart>
            </ChartFrame>
            <Legend items={[{ label: "Actual points", color: "#c9ccd6" }, { label: "Forecast", color: SERIES[0], dashed: true }, { label: "Likely range (±1σ)", color: "rgba(225,29,72,0.35)" }]} />
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="eyebrow mr-1">Next</span>
              {summary.fixtures.slice(0, 5).map((f) => (
                <FdrChip key={f.id} difficulty={f.difficulty} label={`${fpl.teamById.get(f.is_home ? f.team_a : f.team_h)?.short_name} ${f.is_home ? "H" : "A"}`} />
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Exponentially weighted average of the last six gameweeks plus a damped linear trend, scaled by upcoming fixture difficulty. Built from real match data; a guide, not a guarantee.
            </p>
          </>
        )}
      </Section>
    </div>
  );
}

/* ---------- Fixtures & table ---------- */

export function FixtureTicker({ fpl }: AppProps) {
  const { data: fixtures, isLoading, error } = useFixtures();
  const [span, setSpan] = useState(6);
  const from = fpl.next?.id ?? fpl.gw;
  const rows = useMemo(() => {
    if (!fixtures) return [];
    const run = upcomingByTeam(fixtures, fpl.teams.map((t) => t.id), from, span);
    return fpl.teams.map((t) => ({ team: t, run: run.get(t.id)!, score: runDifficulty(run.get(t.id)!) })).sort((a, b) => a.score - b.score);
  }, [fixtures, fpl, from, span]);

  if (isLoading) return <LoadingBlock className="h-96" />;
  if (error) return <ErrorBlock message="Fixtures could not be loaded." />;
  const gws = Array.from({ length: span }, (_, i) => from + i).filter((gw) => gw <= 38);

  return (
    <Section eyebrow="Easiest run first" title="Fixture Difficulty"
      action={<div className="flex gap-1" role="group" aria-label="Gameweeks ahead">{[4, 6, 8].map((n) => <Button key={n} size="sm" variant={span === n ? "default" : "outline"} onClick={() => setSpan(n)}>{n} GWs</Button>)}</div>}>
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-1 text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-widest text-muted-foreground">
              <th className="text-left font-normal">Team</th>
              {gws.map((gw) => <th key={gw} className="font-normal">GW{gw}</th>)}
              <th className="text-right font-normal" title="Mean difficulty; blanks count as 5">Avg</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ team, run, score }) => (
              <tr key={team.id}>
                <td className="whitespace-nowrap pr-3 font-medium">{team.name}</td>
                {gws.map((gw, i) => (
                  <td key={gw} className="min-w-16 text-center">
                    {run[i].length === 0 ? <span className="num block bg-black/60 py-1 text-[10px] text-muted-foreground">blank</span> : (
                      <span className="flex flex-col gap-0.5">
                        {run[i].map((f) => <FdrChip key={f.opponent + String(f.home)} className="w-full" difficulty={f.difficulty} label={`${fpl.teamById.get(f.opponent)?.short_name} ${f.home ? "H" : "A"}`} />)}
                      </span>
                    )}
                  </td>
                ))}
                <td className="num pl-2 text-right font-semibold">{score.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Green is an easier opponent, red a harder one; the number in each cell is FPL's 1 to 5 difficulty rating.</p>
    </Section>
  );
}

const FORM_CLASS = { W: "bg-good text-black", D: "bg-zinc-500 text-black", L: "bg-bad text-white" };

export function LeagueTable({ fpl }: AppProps) {
  const { data: fixtures, isLoading, error } = useFixtures();
  const table = useMemo(() => (fixtures ? leagueTable(fixtures, fpl.teams.map((t) => t.id)) : []), [fixtures, fpl]);
  if (isLoading) return <LoadingBlock className="h-96" />;
  if (error) return <ErrorBlock message="Results could not be loaded." />;

  return (
    <Section eyebrow="Computed from every result this season" title="Premier League Table">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground">
              {["#", "Club", "P", "W", "D", "L", "GF", "GA", "GD", "Pts", "Form"].map((h, i) => (
                <th key={h} className={cn("p-2 font-normal", i === 1 ? "text-left" : i === 10 ? "text-right" : "text-center", [3, 4, 5, 6, 7].includes(i) && "hidden sm:table-cell")}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {table.map((r, i) => (
              <tr key={r.team} className={cn("hover:bg-accent/40", i === 3 && "border-b-2 border-b-chrome/40", i === 16 && "border-b-2 border-b-blood/60")}>
                <td className={cn("num p-2 text-center font-semibold", i < 4 && "text-chrome", i > 16 && "text-bad")}>{i + 1}</td>
                <td className="p-2 font-medium">{fpl.teamById.get(r.team)?.name}</td>
                <td className="num p-2 text-center text-muted-foreground">{r.played}</td>
                {[r.won, r.drawn, r.lost, r.gf, r.ga].map((v, j) => <td key={j} className="num hidden p-2 text-center text-muted-foreground sm:table-cell">{v}</td>)}
                <td className="num p-2 text-center">{signed(r.gd)}</td>
                <td className="num p-2 text-center text-base font-semibold">{r.points}</td>
                <td className="p-2">
                  <span className="flex justify-end gap-0.5">
                    {r.form.map((f, j) => <span key={j} className={cn("num flex h-5 w-5 items-center justify-center text-[10px] font-bold", FORM_CLASS[f])}>{f}</span>)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Lines mark the Champions League places and the relegation zone.</p>
    </Section>
  );
}
