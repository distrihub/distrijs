/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('../../packages/components/tailwind.preset.cjs')],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../packages/react/src/**/*.{js,ts,jsx,tsx}",
    "../../packages/components/src/**/*.{js,ts,jsx,tsx}",
    "../../packages/home/src/**/*.{js,ts,jsx,tsx}",
  ],
  // theme.extend is removed — the preset provides all design tokens.
  // tailwindcss-animate is already included via the preset.
};
