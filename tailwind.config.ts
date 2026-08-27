import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#151313",
        panel: "#1D1A18",
        border: "#2A2724",
        ivory: "#F5F1EA",
        muted: "#A79E92",
        safelight: "#E8492E",
        gold: "#C9A227",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
