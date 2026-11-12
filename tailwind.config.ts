import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/utils/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "var(--bg-canvas)",
        card: "var(--bg-card)",
        sidebar: "var(--bg-sidebar)",
        topo: {
          dark: "var(--topo-dark)",
          mustard: "var(--topo-mustard)",
          terracotta: "var(--topo-terracotta)",
          green: "var(--topo-green)",
        },
        matrix: {
          header: "var(--matrix-blue-header)",
          sub: "var(--matrix-blue-sub)",
          light: "var(--matrix-blue-light)",
          border: "var(--matrix-border)",
        },
      },
      fontFamily: {
        sans: ["var(--font-nunito)", "system-ui", "sans-serif"],
        display: ["var(--font-quicksand)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        warm: "0 4px 20px -2px rgba(45, 42, 38, 0.06), 0 2px 6px -1px rgba(45, 42, 38, 0.04)",
        "warm-lg": "0 10px 30px -4px rgba(45, 42, 38, 0.1), 0 4px 12px -2px rgba(45, 42, 38, 0.05)",
      },
    },
  },
  plugins: [forms],
};

export default config;
