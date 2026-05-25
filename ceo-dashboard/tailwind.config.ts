import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#f5f5f4",
        ink: {
          50: "#fafaf9",
          100: "#f5f5f4",
          200: "#e7e5e4",
          300: "#d6d3d1",
          400: "#a8a29e",
          500: "#78716c",
          600: "#57534e",
          700: "#44403c",
          800: "#292524",
          900: "#1c1917",
        },
        ok:    { 50: "#ecfdf5", 600: "#059669", 700: "#047857" },
        warn:  { 50: "#fffbeb", 600: "#d97706", 700: "#b45309" },
        bad:   { 50: "#fef2f2", 600: "#dc2626", 700: "#b91c1c" },
        accent:{ 50: "#eff6ff", 600: "#2563eb", 700: "#1d4ed8" },
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Hiragino Sans",
          "Hiragino Kaku Gothic ProN",
          "Yu Gothic",
          "Meiryo",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
