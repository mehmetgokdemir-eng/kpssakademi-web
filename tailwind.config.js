/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#d9e6ff',
          200: '#bcd3ff',
          300: '#8eb6ff',
          400: '#598fff',
          500: '#3168fb',
          600: '#1f49f0',
          700: '#1a37dc',
          800: '#1c30b2',
          900: '#1d2f8c',
          950: '#151d55',
        },
        ink: {
          50: '#f6f7f9',
          100: '#eceef2',
          200: '#d5dae3',
          300: '#b0b9ca',
          400: '#8593ac',
          500: '#667492',
          600: '#515d78',
          700: '#424b61',
          800: '#3a4152',
          900: '#1c2030',
          950: '#12141f',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,.06), 0 8px 24px -8px rgba(16,24,40,.12)',
        lift: '0 8px 30px -10px rgba(31,73,240,.45)',
      },
      keyframes: {
        pop: { '0%': { transform: 'scale(.96)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(8px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        pop: 'pop .18s ease-out both',
        slideUp: 'slideUp .22s ease-out both',
      },
    },
  },
  plugins: [],
}
