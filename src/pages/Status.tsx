import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, RotateCw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section, Stat } from "@/components/shared/bits";
import { PageHeader } from "@/components/shared/ornaments";
import { GUEST_ID } from "@/lib/auth";
import { fplGet, type Transport } from "@/lib/fpl/client";
import { useFpl } from "@/lib/fpl/hooks";
import { cn } from "@/lib/utils";

interface Check { name: string; path: string }
interface Result { ok: boolean; ms: number; detail: string }

const size = (data: unknown) => {
  if (Array.isArray(data)) return `${data.length} items`;
  if (data && typeof data === "object") return `${Object.keys(data).length} keys`;
  return typeof data;
};

async function probe(path: string, transport: Transport): Promise<Result> {
  const start = performance.now();
  try {
    const data = await fplGet<unknown>(path, transport);
    return { ok: true, ms: Math.round(performance.now() - start), detail: size(data) };
  } catch (e) {
    return { ok: false, ms: Math.round(performance.now() - start), detail: e instanceof Error ? e.message : "failed" };
  }
}

const TRANSPORTS: { id: Transport; label: string; note: string }[] = [
  { id: "local", label: "Same-origin proxy", note: "/fpl-api (dev server, preview, or a host rewrite)" },
  { id: "edge", label: "Supabase edge function", note: "fpl-api-proxy (fallback for static hosting)" },
];

export default function Status() {
  const { fpl } = useFpl();
  const gw = fpl?.gw ?? 1;
  const [results, setResults] = useState<Record<string, Result | "pending">>({});
  const [running, setRunning] = useState(false);

  const checks: Check[] = [
    { name: "Bootstrap (players, teams, gameweeks)", path: "/bootstrap-static/" },
    { name: "Fixtures", path: "/fixtures/" },
    { name: "Event status", path: "/event-status/" },
    { name: "Live gameweek points", path: `/event/${gw}/live/` },
    { name: "Team of the week", path: `/dream-team/${gw}/` },
    { name: "Player summary", path: "/element-summary/1/" },
    { name: "Manager profile", path: `/entry/${GUEST_ID}/` },
    { name: "Manager history", path: `/entry/${GUEST_ID}/history/` },
    { name: "Manager picks", path: `/entry/${GUEST_ID}/event/${gw}/picks/` },
    { name: "Manager transfers", path: `/entry/${GUEST_ID}/transfers/` },
    { name: "League standings", path: "/leagues-classic/314/standings/" },
  ];

  const run = useCallback(async () => {
    setRunning(true);
    setResults({});
    await Promise.all(
      TRANSPORTS.flatMap((t) =>
        checks.map(async (c) => {
          const key = `${t.id}:${c.path}`;
          setResults((r) => ({ ...r, [key]: "pending" }));
          const result = await probe(c.path, t.id);
          setResults((r) => ({ ...r, [key]: result }));
        }),
      ),
    );
    setRunning(false);
  }, [gw]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (fpl) void run();
  }, [fpl, run]);

  const done = Object.values(results).filter((r): r is Result => r !== "pending");
  const tally = (id: Transport) => {
    const mine = Object.entries(results).filter(([k, r]) => k.startsWith(id) && r !== "pending").map(([, r]) => r as Result);
    return { ok: mine.filter((r) => r.ok).length, total: mine.length };
  };

  return (
    <>
      <PageHeader eyebrow="Live diagnostics" title="System Status">
        Every FPL endpoint the app uses, called through both transports from your browser.
      </PageHeader>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {TRANSPORTS.map((t) => {
          const { ok, total } = tally(t.id);
          return <Stat key={t.id} label={t.label} value={total ? `${ok}/${total}` : "…"} tone={total === 0 ? undefined : ok === total ? "good" : ok === 0 ? "bad" : undefined} hint={ok === 0 && total > 0 ? "not available here" : "endpoints responding"} />;
        })}
        <Stat label="Median response" value={done.length ? `${[...done].sort((a, b) => a.ms - b.ms)[Math.floor(done.length / 2)].ms} ms` : "…"} />
        <div className="panel flex items-center justify-center p-4">
          <Button variant="outline" onClick={() => void run()} disabled={running}><RotateCw className={cn(running && "animate-spin")} /> Run again</Button>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {TRANSPORTS.map((t) => (
          <Section key={t.id} eyebrow={t.note} title={t.label}>
            <ul className="divide-y divide-border">
              {checks.map((c) => {
                const r = results[`${t.id}:${c.path}`];
                return (
                  <li key={c.path} className="flex items-center gap-3 py-2 text-sm">
                    {!r || r === "pending" ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                      : r.ok ? <CheckCircle2 className="h-4 w-4 shrink-0 text-good" /> : <XCircle className="h-4 w-4 shrink-0 text-bad" />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate">{c.name}</p>
                      <p className="num truncate text-[10px] text-muted-foreground">{c.path}</p>
                    </div>
                    {r && r !== "pending" && (
                      <span className="num shrink-0 text-right text-xs text-muted-foreground">
                        <span className={r.ok ? "text-foreground" : "text-bad"}>{r.ok ? "OK" : "FAIL"}</span> · {r.ms} ms<br />{r.detail}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </Section>
        ))}
      </div>
      <p className="text-center text-xs text-muted-foreground">
        The app only needs one transport to work. If the edge function rejects <span className="num">/fixtures/</span>, redeploy <span className="num">supabase/functions/fpl-api-proxy</span>; until then fixtures are rebuilt from player summaries.
      </p>
    </>
  );
}
