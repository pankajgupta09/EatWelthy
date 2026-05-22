import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-poppins)", "sans-serif"],
      },
      colors: {
        brand: {
          green: "#16a34a",
          dark: "#1a1a2e",
        },
      },
    },
  },
  plugins: [],
};

export default config;
