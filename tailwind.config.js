/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1c1b22', paper: '#fff8ea', gold: '#f5b91c', danfo: '#ffd23f',
        leaf: '#0f7a4a', clay: '#c4562a', indigo: '#2b3a8c', night: '#14121f',
      },
      fontFamily: { display: ['"Bangers"', 'Impact', 'sans-serif'], body: ['"Nunito"', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
}
