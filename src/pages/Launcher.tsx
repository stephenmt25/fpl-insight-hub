import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { APPS, CATEGORIES, suggestApps, type AppDef } from "@/apps";
import { Spotlight } from "@/components/layout/Spotlight";
import { Button } from "@/components/ui/button";
import { GUEST_ID, useAuth } from "@/lib/auth";
import { compact, countdown, int, kickoff } from "@/lib/fpl/format";
import { useFpl } from "@/lib/fpl/hooks";
import { HeroScene } from "@/three/lazy";
import { cn } from "@/lib/utils";

function useNow(intervalMs: number) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function AppTile({ app, locked, featured }: { app: AppDef; locked: boolean; featured?: boolean }) {
  return (
    <Link to={app.path}
      className={cn(
        "panel group flex items-center gap-3 p-3 transition-all duration-150 hover:-translate-y-0.5 hover:border-blood/70",
        featured && "flex-col items-start gap-4 p-4",
      )}>
      <span className={cn(
        "flex shrink-0 items-center justify-center border border-chrome/50 bg-gradient-to-b from-zinc-100 to-zinc-500 text-black transition-shadow group-hover:shadow-[0_0_28px_-6px_hsl(var(--blood))]",
        featured ? "h-14 w-14" : "h-11 w-11",
      )}>
        <app.icon className={featured ? "h-7 w-7" : "h-5 w-5"} />
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 text-base text-foreground">
          <span className="truncate">{app.name}</span>
          {locked && <Lock className="h-3 w-3 shrink-0 text-muted-foreground" aria-label="Needs sign-in" />}
        </span>
        <span className={cn("block text-xs text-muted-foreground", featured ? "line-clamp-2" : "truncate")}>{app.tagline}</span>
      </span>
    </Link>
  );
}

export default function Launcher() {
  const { fpl } = useFpl();
  const { managerId, manager, setDialogOpen, signIn } = useAuth();
  const now = useNow(1000);
  const next = fpl?.next ?? null;
  const c = next ? countdown(next.deadline_time, now) : null;
  const hoursToDeadline = next ? (new Date(next.deadline_time).getTime() - now) / 3_600_000 : null;
  const suggested = suggestApps({ signedIn: !!managerId, hoursToDeadline });
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Spotlight */}
      <section className="relative z-20 space-y-4 pt-2 text-center [text-shadow:0_1px_3px_#000]">
        <div className="pointer-events-none absolute inset-x-0 -top-4 bottom-0 -z-10 bg-[radial-gradient(ellipse_at_50%_55%,rgba(6,6,9,0.9)_0%,rgba(6,6,9,0.6)_45%,transparent_72%)]" aria-hidden />
        <div className="pointer-events-none mx-auto -mb-4 h-36 w-full max-w-md sm:h-44">
          <HeroScene />
        </div>
        <h1 className="chrome-text text-3xl uppercase tracking-[0.2em] sm:text-4xl">Insight Hub</h1>
        <p className="eyebrow">
          {fpl ? <>{fpl.current?.name ?? "Pre-season"} · {compact(fpl.bootstrap.total_players)} managers</> : "Loading the season…"}
          {next && c && !c.done && (
            <> · {next.name} deadline in <span className="num text-foreground">{c.days}d {pad(c.hours)}:{pad(c.minutes)}:{pad(c.seconds)}</span></>
          )}
        </p>
        <div className="relative z-20 mx-auto max-w-2xl">
          <Spotlight large />
        </div>
        {next && <p className="text-xs text-muted-foreground">Next deadline: {kickoff(next.deadline_time)}</p>}
      </section>

      {/* Suggested */}
      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Suggested</p>
            <h2 className="text-xl text-foreground">
              {manager ? `For ${manager.name}` : "Start here"}
              {hoursToDeadline != null && hoursToDeadline < 72 && hoursToDeadline > 0 && <span className="text-blood"> · deadline approaching</span>}
            </h2>
          </div>
          {manager ? (
            <p className="num text-right text-xs text-muted-foreground">
              <span className="text-foreground">{int(manager.summary_overall_points)}</span> pts · rank <span className="text-foreground">{int(manager.summary_overall_rank)}</span>
            </p>
          ) : (
            <div className="flex shrink-0 gap-2">
              <Button size="sm" className="btn-chrome" onClick={() => setDialogOpen(true)}>Sign in</Button>
              <Button size="sm" variant="outline" className="bg-black/40" onClick={() => void signIn(GUEST_ID)}>Guest</Button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {suggested.map((app) => <AppTile key={app.id} app={app} featured locked={!!app.needsManager && !managerId} />)}
        </div>
      </section>

      {/* Every app, by category */}
      {CATEGORIES.map((category) => {
        const apps = APPS.filter((a) => a.category === category.id);
        return (
          <section key={category.id} className="space-y-3">
            <div>
              <h2 className="text-xl text-foreground">{category.name}</h2>
              {category.blurb && <p className="text-xs text-muted-foreground">{category.blurb}</p>}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {apps.map((app) => <AppTile key={app.id} app={app} locked={!!app.needsManager && !managerId} />)}
            </div>
          </section>
        );
      })}
    </div>
  );
}
