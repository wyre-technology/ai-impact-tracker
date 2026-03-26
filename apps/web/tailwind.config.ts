import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        wyre: {
          50: "#eef4ff",
          100: "#d9e5ff",
          200: "#bcd2ff",
          300: "#8eb5ff",
          400: "#598dff",
          500: "#3366ff",
          600: "#1a44f5",
          700: "#1333e1",
          800: "#162cb6",
          900: "#182a8f",
          950: "#131c57",
        },
        dark: {
          bg: "#0f1117",
          card: "#1a1d2e",
          border: "#2a2d3e",
          hover: "#252840",
        },
      },
    },
  },
  plugins: [],
};

export default config;
