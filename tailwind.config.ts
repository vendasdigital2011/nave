import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navetech: {
          50: "#FFF7F1",
          100: "#FFF4EC",
          200: "#FFD0A8",
          300: "#FFA86B",
          400: "#FF8A1F",
          500: "#FF6A00", // Laranja Oficial Navetech
          600: "#FF7A00",
          700: "#E85C00",
          800: "#CC4F00",
          900: "#803200",
        },
        surface: "#F8FAFC",
        border: "#E2E8F0",
        divider: "#CBD5E1",
        primary: {
          DEFAULT: "#FF6A00",
          hover: "#E85C00",
          foreground: "#FFFFFF",
        },
        funnel: {
          frio: "#94A3B8",
          morno: "#F59E0B",
          quente: "#FF6A00",
          vendido: "#22C55E",
        },
      },
      borderRadius: {
        lg: "0.625rem",
        md: "calc(0.625rem - 2px)",
        sm: "calc(0.625rem - 4px)",
      },
    },
  },
  plugins: [],
};
export default config;
