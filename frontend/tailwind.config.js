import preset from '../packages/ui/tailwind-preset.cjs';

/** @type {import('tailwindcss').Config} */
const config = {
  presets: [
    preset,
  ],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  plugins: [],
};

export default config;
