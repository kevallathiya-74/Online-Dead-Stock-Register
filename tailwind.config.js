/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#4B5EF5',
          main: '#2C3FE6',
          dark: '#1E2DB3',
        },
        secondary: {
          light: '#64748B',
          main: '#475569',
          dark: '#334155',
        },
      },
    },
  },
  plugins: [],
}