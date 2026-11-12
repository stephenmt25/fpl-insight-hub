import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

// Same-origin proxy to the public FPL API (it sends no CORS headers).
// Used by `npm run dev` and `npm run preview`; static hosts fall back to the
// Supabase edge proxy (see src/lib/fpl/client.ts).
const fplProxy = {
  "/fpl-api": {
    target: "https://fantasy.premierleague.com",
    changeOrigin: true,
    rewrite: (p: string) => p.replace(/^\/fpl-api/, "/api"),
    headers: { "User-Agent": "Mozilla/5.0 (fpl-insight-hub)" },
  },
};

export default defineConfig({
  // GitHub Pages serves the site from /<repo>/; everywhere else it lives at the root
  base: process.env.BASE_PATH ?? "/",
  server: { host: "::", port: 8080, proxy: fplProxy },
  preview: { port: 8080, proxy: fplProxy },
  plugins: [react()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) }, dedupe: ["react", "react-dom"] },
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("node_modules/three")) return "three";
          if (id.includes("node_modules/recharts") || id.includes("node_modules/d3-")) return "charts";
        },
      },
    },
  },
});
