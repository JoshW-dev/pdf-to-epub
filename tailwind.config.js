/** @type {import('tailwindcss').Config} */
export default {
  // Class strategy: the OS preference no longer flips the site. The paper
  // theme is the default, and dark styles only apply under a `.dark` root.
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ["Spectral", "Georgia", "Cambria", "Times New Roman", "serif"],
        sans: [
          "IBM Plex Sans",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      colors: {
        paper: {
          50: "#fdf8ed",
          100: "#fbf1d9",
          200: "#f5e1b1",
          300: "#eccd83",
          400: "#e2b855",
          500: "#d4a574",
          600: "#b88a4d",
          700: "#946e3a",
          800: "#6e5128",
          900: "#4a3618",
        },
      },
    },
  },
  plugins: [],
};
