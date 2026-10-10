/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1c1b22', paper: '#fff8ea', gold: '#f5b91c', danfo: '#ffc72c', violet: '#6a3df5', magenta: '#ff3d8b', cyan: '#35e0f0', naija: '#25c26a',
        leaf: '#0f7a4a', clay: '#c4562a', indigo: '#2b3a8c', night: '#14121f',
      },
      fontFamily: { display: ['"Lilita One"', '"Bangers"', 'Impact', 'sans-serif'], body: ['"Nunito"', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
}
