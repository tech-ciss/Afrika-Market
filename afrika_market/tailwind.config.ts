import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Indigo de pagne : couleur de marque (texte fort, boutons, sections sombres).
        brand: {
          50: "#eef1fb",
          100: "#dde3f7",
          200: "#bcc7ee",
          300: "#93a3e1",
          400: "#6678cf",
          500: "#4358b9",
          600: "#33449b",
          700: "#25357d",
          800: "#1d2a63",
          900: "#172152",
          950: "#0e1536",
        },
        // Jaune cajou : accent chaud, réservé aux appels à l'action et aux repères.
        sun: {
          50: "#fff9e3",
          100: "#ffefb4",
          200: "#ffe07a",
          300: "#ffd04a",
          400: "#f7bc1c",
          500: "#dfa10b",
          600: "#b57a06",
          700: "#895808",
        },
        // Rouge kola : promotions uniquement.
        kola: {
          50: "#fdeeec",
          100: "#fad4cf",
          500: "#c8372d",
          600: "#a92a22",
          700: "#8a211b",
        },
        // Pierre : neutres légèrement chauds, sans tomber dans la crème.
        earth: {
          50: "#f7f7f5",
          100: "#efeeea",
          200: "#e1dfd8",
          300: "#c9c6bc",
          400: "#8a8779",
          500: "#6b685d",
          600: "#5c5a50",
          700: "#444239",
          800: "#2d2c26",
          900: "#1b1a16",
        },
        // Vert palme : origine, traçabilité, succès.
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
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 0 rgb(14 21 54 / 0.04)",
        lift: "0 18px 40px -22px rgb(14 21 54 / 0.45)",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(28px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "arch-in": {
          "0%": { opacity: "0", transform: "translateY(48px) scale(0.96)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        bump: {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.45)" },
          "100%": { transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "img-in": {
          "0%": { opacity: "0", transform: "scale(1.04)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        draw: {
          "0%": { strokeDashoffset: "26" },
          "100%": { strokeDashoffset: "0" },
        },
        "pop-in": {
          "0%": { opacity: "0", transform: "translateY(6px) scale(0.96)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },
      animation: {
        rise: "rise 0.8s cubic-bezier(0.22, 1, 0.36, 1) both",
        "arch-in": "arch-in 1s cubic-bezier(0.22, 1, 0.36, 1) both",
        marquee: "marquee 38s linear infinite",
        bump: "bump 0.45s ease-out",
        shimmer: "shimmer 1.6s linear infinite",
        "img-in": "img-in 0.7s cubic-bezier(0.22, 1, 0.36, 1) both",
        "pop-in": "pop-in 0.25s ease-out both",
        draw: "draw 0.7s ease-out 0.45s both",
      },
    },
  },
  plugins: [],
};

export default config;
