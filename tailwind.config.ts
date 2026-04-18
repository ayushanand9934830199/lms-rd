import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Restless Dreamers brand tokens
        "rd-ink": "#0F0F0F",
        "rd-paper": "#FAFAF8",
        "rd-surface": "#FFFFFF",
        "rd-border": "#E4E4E0",
        "rd-muted": "#888884",
        "rd-accent": "#D97706",
        "rd-accent-lt": "#FEF3C7",
        "rd-accent-dk": "#92400E",
        "rd-success": "#16A34A",
        "rd-danger": "#DC2626",
        "rd-info": "#2563EB",
        "rd-warning": "#D97706",
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        body: ["DM Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Menlo", "monospace"],
      },
      borderRadius: {
        card: "8px",
        btn: "6px",
      },
      transitionDuration: {
        DEFAULT: "150ms",
      },
      maxWidth: {
        content: "1200px",
      },
      width: {
        sidebar: "240px",
        "lesson-sidebar": "280px",
        "filter-panel": "280px",
      },
    },
  },
  plugins: [animate],
};

export default config;
