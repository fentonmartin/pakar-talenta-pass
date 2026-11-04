/**
 * Design tokens — single source of truth for colors, spacing, typography,
 * shadows, and animations used across the Pakar Talenta Pass application.
 *
 * Aesthetic: Pakar Talenta brand — deep navy (#002060) surfaces, brand violet
 * (#7722ff) accents, red (#820303→#fc2828) CTAs, Host Grotesk typography,
 * liquid glass surfaces and shimmer sweep animations.
 */

// ┌─── Colors ─────────────────────────────────────────────────────────────

export const colors = {
  // Brand navy spectrum (surfaces) — Pakar Talenta primary #002060
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

  // Brand violet accent spectrum (Pakar Talenta #7722ff)
  accent: {
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

  // Brand CTA red (#820303 → #fc2828)
  cta: {
    from: '#820303',
    to: '#fc2828',
  },

  // Semantic colors
  semantic: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
} as const;

// ┌─── Typography ─────────────────────────────────────────────────────────

export const fonts = {
  sans: {
    family: "'Host Grotesk', system-ui, -apple-system, sans-serif",
    weights: {
      light: '300',
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
  },
  mono: {
    family: "'Fira Code', 'Fira Mono', monospace",
    weights: {
      regular: '400',
      medium: '500',
    },
  },
} as const;

export const fontSize = {
  xs: '0.75rem',
  sm: '0.875rem',
  base: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  '3xl': '2rem',
  '4xl': '2.5rem',
  '5xl': '3rem',
  '6xl': '3.75rem',
  '7xl': '4.5rem',
};

// ┌─── Spacing ────────────────────────────────────────────────────────────

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
  '4xl': '6rem',
  '5xl': '8rem',
} as const;

// ┌─── Border radius ──────────────────────────────────────────────────────

export const borderRadius = {
  sm: '0.25rem',     // 4px
  md: '0.5rem',      // 8px
  lg: '0.75rem',     // 12px
  xl: '1rem',        // 16px
  '2xl': '1.5rem',   // 24px
  '3xl': '2rem',     // 32px
  full: '9999px',
} as const;

// ┌─── Shadows ─────────────────────────────────────────────────────────────

export const shadows = {
  goldSm: '0 1px 2px 0 rgba(122, 47, 255, 0.2)',
  goldMd: '0 4px 6px -1px rgba(122, 47, 255, 0.3)',
  goldLg: '0 10px 15px -3px rgba(122, 47, 255, 0.3)',
  goldXl: '0 20px 25px -5px rgba(122, 47, 255, 0.2)',
  innerGold: 'inset 0 0 0 1px rgba(122, 47, 255, 0.3)',
} as const;

// ┌─── Animations ───────────────────────────────────────────────────────────

export const animations = {
  shimmer: {
    duration: '3s',
    timing: 'cubic-bezier(0.6, 0.2, 0.4, 1)',
    iterationCount: 'infinite',
  },
  pulse: {
    duration: '2s',
    timing: 'ease-in-out',
    iterationCount: 'infinite',
  },
} as const;

// ┌─── Breakpoints ─────────────────────────────────────────────────────────

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ┌─── Z-index ─────────────────────────────────────────────────────────────

export const zIndex = {
  base: 0,
  card: 10,
  overlay: 20,
  modal: 30,
  toast: 40,
} as const;

export default {
  colors,
  fonts,
  fontSize,
  spacing,
  borderRadius,
  shadows,
  animations,
  breakpoints,
  zIndex,
};
