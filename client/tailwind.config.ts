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
        border: "#d8dee4",
        ink: "#1f2933",
        muted: "#667085",
        panel: "#f7f9fb",
        brand: "#2563eb",
      },
    },
  },
  plugins: [],
};

export default config;
