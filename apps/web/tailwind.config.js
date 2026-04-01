/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#fff4e8",
        surface: "#fff9f2",
        "surface-elevated": "#fff1e2",
        border: "#f2d8bf",
        "border-hover": "#e6bf98",
        "text-primary": "#4e2f1e",
        "text-secondary": "#7a5540",
        "text-muted": "#a67b62",
        accent: "#d97706",
        "accent-hover": "#b45309",
        glucose: "#0ea5e9",
        meal: "#c2410c",
        workout: "#0f766e",
        brand: "#ea580c",
        "brand-ink": "#6a3414",
        "meal-marker": "#c2410c",
        "workout-marker": "#0f766e",
        "spike-high": "#ef4444",
        "spike-moderate": "#f59e0b",
        "spike-low": "#22c55e",
        danger: "#ef4444",
      },
      fontFamily: {
        sans: ["DM Sans", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
        display: ["Fraunces", "Georgia", "serif"],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
      },
    },
  },
  plugins: [],
};
