import type { Config } from "tailwindcss";

// Colors and fonts come from src/lib/theme.ts (edit them there, not here).
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: v("brand"), light: v("brand-hover") },
        accent: { DEFAULT: v("accent"), light: "rgb(var(--accent) / 0.08)" },
        page: v("bg"),
        surface: v("surface"),
        ink: v("text"),
      },
      fontFamily: {
        heading: "var(--font-heading)",
        body: "var(--font-body)",
      },
      borderRadius: {
        theme: "var(--radius)",
      },
    },
  },
  plugins: [],
} satisfies Config;
