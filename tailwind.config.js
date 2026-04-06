/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
        sans: ["Segoe UI", "Tahoma", "Geneva", "Verdana", "sans-serif"],
      },
      colors: {
        cream: {
          50: "#fdfaf5",
          100: "#f9f0e0",
          200: "#f2dfc0",
        },
        batik: {
          50: "#fef7ee",
          100: "#fdeed9",
          200: "#fad9af",
          300: "#f6bd7a",
          400: "#f09743",
          500: "#eb791e",
          600: "#dc5e13",
          700: "#b64612",
          800: "#913815",
          900: "#753014",
          950: "#3f1607",
        },
        hijau: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
        },
      },
    },
  },
  plugins: [],
};
