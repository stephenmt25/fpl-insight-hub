import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Eye, EyeOff, Goal, Hammer } from "lucide-react";
import { toast } from "sonner";
import { mayhem } from "@/lib/mayhem";
import { cn } from "@/lib/utils";

function Meter({ label, value, tone }: { label: string; value: number; tone: "blood" | "good" | "warn" | "bad" }) {
  const percent = Math.round(value * 100);
  const fill = { blood: "bg-blood", good: "bg-good", warn: "bg-warn", bad: "bg-bad" }[tone];
  return (
    <div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">{label}</span>
        <span className="num text-foreground">{percent}%</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${label} ${percent}%`}>
        <div className={cn("h-full rounded-full transition-[width] duration-150", fill)} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

/**
 * Scores a goal in the stadium behind the page. Keep scoring and the
 * celebrations get out of hand: the cathedral starts shedding masonry, crews
 * run out to put it back, and if you outpace them the great tower comes down
 * and scoring is locked until it has been rebuilt.
 */
export function ScoreButton() {
  const state = useSyncExternalStore(mayhem.subscribe, mayhem.getState);
  const [watching, setWatching] = useState(false);
  const previous = useRef(state.phase);

  useEffect(() => {
    if (state.phase === previous.current) return;
    if (state.phase === "collapsing") toast("The great tower has fallen", { description: "Scoring is suspended while the crews rebuild it." });
    if (state.phase === "standing" && previous.current === "rebuilding") toast.success("Cathedral rebuilt", { description: "Go again." });
    previous.current = state.phase;
  }, [state.phase]);

  // "Watch" fades the app out so the stadium can be seen
  useEffect(() => {
    document.documentElement.toggleAttribute("data-watching", watching);
    return () => document.documentElement.removeAttribute("data-watching");
  }, [watching]);

  // Hidden until the scene is running (it never is under reduced motion or without WebGL)
  if (!state.ready) return null;

  const standing = state.phase === "standing";
  const rebuilding = state.phase === "rebuilding";
  const showStatus = !standing || state.goals > 0 || state.integrity < 1;
  const integrityTone = state.integrity > 0.66 ? "good" : state.integrity > 0.33 ? "warn" : "bad";
  const WatchIcon = watching ? EyeOff : Eye;

  return (
    <div className="fixed bottom-24 right-3 z-40 flex flex-col items-end gap-2 md:bottom-5 md:right-5">
      <p className="sr-only" aria-live="polite">
        {standing ? "" : rebuilding ? "The tower is being rebuilt." : "The great tower has fallen."}
      </p>

      {showStatus && (
        <div className="panel w-48 space-y-2 p-3 text-xs">
          {standing ? (
            <>
              <div className="flex items-baseline justify-between">
                <span className="eyebrow">Streak</span>
                <span className="num text-lg leading-none text-foreground">×{state.goals}</span>
              </div>
              <Meter label="Heat" value={state.heat} tone="blood" />
              <Meter label="Still standing" value={state.integrity} tone={integrityTone} />
            </>
          ) : rebuilding ? (
            <>
              <p className="eyebrow">Crews on site</p>
              <Meter label="Rebuilt" value={state.rebuild} tone="warn" />
            </>
          ) : (
            <p className="text-center text-foreground">The tower is down.</p>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setWatching((w) => !w)}
          aria-pressed={watching}
          aria-label={watching ? "Show the app" : "Hide the app and watch the stadium"}
          title={watching ? "Show the app" : "Watch the stadium"}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-background/80 text-muted-foreground backdrop-blur-xl transition-colors hover:text-foreground"
        >
          <WatchIcon className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={() => mayhem.score()}
          disabled={!standing}
          title="Score a goal. Keep scoring and the cathedral starts to come apart."
          className={cn(
            "relative flex h-14 items-center gap-2 overflow-hidden rounded-full px-6 text-sm font-semibold uppercase tracking-[0.2em] text-white transition-transform",
            standing ? "bg-blood active:scale-90" : "cursor-not-allowed bg-muted text-muted-foreground",
          )}
          style={
            standing
              ? {
                  boxShadow: `0 0 ${14 + state.heat * 46}px hsl(var(--blood) / ${0.4 + state.heat * 0.5})`,
                  animation: state.heat > 0.45 ? `score-shudder ${0.32 - state.heat * 0.14}s linear infinite` : undefined,
                }
              : undefined
          }
        >
          {rebuilding && <span className="absolute inset-y-0 left-0 bg-warn/25" style={{ width: `${state.rebuild * 100}%` }} aria-hidden />}
          {standing ? <Goal className="relative h-5 w-5" /> : <Hammer className="relative h-5 w-5" />}
          <span className="relative">
            {standing ? "Score" : rebuilding ? `Rebuilding ${Math.round(state.rebuild * 100)}%` : "Tower down"}
          </span>
        </button>
      </div>
    </div>
  );
}
