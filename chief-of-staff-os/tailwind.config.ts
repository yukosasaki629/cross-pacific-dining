import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f7f7f6",
          100: "#eeedeb",
          200: "#d8d6d2",
          300: "#bab7b1",
          400: "#8f8b84",
          500: "#6b6862",
          600: "#4f4d48",
          700: "#3a3835",
          800: "#252422",
          900: "#161514",
        },
        accent: {
          50: "#f3f6f8",
          100: "#e3eaef",
          500: "#456680",
          600: "#365168",
          700: "#283d4f",
        },
        risk: {
          low: "#5b8a72",
          med: "#b58a2a",
          high: "#a8453a",
        },
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        serif: ["ui-serif", "Georgia", "Cambria", "serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(20,20,20,0.04), 0 1px 4px rgba(20,20,20,0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
