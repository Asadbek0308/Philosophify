import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', '"EB Garamond"', 'Georgia', 'Cambria', 'serif'],
        cinzel: ['"Cinzel"', 'serif'],
        garamond: ['"EB Garamond"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['"Playfair Display"', '"EB Garamond"', 'Georgia', 'serif'], // completely remove sans-serif fallback
      },
    },
  },
  plugins: [
    daisyui,
  ],
  daisyui: {
    themes: [
      "luxury",
      "retro",
      "coffee",
      "forest",
      "cyberpunk",
      "synthwave",
      "dim",
      "dracula",
      "nord",
      "emerald",
      "business",
      "night",
      "dark",
      "light",
      "black"
    ],
  },
};
