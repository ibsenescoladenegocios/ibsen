/** Cores da marca IBSEN (tiradas do logo): verde, azul, amarelo e dourado. */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#058B42', dark: '#04703A', light: '#E7F4EC' },   // verde
        navy: { DEFAULT: '#17346C', dark: '#0F2550', light: '#E8EDF6' },      // azul
        sun: { DEFAULT: '#FECD11', dark: '#E5B800' },                          // amarelo
        gold: '#D9A93F',                                                       // dourado da fita
      },
    },
  },
  plugins: [],
};
