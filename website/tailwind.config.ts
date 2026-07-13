import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        stone: "#F5F4F0",
        charcoal: "#131A13",
        water: "#1B62E8",
        mist: "#E8F0FD",
        mud: "#7A8C7A",
        ember: "#E0672B",
        emberLight: "#F5C68C",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
