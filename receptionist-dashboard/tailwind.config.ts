import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14213d",
        ocean: "#1d809f",
        mint: "#20b486",
        coral: "#f9735b",
        linen: "#f7f3ee"
      },
      boxShadow: {
        soft: "0 18px 60px rgba(20, 33, 61, 0.09)"
      }
    }
  },
  plugins: []
};

export default config;
