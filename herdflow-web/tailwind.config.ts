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
        navy: "#1B3A6B",
        green: "#2E7D32",
        gold: "#A07C3A",
        "gold-light": "#C9A55A",
        "green-light": "#4CAF50",
        cream: "#F9F6EE",
      },
    },
  },
};

export default config;
