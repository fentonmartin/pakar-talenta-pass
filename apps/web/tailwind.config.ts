/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Deep midnight teal (surface)
        surface: {
          50: '#0f172a',
          100: '#11182C',
          200: '#1e293b',
          300: '#334155',
          400: '#475569',
          500: '#64748b',
          600: '#94a3b8',
          700: '#cbd5e1',
          800: '#e2e8f0',
          900: '#f1f5f9',
        },
        // Gold accent
        gold: {
          50: '#fefce8',
          100: '#fef3c7',
          200: '#feedaa',
          300: '#fddb74',
          400: '#d9b742', // Main gold accent
          500: '#d9b742',
          600: '#b8942a',
          700: '#967c21',
          800: '#75631a',
          900: '#5a4d14',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      boxShadow: {
        'gold-sm': '0 1px 2px 0 rgba(217, 183, 66, 0.2)',
        'gold-md': '0 4px 6px -1px rgba(217, 183, 66, 0.3)',
        'gold-lg': '0 10px 15px -3px rgba(217, 183, 66, 0.3)',
        'gold-xl': '0 20px 25px -5px rgba(217, 183, 66, 0.2)',
        'inner-gold': 'inset 0 0 0 1px rgba(217, 183, 66, 0.3)',
      },
      animation: {
        shimmer: 'shimmer 3s infinite',
        'shimmer-pulse': 'shimmer-pulse 2s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'shimmer-pulse': {
          '0%': { opacity: '0.6' },
          '50%': { opacity: '1' },
          '100%': { opacity: '0.6' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};

export default config;
