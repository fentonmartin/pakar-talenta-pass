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
        // Deep brand navy (surface) — Pakar Talenta primary #002060
        surface: {
          50: '#0a0e24',
          100: '#0d1430',
          200: '#101a3d',
          300: '#1f2a52',
          400: '#2f3d6b',
          500: '#435184',
          600: '#5f6f9e',
          700: '#8b9cc4',
          800: '#c6d0e8',
          900: '#f2f5fb',
        },
        // Brand violet accent (Pak Talenta #7722ff)
        gold: {
          50: '#f7f3ff',
          100: '#efe7ff',
          200: '#deccff',
          300: '#c6a8ff',
          400: '#a67fff',
          500: '#7a2fff', // Brand accent
          600: '#5d16da',
          700: '#4c12b3',
          800: '#3c108c',
          900: '#2d0e69',
        },
      },
      fontFamily: {
        sans: ['var(--font-host-grotesk)', 'Host Grotesk', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      boxShadow: {
        'gold-sm': '0 2px 8px rgba(217, 164, 20, 0.25)',
        'gold-md': '0 6px 18px rgba(217, 164, 20, 0.28)',
        'gold-lg': '0 12px 28px rgba(217, 164, 20, 0.3)',
        'gold-xl': '0 20px 40px rgba(0, 0, 0, 0.55)',
        'inner-gold': 'inset 0 0 0 1px rgba(255, 215, 0, 0.35)',
        'cta-red': '0 10px 25px -5px rgba(204, 20, 20, 0.45)',
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
