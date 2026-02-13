import { uiPreset } from "@infrastructure/ui/tailwind-preset";
import type { Config } from "tailwindcss";

const config: Config = {
  presets: [uiPreset as Config],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/infrastructure/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
