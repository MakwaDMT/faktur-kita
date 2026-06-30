/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#085041',
          light: '#E1F5EE',
          dark: '#062e25',
        }
      }
    },
  },
  plugins: [],
}
