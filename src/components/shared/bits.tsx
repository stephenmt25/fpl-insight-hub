import type { ReactNode } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Headline number with a label; the default "is this even a chart?" answer. */
export function Stat({ label, value, hint, tone, className }: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "good" | "bad" | "blood";
  className?: string;
}) {
  return (
    <div className={cn("panel p-4", className)}>
      <p className="eyebrow">{label}</p>
      <p className={cn("num mt-2 truncate text-2xl font-semibold sm:text-3xl", tone === "good" && "text-good", tone === "bad" && "text-bad", tone === "blood" && "text-blood glow-blood", !tone && "text-foreground")}>
        {value}
      </p>
      {hint && <p className="mt-1 truncate text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Section({ title, eyebrow, action, children, className }: {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("panel p-4 sm:p-5", className)}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
          <h2 className="h-gothic text-2xl text-foreground">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function LoadingBlock({ className }: { className?: string }) {
  return <Skeleton className={cn("h-64 w-full", className)} />;
}

export function ErrorBlock({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="panel flex flex-col items-center gap-3 p-8 text-center">
      <AlertTriangle className="h-6 w-6 text-blood" />
      <p className="text-sm text-muted-foreground">{message ?? "Couldn't reach the FPL API. It may be updating between gameweeks."}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCw /> Retry
        </Button>
      )}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-10 text-center text-sm text-muted-foreground">{children}</p>;
}

export function GameweekPicker({ value, onChange, max, min = 1, live }: {
  value: number;
  onChange: (gw: number) => void;
  max: number;
  min?: number;
  live?: number;
}) {
  return (
    <div className="flex items-center justify-center gap-3">
      <Button variant="outline" size="icon" aria-label="Previous gameweek" disabled={value <= min} onClick={() => onChange(value - 1)}>
        <ChevronLeft />
      </Button>
      <div className="min-w-40 text-center">
        <p className="h-gothic chrome-text text-3xl">Gameweek {value}</p>
        <p className="eyebrow mt-1">
          {value === live ? <span className="text-blood">● current</span> : live && value < live ? "finished" : "upcoming"}
        </p>
      </div>
      <Button variant="outline" size="icon" aria-label="Next gameweek" disabled={value >= max} onClick={() => onChange(value + 1)}>
        <ChevronRight />
      </Button>
    </div>
  );
}

const FDR_CLASS: Record<number, string> = {
  1: "bg-emerald-600/80 text-white",
  2: "bg-emerald-700/60 text-emerald-50",
  3: "bg-zinc-600/50 text-zinc-100",
  4: "bg-rose-700/60 text-rose-50",
  5: "bg-rose-900/90 text-rose-50",
};

/** Fixture chip coloured on a diverging easy (green) to hard (red) scale; the number is always printed. */
export function FdrChip({ label, difficulty, className }: { label: string; difficulty: number; className?: string }) {
  return (
    <span
      className={cn("num inline-flex items-center justify-center gap-1 px-1.5 py-1 text-[10px] font-semibold", FDR_CLASS[difficulty] ?? FDR_CLASS[3], className)}
      title={`Difficulty ${difficulty} of 5`}
    >
      {label}
      <span className="opacity-70">{difficulty}</span>
    </span>
  );
}

export function PositionTag({ type }: { type: number }) {
  const label = { 1: "GKP", 2: "DEF", 3: "MID", 4: "FWD" }[type] ?? "";
  return <span className="num border border-border px-1 py-px text-[9px] uppercase tracking-wider text-muted-foreground">{label}</span>;
}

export function RankDelta({ rank, last }: { rank: number; last: number }) {
  if (!last || rank === last) return <span className="text-muted-foreground">–</span>;
  const up = rank < last;
  return <span className={cn("num text-xs", up ? "text-good" : "text-bad")}>{up ? "▲" : "▼"} {Math.abs(last - rank).toLocaleString("en-GB")}</span>;
}
