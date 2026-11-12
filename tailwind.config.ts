import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1rem", screens: { "2xl": "1320px" } },
    extend: {
      fontFamily: {
        sans: ['"Chakra Petch"', "system-ui", "sans-serif"],
        gothic: ['"Grenze Gotisch"', "serif"],
        fraktur: ['"UnifrakturCook"', '"Grenze Gotisch"', "serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        blood: "hsl(var(--blood))",
        chrome: "hsl(var(--chrome))",
        good: "hsl(var(--good))",
        warn: "hsl(var(--warn))",
        bad: "hsl(var(--bad))",
      },
      borderRadius: { lg: "var(--radius)", md: "var(--radius)", sm: "var(--radius)" },
      keyframes: {
        sheen: { "0%": { backgroundPosition: "200% 0" }, "100%": { backgroundPosition: "-200% 0" } },
        rise: { from: { opacity: "0", transform: "translateY(10px)" }, to: { opacity: "1", transform: "none" } },
      },
      animation: { sheen: "sheen 6s linear infinite", rise: "rise .45s ease-out both" },
    },
  },
  plugins: [animate],
} satisfies Config;
