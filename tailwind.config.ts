import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // This maps the 'font-sans' class to the CSS variable we defined in layout.tsx
        sans: ["var(--font-roboto)", "sans-serif"],
      },
      colors: {
        // Custom Gov.gr palette
        gov: {
          blue: "#1b3d89", // Primary Brand Blue
          blueLight: "#1f5e90", // Lighter Blue for Hover/Active States
          cyan: "#00aeef", // Bright Cyan (Borders/Accents)
          gold: "#e6ac00", // Warning/Highlight
          text: "#1a1a1a", // Standard Dark Text
        },
      },
    },
  },
  plugins: [],
};
export default config;
