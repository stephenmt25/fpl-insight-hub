import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { ErrorBlock, GameweekPicker, LoadingBlock, Section, Stat } from "@/components/shared/bits";
import { AXIS, ChartFrame, ChartTooltip, GRID, Legend, REFERENCE, SERIES } from "@/components/shared/charts";
import { SigilDivider } from "@/components/shared/ornaments";
import { Pitch } from "@/components/shared/Pitch";
import { GUEST_ID, useAuth } from "@/lib/auth";
import { chipLabel, compact, countdown, int, kickoff } from "@/lib/fpl/format";
import { useDreamTeam, useFixtures, useFpl, type Fpl } from "@/lib/fpl/hooks";
import { HeroScene } from "@/three/lazy";

function Countdown({ to }: { to: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const c = countdown(to, now);
  const cells: [string, number][] = [["days", c.days], ["hrs", c.hours], ["min", c.minutes], ["sec", c.seconds]];
  return (
    <div className="flex gap-2" role="timer" aria-label="Time until the next deadline">
      {cells.map(([label, value]) => (
        <div key={label} className="panel min-w-14 px-2 py-2 text-center">
          <p className="num text-2xl font-semibold text-foreground">{String(value).padStart(2, "0")}</p>
          <p className="eyebrow">{label}</p>
        </div>
      ))}
    </div>
  );
}

function Hero({ fpl }: { fpl: Fpl }) {
  const { manager, managerId, setDialogOpen, signIn } = useAuth();
  const startYear = new Date(fpl.events[0]?.deadline_time ?? Date.now()).getFullYear();
  const season = `${startYear}/${String((startYear + 1) % 100).padStart(2, "0")}`;

  return (
    <section className="relative grid items-center gap-2 lg:grid-cols-[1.05fr_1fr]">
      <div className="relative z-10 animate-rise space-y-5 py-4 text-center lg:text-left">
        <p className="eyebrow">Season {season} · {fpl.current ? fpl.current.name : "Pre-season"} · {compact(fpl.bootstrap.total_players)} managers</p>
        <h1 className="font-fraktur text-6xl leading-[0.9] sm:text-7xl xl:text-8xl">
          <span className="chrome-text block">Rule the</span>
          <span className="block text-blood glow-blood">Gameweek</span>
        </h1>
        <p className="mx-auto max-w-md text-sm text-muted-foreground lg:mx-0">
          Live Fantasy Premier League intelligence: your squad, your leagues, price and form predictions, straight from the official data feed.
        </p>

        {fpl.next && (
          <div className="flex flex-col items-center gap-2 lg:items-start">
            <p className="eyebrow">{fpl.next.name} deadline · {kickoff(fpl.next.deadline_time)}</p>
            <Countdown to={fpl.next.deadline_time} />
          </div>
        )}

        {managerId ? (
          <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <div className="text-left">
              <p className="eyebrow">Signed in as</p>
              <p className="h-gothic text-2xl">{manager?.name ?? "…"}</p>
            </div>
            <div className="num border-l border-border pl-3 text-sm text-muted-foreground">
              <p><span className="text-foreground">{int(manager?.summary_overall_points)}</span> pts</p>
              <p>rank <span className="text-foreground">{int(manager?.summary_overall_rank)}</span></p>
            </div>
            <Button asChild className="btn-chrome"><Link to="/my-team">Open my team</Link></Button>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-3 lg:justify-start">
            <Button className="btn-chrome" size="lg" onClick={() => setDialogOpen(true)}>Sign in with FPL ID</Button>
            <Button variant="outline" size="lg" onClick={() => void signIn(GUEST_ID)}>Try as guest</Button>
          </div>
        )}
      </div>
      <div className="pointer-events-none absolute inset-0 opacity-30 lg:pointer-events-auto lg:relative lg:h-[30rem] lg:opacity-100">
        <HeroScene />
      </div>
    </section>
  );
}

const CHIPS = ["wildcard", "freehit", "bboost", "3xc"] as const;

function SeasonCharts({ fpl, selected }: { fpl: Fpl; selected: number }) {
  const played = fpl.events.filter((e) => e.finished || e.is_current);
  const scores = played.map((e) => ({ gw: e.id, average: e.average_entry_score, highest: e.highest_score ?? undefined }));
  const chips = played.map((e) => ({
    gw: e.id,
    ...Object.fromEntries(CHIPS.map((c) => [c, e.chip_plays?.find((p) => p.chip_name === c)?.num_played ?? 0])),
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Section eyebrow="Season" title="Points per Gameweek">
        <ChartFrame>
          <LineChart data={scores} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="gw" {...AXIS} />
            <YAxis {...AXIS} axisLine={false} />
            <Tooltip content={<ChartTooltip labelPrefix="Gameweek " />} cursor={{ stroke: REFERENCE, strokeDasharray: "3 3" }} />
            <ReferenceLine x={selected} stroke={REFERENCE} strokeDasharray="2 4" />
            <Line dataKey="highest" name="Highest score" stroke={REFERENCE} strokeWidth={2} strokeDasharray="5 4" dot={false} activeDot={{ r: 4 }} />
            <Line dataKey="average" name="Average score" stroke={SERIES[0]} strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: "#08080b", strokeWidth: 2 }} />
          </LineChart>
        </ChartFrame>
        <Legend items={[{ label: "Average score", color: SERIES[0] }, { label: "Highest score", color: REFERENCE, dashed: true }]} />
      </Section>

      <Section eyebrow="Season" title="Chips Played">
        <ChartFrame>
          <BarChart data={chips} margin={{ top: 8, right: 12, left: -6, bottom: 0 }} barCategoryGap="22%">
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="gw" {...AXIS} />
            <YAxis {...AXIS} axisLine={false} tickFormatter={(v: number) => compact(v)} />
            <Tooltip content={<ChartTooltip labelPrefix="Gameweek " />} cursor={{ fill: "hsl(240 8% 14% / 0.6)" }} />
            {CHIPS.map((chip, i) => (
              <Bar key={chip} dataKey={chip} name={chipLabel(chip)} stackId="chips" fill={SERIES[i]} stroke="#0b0b0f" strokeWidth={1} maxBarSize={26} />
            ))}
          </BarChart>
        </ChartFrame>
        <Legend items={CHIPS.map((chip, i) => ({ label: chipLabel(chip), color: SERIES[i] }))} />
      </Section>
    </div>
  );
}

function TeamOfTheWeek({ fpl, gw }: { fpl: Fpl; gw: number }) {
  const event = fpl.events.find((e) => e.id === gw);
  const { data, isLoading } = useDreamTeam(gw, !!event && (event.finished || event.is_current));
  const players = useMemo(
    () =>
      (data?.team ?? []).flatMap((slot) => {
        const p = fpl.playerById.get(slot.element);
        if (!p) return [];
        return [{
          id: p.id, name: p.web_name, team: fpl.teamById.get(p.team)?.short_name ?? "", type: p.element_type, points: slot.points,
          badge: data?.top_player?.id === p.id ? ("★" as const) : undefined,
        }];
      }),
    [data, fpl],
  );

  return (
    <Section eyebrow={`Gameweek ${gw}`} title="Team of the Week" action={players.length > 0 && <p className="num text-sm text-muted-foreground">{players.reduce((s, p) => s + Number(p.points), 0)} pts</p>}>
      {isLoading ? <LoadingBlock className="h-[26rem]" /> : players.length > 0 ? <Pitch starters={players} /> : (
        <p className="py-16 text-center text-sm text-muted-foreground">The team of the week appears once matches have been played.</p>
      )}
    </Section>
  );
}

function Results({ fpl, gw }: { fpl: Fpl; gw: number }) {
  const { data: fixtures, isLoading } = useFixtures();
  const list = (fixtures ?? []).filter((f) => f.event === gw).sort((a, b) => (a.kickoff_time ?? "").localeCompare(b.kickoff_time ?? ""));
  const name = (id: number) => fpl.teamById.get(id)?.name ?? "?";

  return (
    <Section eyebrow={`Gameweek ${gw}`} title="Fixtures & Results">
      {isLoading ? <LoadingBlock /> : list.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">No fixtures scheduled.</p>
      ) : (
        <ul className="divide-y divide-border">
          {list.map((f) => (
            <li key={f.id} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-2.5 text-sm">
              <span className="truncate text-right">{name(f.team_h)}</span>
              {f.started && f.team_h_score != null ? (
                <span className="num min-w-16 border border-border bg-black/50 px-2 py-1 text-center font-semibold text-foreground">
                  {f.team_h_score} – {f.team_a_score}
                  {!f.finished && <span className="ml-1 text-blood">●</span>}
                </span>
              ) : (
                <span className="num min-w-16 text-center text-[11px] text-muted-foreground">{kickoff(f.kickoff_time)}</span>
              )}
              <span className="truncate">{name(f.team_a)}</span>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

export default function Dashboard() {
  const { fpl, isLoading, error, refetch } = useFpl();
  const [picked, setPicked] = useState<number | null>(null);

  if (isLoading) return <LoadingBlock className="h-[32rem]" />;
  if (error || !fpl) return <ErrorBlock onRetry={() => void refetch()} />;

  const gw = picked ?? fpl.gw;
  const event = fpl.events.find((e) => e.id === gw);
  const who = (id: number | null | undefined) => (id ? fpl.playerById.get(id) : undefined);
  const withTeam = (id: number | null | undefined) => {
    const p = who(id);
    return p ? `${fpl.teamById.get(p.team)?.short_name ?? ""} · ${p.selected_by_percent}% owned` : undefined;
  };
  const lastGw = Math.max(fpl.gw, fpl.next?.id ?? fpl.gw);

  return (
    <>
      <Hero fpl={fpl} />
      <SigilDivider />
      <GameweekPicker value={gw} onChange={setPicked} max={lastGw} live={fpl.current?.id} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <Stat label="Average score" value={event?.average_entry_score || "–"} hint="points per manager" />
        <Stat label="Highest score" value={event?.highest_score ?? "–"} hint="best single team" tone="blood" />
        <Stat label="Star player" value={who(event?.top_element)?.web_name ?? "–"} hint={event?.top_element_info ? `${event.top_element_info.points} points` : undefined} />
        <Stat label="Most captained" value={who(event?.most_captained)?.web_name ?? "–"} hint={withTeam(event?.most_captained)} />
        <Stat label="Most bought" value={who(event?.most_transferred_in)?.web_name ?? "–"} hint={withTeam(event?.most_transferred_in)} />
        <Stat label="Transfers made" value={event?.transfers_made ? compact(event.transfers_made) : "–"} hint="across all managers" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TeamOfTheWeek fpl={fpl} gw={gw} />
        <Results fpl={fpl} gw={gw} />
      </div>

      <SeasonCharts fpl={fpl} selected={gw} />
    </>
  );
}
