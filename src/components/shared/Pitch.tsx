import { cn } from "@/lib/utils";

export interface PitchPlayer {
  id: number;
  name: string;
  team: string;
  /** 1 GKP … 4 FWD */
  type: number;
  points: number | string;
  badge?: "C" | "V" | "TC" | "★";
  flag?: string;
  dim?: boolean;
}

function Token({ p }: { p: PitchPlayer }) {
  return (
    <div className={cn("relative flex w-[4.6rem] flex-col items-center text-center sm:w-24", p.dim && "opacity-50")} title={p.flag}>
      <div
        className="relative flex h-10 w-10 items-center justify-center border border-chrome/60 bg-gradient-to-b from-zinc-200 to-zinc-500 text-[10px] font-semibold text-black sm:h-12 sm:w-12 sm:text-[11px]"
        style={{ clipPath: "polygon(50% 0, 100% 22%, 100% 70%, 50% 100%, 0 70%, 0 22%)" }}
      >
        {p.team}
      </div>
      {p.badge && (
        <span className="absolute -top-1 right-2 flex h-4 min-w-4 items-center justify-center bg-blood px-0.5 text-[9px] font-bold text-white sm:right-5">
          {p.badge}
        </span>
      )}
      {p.flag && <span className="absolute -top-1 left-2 h-2.5 w-2.5 bg-warn sm:left-5" aria-label={p.flag} />}
      <span className="mt-1 w-full truncate bg-black/70 px-1 text-[11px] font-medium text-foreground sm:text-xs">{p.name}</span>
      <span className="num w-full bg-chrome/90 text-[11px] font-semibold text-black">{p.points}</span>
    </div>
  );
}

/** Players laid out by position on a pitch, forwards at the top. */
export function Pitch({ starters, bench, className }: { starters: PitchPlayer[]; bench?: PitchPlayer[]; className?: string }) {
  const rows = [4, 3, 2, 1].map((type) => starters.filter((p) => p.type === type));
  return (
    <div className={className}>
      <div className="pitch flex min-h-[26rem] flex-col justify-around gap-3 px-1 py-6 sm:min-h-[30rem]">
        {rows.map((row, i) => (
          <div key={i} className="relative z-10 flex justify-center gap-1 sm:gap-6">
            {row.map((p) => <Token key={p.id} p={p} />)}
          </div>
        ))}
      </div>
      {bench && bench.length > 0 && (
        <div className="mt-2 rounded-2xl border border-white/10 bg-black/40 p-3">
          <p className="eyebrow mb-2 text-center">Bench</p>
          <div className="flex justify-center gap-1 sm:gap-6">
            {bench.map((p) => <Token key={p.id} p={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}
