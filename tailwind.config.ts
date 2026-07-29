import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        studio: {
          // Soft, warm neutrals instead of pure black/white — the page and
          // card backgrounds get a gentle tint rather than flat white/gray.
          paper: "#FAF9FF",
          ink: "#1E1B2E",
          // Dark-mode scale (kept violet-tinted to match the light palette
          // instead of the old cinematic near-black/red).
          950: "#131126",
          900: "#1B1832",
          800: "#26223F",
          700: "#332D52",
          // Primary brand color: vivid violet — the main call-to-action color.
          accent: "#6D5DFB",
          // Secondary/celebratory accent.
          gold: "#FFB020",
          // Role/category accent colors used for color-blocked badges, cards,
          // and each portal's identity in the shared shell.
          coral: "#FF6B6B",
          mint: "#14B8A6",
          sky: "#3AA9FF",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
      },
      boxShadow: {
        soft: "0 2px 10px -2px rgb(30 27 46 / 0.08), 0 8px 24px -8px rgb(30 27 46 / 0.10)",
        glow: "0 8px 30px -8px rgb(109 93 251 / 0.45)",
      },
    },
  },
  plugins: [],
};

export default config;
