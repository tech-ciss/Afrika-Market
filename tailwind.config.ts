import type { Config } from "tailwindcss";

/**
 * Identité visuelle AFRIKA MARKET
 *  - brand  : indigo profond (teintures bogolan / adire) → actions, liens, prix
 *  - sun    : safran / or de kente → accent unique, mise en avant
 *  - kola   : rouge kola → promotions et alertes
 *  - forest : vert feuille → origine, disponibilité
 *  - earth  : neutres chauds → texte, bordures, fonds
 * Contrastes vérifiés WCAG AA (≥ 4,5:1) pour les couples texte/fond usuels.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#F2F3FB",
          100: "#E4E6F6",
          200: "#C9CDEC",
          300: "#A0A7DA",
          400: "#7380C6",
          500: "#525FAF",
          600: "#414B98",
          700: "#333C7C",
          800: "#272E60",
          900: "#1C2147",
          950: "#12152E",
        },
        sun: {
          50: "#FFF8E6",
          100: "#FEEDBD",
          200: "#FCDB85",
          300: "#F9C74B",
          400: "#F4B320",
          500: "#D9990F",
          600: "#B07A0A",
          700: "#8A5F0D",
        },
        kola: {
          50: "#FEF2F0",
          100: "#FDE0DB",
          500: "#D4402F",
          600: "#BA3022",
          700: "#9A271B",
        },
        forest: {
          50: "#EFF7F2",
          100: "#D8EBDF",
          200: "#B2D6BF",
          300: "#84BA9A",
          400: "#55996F",
          500: "#347F53",
          600: "#266742",
          700: "#1F5436",
          800: "#1A432C",
          900: "#153623",
        },
        earth: {
          50: "#F7F6F3",
          100: "#EEECE7",
          200: "#DEDAD2",
          300: "#C6C1B6",
          400: "#76716A",
          500: "#66615A",
          600: "#57534D",
          700: "#46433E",
          800: "#34322E",
          900: "#23221F",
        },
      },
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-heading)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgb(18 21 46 / 0.04), 0 10px 30px -14px rgb(18 21 46 / 0.22)",
      },
      keyframes: {
        rise: {
          from: { opacity: "0", transform: "translateY(18px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        rise: "rise 0.8s cubic-bezier(0.2, 0.7, 0.2, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
