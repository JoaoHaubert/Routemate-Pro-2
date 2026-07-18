/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        ink: '#0F1613',
        panel: '#132019',
        surface: '#F5F5F1',
        card: '#FFFFFF',
        line: '#E3E1D8',
        primary: {
          50: '#EAF3EF',
          100: '#C9E4D8',
          300: '#6FB89E',
          500: '#1D9E75',
          600: '#0F6E56',
          700: '#0A4F3D',
        },
        clay: {
          100: '#F5DFCE',
          400: '#E0954F',
          500: '#D07A2E',
          600: '#A85E20',
        },
        alert: {
          500: '#D85A30',
          600: '#993C1D',
        },
      },
    },
  },
  plugins: [],
}
