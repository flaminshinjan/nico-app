import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: {
          base: "var(--bg-base)",
          surface: "var(--bg-surface)",
          elevated: "var(--bg-elevated)",
          hover: "var(--bg-hover)",
          active: "var(--bg-active)",
        },
        line: {
          subtle: "var(--border-subtle)",
          DEFAULT: "var(--border-default)",
          strong: "var(--border-strong)",
        },
        content: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          tertiary: "var(--text-tertiary)",
          inverse: "var(--text-inverse)",
        },
        accent: {
          DEFAULT: "var(--accent-primary)",
          glow: "var(--accent-glow)",
          success: "var(--accent-success)",
          error: "var(--accent-error)",
          warning: "var(--accent-warning)",
        },
        bubble: {
          ai: "var(--ai-bubble-bg)",
          "ai-border": "var(--ai-bubble-border)",
          user: "var(--user-bubble-bg)",
          "user-border": "var(--user-bubble-border)",
        },
      },
      fontFamily: {
        display: ['"Instrument Serif"', "serif"],
        sans: ["Geist", "system-ui", "sans-serif"],
        mono: ['"Geist Mono"', '"Berkeley Mono"', "monospace"],
        serif: ["Lora", "Georgia", "serif"],
      },
      fontSize: {
        xs: ["11px", { lineHeight: "1.4" }],
        sm: ["12.5px", { lineHeight: "1.5" }],
        base: ["14px", { lineHeight: "1.6" }],
        md: ["15px", { lineHeight: "1.6" }],
        lg: ["18px", { lineHeight: "1.4" }],
        xl: ["22px", { lineHeight: "1.3" }],
        "2xl": ["28px", { lineHeight: "1.2" }],
        display: ["36px", { lineHeight: "1.1" }],
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
      },
      boxShadow: {
        sm: "0 1px 3px rgba(0,0,0,0.4)",
        md: "0 4px 16px rgba(0,0,0,0.5)",
        lg: "0 8px 32px rgba(0,0,0,0.6)",
        accent: "0 0 20px rgba(123,140,222,0.2)",
        success: "0 0 12px rgba(74,222,128,0.15)",
        page: "0 2px 40px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.04)",
      },
    },
  },
  plugins: [typography],
};
