/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          300: '#82d3e0',
          400: '#53bed0',
          500: '#24a8c0',
          600: '#1d8699',
        }
      }
    },
  },
  plugins: [],
}
