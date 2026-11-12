/** Small deterministic k-means (k-means++ seeding, seeded RNG) for client-side clustering. */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const dist2 = (a: number[], b: number[]) => a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0);

/** Column-wise z-scores; constant columns become zeros. */
export function standardize(rows: number[][]): number[][] {
  if (rows.length === 0) return [];
  const dims = rows[0].length;
  const mean = Array.from({ length: dims }, (_, d) => rows.reduce((s, r) => s + r[d], 0) / rows.length);
  const sd = Array.from({ length: dims }, (_, d) => Math.sqrt(rows.reduce((s, r) => s + (r[d] - mean[d]) ** 2, 0) / rows.length));
  return rows.map((r) => r.map((v, d) => (sd[d] > 0 ? (v - mean[d]) / sd[d] : 0)));
}

export interface KMeansResult {
  assignments: number[];
  centroids: number[][];
  iterations: number;
}

export function kmeans(points: number[][], k: number, { seed = 7, maxIterations = 60 } = {}): KMeansResult {
  const n = points.length;
  k = Math.min(k, n);
  if (k === 0) return { assignments: [], centroids: [], iterations: 0 };
  const rand = mulberry32(seed);

  // k-means++: spread the initial centroids out
  const centroids: number[][] = [points[Math.floor(rand() * n)].slice()];
  while (centroids.length < k) {
    const d = points.map((p) => Math.min(...centroids.map((c) => dist2(p, c))));
    const total = d.reduce((s, v) => s + v, 0);
    let pick = rand() * total;
    let idx = 0;
    for (; idx < n - 1; idx++) {
      pick -= d[idx];
      if (pick <= 0) break;
    }
    centroids.push(points[idx].slice());
  }

  const assignments = new Array<number>(n).fill(-1);
  let iterations = 0;
  for (; iterations < maxIterations; iterations++) {
    let changed = false;
    for (let i = 0; i < n; i++) {
      let best = 0;
      let bestD = Infinity;
      for (let c = 0; c < k; c++) {
        const d = dist2(points[i], centroids[c]);
        if (d < bestD) { bestD = d; best = c; }
      }
      if (assignments[i] !== best) { assignments[i] = best; changed = true; }
    }
    if (!changed) break;
    for (let c = 0; c < k; c++) {
      const members = points.filter((_, i) => assignments[i] === c);
      if (members.length === 0) continue;
      centroids[c] = centroids[c].map((_, d) => members.reduce((s, m) => s + m[d], 0) / members.length);
    }
  }
  return { assignments, centroids, iterations };
}
