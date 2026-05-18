import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: "#d4af37",
        "accent-dim": "rgba(212,175,55,0.2)",
        "accent-glow": "rgba(212,175,55,0.15)",
        "bg-primary": "#050508",
        "bg-card": "#0d0d12",
        "bg-card-hover": "#12121a",
        border: "#1a1a2e",
        "border-hover": "#2a2a4e",
        subtle: "#1a1a2e",
        muted: "#555566",
        "text-secondary": "#8a8a9a",
      },
      fontFamily: {
        sans: ["var(--font-space)", "Space Grotesk", "Inter", "system-ui", "sans-serif"],
        mono: [
          "var(--font-mono)",
          "JetBrains Mono",
          "Fira Code",
          "Consolas",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
