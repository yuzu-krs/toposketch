/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Segoe UI"',
          '"Hiragino Kaku Gothic ProN"',
          '"Yu Gothic UI"',
          'Meiryo',
          'system-ui',
          'sans-serif',
        ],
      },
      boxShadow: {
        panel: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      },
    },
  },
  plugins: [],
};
