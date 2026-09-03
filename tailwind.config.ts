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
        'forest-green': '#0A3B21',
        'forest-green-light': '#165C38',
        'mountain-blue': '#1D3B55',
        'sunset-orange': '#F26D21',
        'sunset-amber': '#FF9F1C',
        'dark-charcoal': '#121212',
        'off-white': '#F4F4F9',
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "topographic": "url('/topo-bg.svg')",
      },
    },
  },
  plugins: [],
};
export default config;
