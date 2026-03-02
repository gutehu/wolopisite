import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#0a0a0b",
        foreground: "#fafafa",
        muted: "#71717a",
        "muted-foreground": "#a1a1aa",
        border: "#27272a",
        card: "#18181b",
        "card-foreground": "#fafafa",
        primary: "#00d4aa",
        "primary-foreground": "#0a0a0b",
        secondary: "#06b6d4",
        accent: "#e11d48",
        "accent-2": "#8b5cf6",
        destructive: "#ef4444",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
