// Smoke-tests every FPL endpoint the app uses, directly and through the Supabase edge proxy.
// Usage: npm run check:api
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  (() => { try { return readFileSync(new URL("../.env", import.meta.url), "utf8"); } catch { return ""; } })()
    .split(/\r?\n/).filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }),
);
const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? env.VITE_SUPABASE_PUBLISHABLE_KEY;
const MANAGER = "7788626";

const direct = (path) => fetch(`https://fantasy.premierleague.com/api${path}`, { headers: { "User-Agent": "Mozilla/5.0 (fpl-insight-hub)" } });
const edge = (path) =>
  fetch(`${SUPABASE_URL}/functions/v1/fpl-api-proxy`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    body: JSON.stringify({ endpoint: path }),
  });

const bootstrap = await (await direct("/bootstrap-static/")).json();
const gw = bootstrap.events.find((e) => e.is_current)?.id ?? 1;
const paths = [
  "/bootstrap-static/", "/fixtures/", "/event-status/", `/event/${gw}/live/`, `/dream-team/${gw}/`, "/element-summary/1/",
  `/entry/${MANAGER}/`, `/entry/${MANAGER}/history/`, `/entry/${MANAGER}/event/${gw}/picks/`, `/entry/${MANAGER}/transfers/`,
  "/leagues-classic/314/standings/",
];

let failures = 0;
for (const [name, call] of [["direct", direct], ...(SUPABASE_URL && SUPABASE_KEY ? [["edge", edge]] : [])]) {
  console.log(`\n${name === "direct" ? "FPL API (direct)" : "Supabase edge proxy"}`);
  for (const path of paths) {
    const start = Date.now();
    let status = 0;
    try {
      const res = await call(path);
      status = res.status;
      if (res.ok) await res.json();
    } catch { /* network error: status stays 0 */ }
    const ok = status === 200;
    if (!ok && name === "direct") failures++;
    console.log(`  ${ok ? "OK  " : "FAIL"} ${String(status).padEnd(3)} ${String(Date.now() - start).padStart(5)} ms  ${path}`);
  }
}
console.log(failures ? `\n${failures} direct endpoint(s) failed` : "\nAll direct endpoints OK");
process.exit(failures ? 1 : 0);
