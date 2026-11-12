import type { ReactNode } from "react";
import { ResponsiveContainer } from "recharts";

/**
 * Categorical series colours, assigned in this fixed order and never cycled.
 * Validated on the dark surface for lightness band, chroma, contrast and
 * adjacent-pair colour-blind separation.
 */
export const SERIES = ["#e11d48", "#0b96d4", "#d97706", "#8b5cf6", "#0ea371", "#6d7fd6", "#65a30d", "#db2777"] as const;

/** Neutral reference series (averages, baselines): reads as context, not as a category. */
export const REFERENCE = "#8d93a3";

export const GRID = "hsl(232 9% 16%)";
export const AXIS = { stroke: "hsl(232 9% 24%)", tick: { fill: "hsl(226 9% 62%)", fontSize: 11, fontFamily: "JetBrains Mono, monospace" }, tickLine: false } as const;

interface TooltipEntry { name?: string | number; value?: number | string; color?: string; dataKey?: string | number }

/** Shared tooltip: values in primary ink, series identity carried by the swatch. */
export function ChartTooltip({ active, payload, label, labelPrefix = "", format }: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  labelPrefix?: string;
  format?: (value: number, key: string) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="border border-border bg-popover/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      <p className="eyebrow mb-1.5">{labelPrefix}{label}</p>
      {payload.filter((p) => p.value != null).map((p) => (
        <div key={String(p.dataKey)} className="flex items-center gap-2 py-px">
          <span className="h-2 w-2 shrink-0" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="num ml-auto pl-4 font-semibold text-foreground">
            {typeof p.value === "number" ? (format ? format(p.value, String(p.dataKey)) : p.value.toLocaleString("en-GB", { maximumFractionDigits: 2 })) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ChartFrame({ height = 280, children }: { height?: number; children: ReactNode }) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        {children as React.ReactElement}
      </ResponsiveContainer>
    </div>
  );
}

export function Legend({ items }: { items: { label: string; color: string; dashed?: boolean }[] }) {
  return (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-0.5 w-4" style={item.dashed ? { borderTop: `2px dashed ${item.color}` } : { background: item.color, height: 3 }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}
