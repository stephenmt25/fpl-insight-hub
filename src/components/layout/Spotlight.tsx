import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CornerDownLeft, Search, Trophy, User, UserRound, type LucideIcon } from "lucide-react";
import { APPS, CATEGORIES, type AppDef } from "@/apps";
import { useAuth } from "@/lib/auth";
import { fullName, positionLabel, price } from "@/lib/fpl/format";
import { useFpl } from "@/lib/fpl/hooks";
import { cn } from "@/lib/utils";

interface Result {
  key: string;
  group: "Apps" | "Players" | "Actions";
  icon: LucideIcon;
  title: string;
  detail: string;
  run: () => void;
}

/** Rank an app against the query: name prefix beats name match beats keyword match. */
function scoreApp(app: AppDef, q: string) {
  const name = app.name.toLowerCase();
  if (name.startsWith(q)) return 3;
  if (name.includes(q)) return 2;
  const category = CATEGORIES.find((c) => c.id === app.category)?.name.toLowerCase() ?? "";
  if (`${app.tagline} ${app.keywords} ${category}`.toLowerCase().includes(q)) return 1;
  return 0;
}

/**
 * Spotlight search: apps, players and quick actions from one box.
 * `fallback` is shown under the box when the query is empty (overlay use).
 */
export function Spotlight({ autoFocus, onDone, large, fallback }: {
  autoFocus?: boolean;
  onDone?: () => void;
  large?: boolean;
  fallback?: AppDef[];
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  const { fpl } = useFpl();
  const { signIn } = useAuth();
  const listRef = useRef<HTMLUListElement>(null);

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase();
    const go = (to: string) => () => { navigate(to); onDone?.(); };
    const appResult = (app: AppDef): Result => ({ key: `app-${app.id}`, group: "Apps", icon: app.icon, title: app.name, detail: app.tagline, run: go(app.path) });
    if (!q) return (fallback ?? []).map(appResult);

    const apps = APPS.map((app) => ({ app, score: scoreApp(app, q) })).filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 6).map((x) => appResult(x.app));

    const players: Result[] = q.length < 2 || !fpl ? [] : fpl.players
      .filter((p) => p.web_name.toLowerCase().includes(q) || fullName(p).toLowerCase().includes(q))
      .sort((a, b) => Number(b.web_name.toLowerCase().startsWith(q)) - Number(a.web_name.toLowerCase().startsWith(q)) || b.total_points - a.total_points)
      .slice(0, 6)
      .map((p) => ({
        key: `player-${p.id}`, group: "Players", icon: UserRound, title: p.web_name,
        detail: `${fpl.teamById.get(p.team)?.name ?? ""} · ${positionLabel(p.element_type)} · ${price(p.now_cost)} · ${p.total_points} pts`,
        run: go(`/players?player=${p.id}`),
      }));

    const actions: Result[] = [];
    if (/^\d{1,10}$/.test(q)) {
      actions.push({ key: "manager", group: "Actions", icon: User, title: `Load FPL team ${q}`, detail: "Sign in with this manager ID", run: () => { void signIn(q).then((ok) => ok && navigate("/squad")); onDone?.(); } });
      actions.push({ key: "league", group: "Actions", icon: Trophy, title: `Open league ${q}`, detail: "Classic league standings by ID", run: go(`/leagues?id=${q}`) });
    }
    return [...apps, ...players, ...actions];
  }, [query, fpl, fallback, navigate, onDone, signIn]);

  useEffect(() => setActive(0), [query]);
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && results[active]) { e.preventDefault(); results[active].run(); setQuery(""); }
    else if (e.key === "Escape" && query) { e.stopPropagation(); setQuery(""); }
  };

  const open = results.length > 0 || query.trim().length > 0;
  let lastGroup = "";

  return (
    <div className="relative w-full">
      <div className={cn("panel flex items-center gap-3 !rounded-full px-5", large ? "h-16" : "h-14")}>
        <Search className={cn("shrink-0 text-muted-foreground", large ? "h-6 w-6" : "h-5 w-5")} />
        <input
          autoFocus={autoFocus}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded={open}
          aria-controls="spotlight-results"
          aria-label="Search apps, players, or type an FPL or league ID"
          placeholder="Search apps and players, or type a team or league ID"
          className={cn("h-full w-full bg-transparent text-foreground outline-none placeholder:text-muted-foreground", large ? "text-xl" : "text-base")}
        />
        <kbd className="hidden shrink-0 rounded-md border border-white/15 px-1.5 py-0.5 text-[10px] text-muted-foreground sm:block">Ctrl K</kbd>
      </div>

      {open && (
        <ul id="spotlight-results" ref={listRef} role="listbox"
          className={cn("z-30 mt-2 max-h-[60dvh] w-full overflow-y-auto rounded-2xl border border-white/10 bg-popover/95 py-1 shadow-2xl backdrop-blur-xl", large && "absolute")}>
          {results.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted-foreground">Nothing matches “{query}”.</li>}
          {results.map((r, i) => {
            const header = r.group !== lastGroup;
            lastGroup = r.group;
            return (
              <li key={r.key} role="presentation">
                {header && <p className="eyebrow px-4 pb-1 pt-3">{r.group}</p>}
                <button role="option" aria-selected={i === active} data-index={i} onMouseEnter={() => setActive(i)} onClick={() => { r.run(); setQuery(""); }}
                  className={cn("flex w-full items-center gap-3 px-4 py-2 text-left", i === active && "bg-blood/15")}>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/40"><r.icon className="h-4 w-4 text-chrome" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-foreground">{r.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">{r.detail}</span>
                  </span>
                  {i === active && <CornerDownLeft className="h-4 w-4 shrink-0 text-muted-foreground" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
