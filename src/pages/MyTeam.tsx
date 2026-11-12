import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight } from "lucide-react";
import type { AppProps } from "@/apps";
import { Badge } from "@/components/ui/badge";
import { Empty, ErrorBlock, FdrChip, GameweekPicker, LoadingBlock, PositionTag, Section, Stat } from "@/components/shared/bits";
import { AXIS, ChartFrame, ChartTooltip, GRID, Legend, REFERENCE, SERIES } from "@/components/shared/charts";
import { Pitch, type PitchPlayer } from "@/components/shared/Pitch";
import { upcomingByTeam } from "@/lib/fpl/fixtures";
import { chipLabel, compact, int, price, signed } from "@/lib/fpl/format";
import { useEntryHistory, useEntryPicks, useEntryTransfers, useEventLive, useFixtures, useFpl, usePlayerSummaries, type Fpl } from "@/lib/fpl/hooks";
import type { Player } from "@/lib/fpl/types";
import { rankCaptains } from "@/lib/ml/captain";
import { cn } from "@/lib/utils";

export function Squad({ fpl, managerId }: AppProps) {
  const [picked, setPicked] = useState<number | null>(null);
  const gw = picked ?? fpl.gw;
  const { data: picks, isLoading, error } = useEntryPicks(managerId, gw);
  const { data: live } = useEventLive(gw);
  const event = fpl.events.find((e) => e.id === gw);

  const toPitch = (pick: NonNullable<typeof picks>["picks"][number]): PitchPlayer | null => {
    const p = fpl.playerById.get(pick.element);
    if (!p) return null;
    const base = live?.get(p.id)?.total_points ?? 0;
    const starter = pick.position <= 11 || pick.multiplier > 0;
    return {
      id: p.id,
      name: p.web_name,
      team: fpl.teamById.get(p.team)?.short_name ?? "",
      type: p.element_type,
      points: starter ? base * Math.max(pick.multiplier, 1) : base,
      badge: pick.is_captain ? (pick.multiplier === 3 ? "TC" : "C") : pick.is_vice_captain ? "V" : undefined,
      flag: p.status !== "a" && p.news ? p.news : undefined,
    };
  };

  const all = (picks?.picks ?? []).map((pick) => ({ pick, view: toPitch(pick) })).filter((x) => x.view) as { pick: NonNullable<typeof picks>["picks"][number]; view: PitchPlayer }[];
  const starters = all.filter((x) => x.pick.position <= 11).map((x) => x.view);
  const bench = all.filter((x) => x.pick.position > 11).map((x) => x.view);
  const h = picks?.entry_history;
  const diff = h && event?.average_entry_score ? h.points - event.average_entry_score : null;

  return (
    <div className="space-y-5">
      <GameweekPicker value={gw} onChange={setPicked} max={fpl.gw} live={fpl.current?.id} />
      {isLoading ? <LoadingBlock className="h-[30rem]" /> : error || !picks ? (
        <ErrorBlock message="No squad recorded for this gameweek (the team may have joined later)." />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div>
            {picks.active_chip && <Badge className="mb-2 bg-blood text-white">{chipLabel(picks.active_chip)} active</Badge>}
            <Pitch starters={starters} bench={bench} />
            {picks.automatic_subs.length > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                Auto-subs:{" "}
                {picks.automatic_subs.map((s) => `${fpl.playerById.get(s.element_in)?.web_name} for ${fpl.playerById.get(s.element_out)?.web_name}`).join(", ")}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 content-start gap-3">
            <Stat label="Gameweek points" value={h?.points ?? "–"} tone={diff == null ? undefined : diff >= 0 ? "good" : "bad"}
              hint={diff == null ? undefined : `${signed(diff)} vs average (${event?.average_entry_score})`} />
            <Stat label="Gameweek rank" value={compact(h?.rank)} hint={h?.rank ? int(h.rank) : undefined} />
            <Stat label="Overall rank" value={compact(h?.overall_rank)} hint={h?.overall_rank ? int(h.overall_rank) : undefined} />
            <Stat label="Total points" value={int(h?.total_points)} />
            <Stat label="Squad value" value={price(h?.value)} hint={`${price(h?.bank)} in the bank`} />
            <Stat label="Left on bench" value={h?.points_on_bench ?? "–"} hint="points unused" />
            <Stat label="Transfers" value={h?.event_transfers ?? 0} tone={h?.event_transfers_cost ? "bad" : undefined}
              hint={h?.event_transfers_cost ? `−${h.event_transfers_cost} point hit` : "no hit taken"} className="col-span-2" />
          </div>
        </div>
      )}
    </div>
  );
}

export function Captain({ fpl, managerId }: AppProps) {
  const { data: picks, isLoading } = useEntryPicks(managerId, fpl.gw);
  const { data: fixtures } = useFixtures();
  const target = fpl.next;

  const options = useMemo(() => {
    if (!picks || !fixtures || !target) return [];
    const run = upcomingByTeam(fixtures, fpl.teams.map((t) => t.id), target.id, 1);
    const next = new Map([...run].map(([team, slots]) => [team, slots[0]]));
    const squad = picks.picks.map((p) => fpl.playerById.get(p.element)).filter(Boolean) as Player[];
    return rankCaptains(squad, next);
  }, [picks, fixtures, target, fpl]);

  if (!target) return <Empty>The season is over, so there is no next gameweek to captain.</Empty>;
  if (isLoading || !fixtures) return <LoadingBlock />;
  const best = options[0]?.score || 1;

  return (
    <Section eyebrow={`${target.name} · your 15 ranked`} title="Captain Optimiser">
      <p className="mb-4 text-xs text-muted-foreground">
        Score blends FPL's expected points (70%) with recent form (30%), then adjusts for fixture difficulty, home advantage, double gameweeks, penalty duty and injury doubts.
      </p>
      <ol className="space-y-2">
        {options.slice(0, 8).map((o, i) => (
          <li key={o.player.id} className={cn("border border-border bg-black/30 p-3", i === 0 && "border-blood/70")}>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className={cn("num w-6 text-lg font-semibold", i === 0 ? "text-blood" : "text-muted-foreground")}>{i + 1}</span>
              <span className="font-semibold">{o.player.web_name}</span>
              <PositionTag type={o.player.element_type} />
              <span className="flex gap-1">
                {o.fixtures.map((f) => (
                  <FdrChip key={f.opponent + String(f.home)} difficulty={f.difficulty} label={`${fpl.teamById.get(f.opponent)?.short_name} ${f.home ? "H" : "A"}`} />
                ))}
              </span>
              {i === 0 && <Badge className="bg-blood text-white">Captain</Badge>}
              {i === 1 && <Badge variant="outline">Vice</Badge>}
              <span className="num ml-auto text-lg font-semibold">{o.score.toFixed(1)}</span>
            </div>
            <div className="mt-2 h-1 bg-muted">
              <div className={cn("h-full", i === 0 ? "bg-blood" : "bg-chrome/60")} style={{ width: `${Math.max(2, (o.score / best) * 100)}%` }} />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">{o.reasons.join(" · ")}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

export function Chips({ fpl, managerId }: AppProps) {
  const { data: history, isLoading } = useEntryHistory(managerId);
  const { data: fixtures } = useFixtures();
  const nextGw = fpl.next?.id ?? 39;

  const special = useMemo(() => {
    if (!fixtures) return [];
    const run = upcomingByTeam(fixtures, fpl.teams.map((t) => t.id), nextGw, Math.max(0, 39 - nextGw));
    const out: { gw: number; doubles: string[]; blanks: string[] }[] = [];
    for (let i = 0; i < 39 - nextGw; i++) {
      const doubles: string[] = [];
      const blanks: string[] = [];
      run.forEach((slots, team) => {
        const name = fpl.teamById.get(team)?.short_name ?? "";
        if (slots[i].length > 1) doubles.push(name);
        if (slots[i].length === 0) blanks.push(name);
      });
      if (doubles.length || blanks.length) out.push({ gw: nextGw + i, doubles, blanks });
    }
    return out;
  }, [fixtures, fpl, nextGw]);

  if (isLoading) return <LoadingBlock />;
  const used = history?.chips ?? [];

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Section eyebrow="Your chips" title="Chip Planner">
        <ul className="space-y-2">
          {fpl.bootstrap.chips.map((chip) => {
            const play = used.find((u) => u.name === chip.name && u.event >= chip.start_event && u.event <= chip.stop_event);
            const expired = !play && nextGw > chip.stop_event;
            const open = !play && !expired && nextGw >= chip.start_event;
            return (
              <li key={chip.id} className="flex items-center justify-between gap-3 border border-border bg-black/30 p-3">
                <div>
                  <p className="font-semibold">{chipLabel(chip.name)}</p>
                  <p className="num text-xs text-muted-foreground">Gameweeks {chip.start_event}–{chip.stop_event}</p>
                </div>
                {play ? <Badge variant="secondary">Used GW{play.event}</Badge>
                  : expired ? <Badge variant="outline" className="text-muted-foreground">Expired</Badge>
                  : open ? <Badge className="bg-good text-black">Available</Badge>
                  : <Badge variant="outline">Opens GW{chip.start_event}</Badge>}
              </li>
            );
          })}
        </ul>
      </Section>
      <Section eyebrow="Fixture calendar" title="Doubles & Blanks">
        {!fixtures ? <LoadingBlock /> : special.length === 0 ? (
          <Empty>No double or blank gameweeks are scheduled yet. They are usually announced after cup draws; Bench Boost and Triple Captain are worth saving for them.</Empty>
        ) : (
          <ul className="space-y-2">
            {special.map((s) => (
              <li key={s.gw} className="border border-border bg-black/30 p-3 text-sm">
                <p className="num font-semibold">Gameweek {s.gw}</p>
                {s.doubles.length > 0 && <p className="text-good">Double: <span className="text-foreground">{s.doubles.join(", ")}</span></p>}
                {s.blanks.length > 0 && <p className="text-bad">Blank: <span className="text-foreground">{s.blanks.join(", ")}</span></p>}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

export function Transfers({ fpl, managerId }: AppProps) {
  const { data: transfers, isLoading } = useEntryTransfers(managerId);
  const recent = useMemo(() => (transfers ?? []).slice(0, 20), [transfers]);
  const ids = useMemo(() => [...new Set(recent.flatMap((t) => [t.element_in, t.element_out]))], [recent]);
  const summaries = usePlayerSummaries(ids);

  const pointsSince = (playerId: number, event: number) => {
    const summary = summaries.data[ids.indexOf(playerId)];
    return summary ? summary.history.filter((h) => h.round >= event).reduce((s, h) => s + h.total_points, 0) : null;
  };

  if (isLoading) return <LoadingBlock />;
  if (recent.length === 0) return <Empty>No transfers made yet this season.</Empty>;

  const rows = recent.map((t) => {
    const gained = pointsSince(t.element_in, t.event);
    const lost = pointsSince(t.element_out, t.event);
    return { t, gained, lost, net: gained != null && lost != null ? gained - lost : null };
  });
  const total = rows.every((r) => r.net != null) ? rows.reduce((s, r) => s + (r.net ?? 0), 0) : null;

  return (
    <Section eyebrow="Did it pay off?" title="Transfer Impact"
      action={total != null && <p className={cn("num text-lg font-semibold", total >= 0 ? "text-good" : "text-bad")}>{signed(total)} pts net</p>}>
      <p className="mb-3 text-xs text-muted-foreground">Points each player has scored since the gameweek of the transfer: the one you bought against the one you sold.</p>
      <ul className="divide-y divide-border">
        {rows.map(({ t, gained, lost, net }) => {
          const pin = fpl.playerById.get(t.element_in);
          const pout = fpl.playerById.get(t.element_out);
          return (
            <li key={t.time} className="grid grid-cols-[3rem_1fr_auto] items-center gap-3 py-2.5 text-sm">
              <span className="num text-xs text-muted-foreground">GW{t.event}</span>
              <div className="flex min-w-0 flex-wrap items-center gap-x-2">
                <span className="truncate text-muted-foreground">{pout?.web_name ?? "?"} <span className="num text-xs">{price(t.element_out_cost)}{lost != null && ` · ${lost} pts`}</span></span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-blood" />
                <span className="truncate font-semibold">{pin?.web_name ?? "?"} <span className="num text-xs font-normal text-muted-foreground">{price(t.element_in_cost)}{gained != null && ` · ${gained} pts`}</span></span>
              </div>
              <span className={cn("num w-12 text-right font-semibold", net == null ? "text-muted-foreground" : net >= 0 ? "text-good" : "text-bad")}>
                {net == null ? "…" : signed(net)}
              </span>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

export function Trends({ fpl, managerId }: AppProps) {
  const { data: history, isLoading } = useEntryHistory(managerId);
  if (isLoading) return <LoadingBlock />;
  const rows = (history?.current ?? []).map((h) => ({
    gw: h.event,
    points: h.points - h.event_transfers_cost,
    average: fpl.events.find((e) => e.id === h.event)?.average_entry_score,
    rank: h.overall_rank,
    value: h.value / 10,
  }));
  if (rows.length === 0) return <Empty>No gameweeks played yet.</Empty>;

  const best = rows.reduce((a, b) => (b.points > a.points ? b : a));
  const worst = rows.reduce((a, b) => (b.points < a.points ? b : a));
  const hits = history!.current.reduce((s, h) => s + h.event_transfers_cost, 0);
  const benched = history!.current.reduce((s, h) => s + h.points_on_bench, 0);
  const margin = { top: 8, right: 12, left: -14, bottom: 0 };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Best gameweek" value={best.points} hint={`Gameweek ${best.gw}`} tone="good" />
        <Stat label="Worst gameweek" value={worst.points} hint={`Gameweek ${worst.gw}`} tone="bad" />
        <Stat label="Points spent on hits" value={hits} hint="transfer penalties" />
        <Stat label="Left on bench" value={benched} hint="season total" />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Section eyebrow="Net of hits" title="Points vs Average">
          <ChartFrame>
            <LineChart data={rows} margin={margin}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="gw" {...AXIS} />
              <YAxis {...AXIS} axisLine={false} />
              <Tooltip content={<ChartTooltip labelPrefix="Gameweek " />} cursor={{ stroke: REFERENCE, strokeDasharray: "3 3" }} />
              <Line dataKey="average" name="Game average" stroke={REFERENCE} strokeWidth={2} strokeDasharray="5 4" dot={false} />
              <Line dataKey="points" name="Your points" stroke={SERIES[0]} strokeWidth={2} dot={{ r: 3, fill: SERIES[0], strokeWidth: 0 }} activeDot={{ r: 5, stroke: "#08080b", strokeWidth: 2 }} />
            </LineChart>
          </ChartFrame>
          <Legend items={[{ label: "Your points", color: SERIES[0] }, { label: "Game average", color: REFERENCE, dashed: true }]} />
        </Section>
        <Section eyebrow="Lower is better" title="Overall Rank">
          <ChartFrame>
            <LineChart data={rows} margin={{ ...margin, left: 0 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="gw" {...AXIS} />
              <YAxis {...AXIS} axisLine={false} reversed tickFormatter={(v: number) => compact(v)} domain={["dataMin", "dataMax"]} />
              <Tooltip content={<ChartTooltip labelPrefix="Gameweek " />} cursor={{ stroke: REFERENCE, strokeDasharray: "3 3" }} />
              <Line dataKey="rank" name="Overall rank" stroke={SERIES[1]} strokeWidth={2} dot={{ r: 3, fill: SERIES[1], strokeWidth: 0 }} activeDot={{ r: 5, stroke: "#08080b", strokeWidth: 2 }} />
            </LineChart>
          </ChartFrame>
        </Section>
        <Section eyebrow="£ million" title="Squad Value">
          <ChartFrame height={220}>
            <AreaChart data={rows} margin={margin}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="gw" {...AXIS} />
              <YAxis {...AXIS} axisLine={false} domain={["dataMin - 0.5", "dataMax + 0.5"]} tickFormatter={(v: number) => v.toFixed(1)} />
              <Tooltip content={<ChartTooltip labelPrefix="Gameweek " format={(v) => `£${v.toFixed(1)}m`} />} cursor={{ stroke: REFERENCE, strokeDasharray: "3 3" }} />
              <Area dataKey="value" name="Squad value" stroke={SERIES[2]} strokeWidth={2} fill={SERIES[2]} fillOpacity={0.12} />
            </AreaChart>
          </ChartFrame>
        </Section>
        <Section eyebrow="Career" title="Past Seasons">
          {history!.past.length === 0 ? <Empty>First season in the game.</Empty> : (
            <table className="w-full text-sm">
              <thead><tr className="eyebrow text-left"><th className="pb-2 font-normal">Season</th><th className="pb-2 text-right font-normal">Points</th><th className="pb-2 text-right font-normal">Rank</th></tr></thead>
              <tbody className="divide-y divide-border">
                {[...history!.past].reverse().map((s) => (
                  <tr key={s.season_name}><td className="py-2">{s.season_name}</td><td className="num py-2 text-right">{int(s.total_points)}</td><td className="num py-2 text-right">{int(s.rank)}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>
      </div>
    </div>
  );
}
