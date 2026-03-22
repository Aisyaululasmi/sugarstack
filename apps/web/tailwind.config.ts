import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/**/*.{ts,tsx}',
    './src/app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // SugarStack pastel palette
        sugar: {
          50: '#fff5f7',
          100: '#ffe0e8',
          200: '#ffc2d4',
          300: '#ff9ab5',
          400: '#ff6b93',
          500: '#f43f6e',
          600: '#e11d48',
          700: '#be123c',
        },
        cream: {
          50: '#fffbf0',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
