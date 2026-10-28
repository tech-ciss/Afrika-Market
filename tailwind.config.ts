import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fdf6ec",
          100: "#fae9cf",
          200: "#f4d099",
          300: "#edb063",
          400: "#e68c3c",
          500: "#e07526",
          600: "#c75a1c",
          700: "#a5441a",
          800: "#86381c",
          900: "#6d301a",
          950: "#3b170c",
        },
        earth: {
          50: "#f6f3ee",
          100: "#eae3d7",
          200: "#d6c7b1",
          300: "#bfa587",
          400: "#a98765",
          500: "#987353",
          600: "#8b6348",
          700: "#74513e",
          800: "#604437",
          900: "#4f392f",
        },
        forest: {
          50: "#f0f7f1",
          100: "#dcecdf",
          200: "#bad9c2",
          300: "#8dbf9d",
          400: "#5da075",
          500: "#3d8459",
          600: "#2c6946",
          700: "#24543a",
          800: "#204330",
          900: "#1b3829",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgb(0 0 0 / 0.04), 0 8px 24px -12px rgb(0 0 0 / 0.18)",
      },
    },
  },
  plugins: [],
};

export default config;
