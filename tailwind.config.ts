import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: "#1a1a1a",
          sidebar: "#2a2a2a",
          card: "#333333",
          text: "#ffffff",
          textSecondary: "#a0a0a0",
        },
      },
    },
  },
  plugins: [],
};
export default config;

