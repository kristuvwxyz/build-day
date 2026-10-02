import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Change these two to match your brand.
        brand: { DEFAULT: "#111827", light: "#374151" },
        accent: { DEFAULT: "#e11d48", light: "#fff1f2" },
      },
    },
  },
  plugins: [],
} satisfies Config;
