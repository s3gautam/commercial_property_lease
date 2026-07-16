import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "media",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "muted-foreground": "var(--muted-foreground)",
        border: "var(--border)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        accent: "var(--accent)",
        "accent-2": "var(--accent-2)",
        "accent-foreground": "var(--accent-foreground)",
        ring: "var(--ring)",
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 3px 0 rgb(0 0 0 / 0.06)",
        card: "0 4px 12px -2px rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.04)",
        "card-hover": "0 12px 24px -6px rgb(0 0 0 / 0.12), 0 4px 8px -2px rgb(0 0 0 / 0.06)",
        glow: "0 0 0 1px rgb(99 102 241 / 0.1), 0 8px 24px -8px rgb(99 102 241 / 0.35)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      backgroundImage: {
        "accent-gradient": "linear-gradient(135deg, var(--accent), var(--accent-2))",
      },
    },
  },
  plugins: [],
};

export default config;
