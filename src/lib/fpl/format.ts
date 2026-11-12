import type { Player } from "./types";

export const POSITIONS: Record<number, string> = { 1: "GKP", 2: "DEF", 3: "MID", 4: "FWD" };
export const positionLabel = (elementType: number) => POSITIONS[elementType] ?? "";

export const num = (v: string | number | null | undefined) => {
  const n = typeof v === "number" ? v : parseFloat(v ?? "");
  return Number.isFinite(n) ? n : 0;
};

/** FPL stores money in tenths of a million: 105 -> "£10.5m". */
export const price = (tenths: number | null | undefined) => `£${((tenths ?? 0) / 10).toFixed(1)}m`;

export const compact = (n: number | null | undefined) =>
  n == null ? "–" : Intl.NumberFormat("en-GB", { notation: "compact", maximumFractionDigits: 1 }).format(n);

export const int = (n: number | null | undefined) => (n == null ? "–" : Intl.NumberFormat("en-GB").format(n));

export const signed = (n: number, digits = 0) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n).toFixed(digits)}`;

export const fullName = (p: Player) => `${p.first_name} ${p.second_name}`;

export const per90 = (total: number, minutes: number) => (minutes > 0 ? (total / minutes) * 90 : 0);

const CHIP_NAMES: Record<string, string> = {
  wildcard: "Wildcard",
  freehit: "Free Hit",
  bboost: "Bench Boost",
  "3xc": "Triple Captain",
  manager: "Assistant Manager",
};
export const chipLabel = (name: string) => CHIP_NAMES[name] ?? name;

export function countdown(toIso: string, now = Date.now()) {
  const ms = Math.max(0, new Date(toIso).getTime() - now);
  const s = Math.floor(ms / 1000);
  return { days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60, done: ms === 0 };
}

export const shortDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) : "TBC";

export const kickoff = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "TBC";
