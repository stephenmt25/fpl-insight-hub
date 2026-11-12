export interface FormForecast {
  /** Points per gameweek, oldest first. */
  history: number[];
  /** Exponentially weighted recent average. */
  level: number;
  /** Least-squares slope over the recent window, in points per gameweek. */
  slope: number;
  /** Mean of the last three minus the three before. */
  momentum: number;
  /** Standard deviation of the recent window. */
  volatility: number;
  trend: "rising" | "falling" | "stable";
  /** Next gameweeks: expected points with a ±1σ band. */
  forecast: { step: number; points: number; low: number; high: number }[];
  confidence: "high" | "medium" | "low";
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((s, v) => s + v, 0) / xs.length : 0);

export function ewma(xs: number[], alpha = 0.4) {
  if (xs.length === 0) return 0;
  return xs.slice(1).reduce((level, x) => alpha * x + (1 - alpha) * level, xs[0]);
}

export function slope(ys: number[]) {
  const n = ys.length;
  if (n < 2) return 0;
  const xBar = (n - 1) / 2;
  const yBar = mean(ys);
  let numer = 0;
  let denom = 0;
  ys.forEach((y, x) => {
    numer += (x - xBar) * (y - yBar);
    denom += (x - xBar) ** 2;
  });
  return numer / denom;
}

/**
 * Forecast from a player's real per-gameweek points: a damped linear trend on
 * top of an exponentially weighted level, scaled by upcoming fixture difficulty
 * (2 = easy … 5 = hard; 3 is neutral).
 */
export function forecastForm(history: number[], upcomingDifficulty: number[] = [], horizon = 3, window = 6): FormForecast {
  const recent = history.slice(-window);
  // Shrink the recent level towards the season average so one haul doesn't dominate
  const level = 0.7 * ewma(recent) + 0.3 * mean(history);
  const b = slope(recent);
  const avg = mean(recent);
  const volatility = Math.sqrt(mean(recent.map((v) => (v - avg) ** 2)));
  const momentum = recent.length >= 4 ? mean(recent.slice(-3)) - mean(recent.slice(-6, -3)) : 0;

  const trend = b > 0.35 ? "rising" : b < -0.35 ? "falling" : "stable";
  const forecast = Array.from({ length: horizon }, (_, i) => {
    const step = i + 1;
    // The trend is damped so a hot streak isn't extrapolated forever
    const damped = b * (1 - 0.6 ** step) / 0.4 * 0.5;
    const fixture = 1 + (3 - (upcomingDifficulty[i] ?? 3)) * 0.12;
    const points = Math.max(0, (level + damped) * fixture);
    const band = volatility * (0.7 + 0.15 * step);
    return { step, points: +points.toFixed(2), low: +Math.max(0, points - band).toFixed(2), high: +(points + band).toFixed(2) };
  });

  const cv = avg > 0 ? volatility / avg : 2;
  const confidence = recent.length >= 5 && cv < 0.45 ? "high" : recent.length >= 4 && cv < 0.9 ? "medium" : "low";
  return { history, level, slope: b, momentum, volatility, trend, forecast, confidence };
}
