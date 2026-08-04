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
        // "Cinema" is a second, deliberately separate palette for the
        // design-preview work (landing page, mission-control dashboard
        // mockup) — dark-mode-first, glassmorphic, cinematic. Kept apart
        // from `studio.*` (used by the other 55+ already-shipped pages) so
        // this can be reviewed and approved before anything is migrated
        // over, rather than half-reskinning the whole app in one pass.
        cinema: {
          charcoal: "#0B0B0F",
          black: "#050506",
          panel: "#141418",
          border: "#242430",
          red: "#E1272E",
          blue: "#3B82F6",
          orange: "#FF8A3D",
          white: "#F5F5F7",
          muted: "#9A9AA5",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
      },
      boxShadow: {
        soft: "0 2px 10px -2px rgb(30 27 46 / 0.08), 0 8px 24px -8px rgb(30 27 46 / 0.10)",
        glow: "0 8px 30px -8px rgb(109 93 251 / 0.45)",
        "cinema-glow": "0 0 0 1px rgb(255 255 255 / 0.06), 0 20px 60px -15px rgb(225 39 46 / 0.35)",
        "cinema-blue-glow": "0 0 0 1px rgb(255 255 255 / 0.06), 0 20px 60px -15px rgb(59 130 246 / 0.35)",
        "cinema-panel": "0 1px 0 0 rgb(255 255 255 / 0.04) inset, 0 20px 50px -20px rgb(0 0 0 / 0.6)",
      },
      backgroundImage: {
        "cinema-radial":
          "radial-gradient(1200px circle at 15% -10%, rgb(225 39 46 / 0.16), transparent 55%), " +
          "radial-gradient(900px circle at 100% 0%, rgb(59 130 246 / 0.14), transparent 55%), " +
          "radial-gradient(800px circle at 85% 100%, rgb(255 138 61 / 0.10), transparent 55%)",
      },
    },
  },
  plugins: [],
};

export default config;
