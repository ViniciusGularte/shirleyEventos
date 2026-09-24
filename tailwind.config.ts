import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        event: {
          ink: "#120C12",
          paper: "#FFF8FB",
          rose: "#F45B92"
        }
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "Manrope", "sans-serif"]
      },
      boxShadow: {
        event: "0 24px 80px rgba(18, 12, 18, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
