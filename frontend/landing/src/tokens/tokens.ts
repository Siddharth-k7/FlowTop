/**
 * Flowtop Design Tokens
 * Source of Truth: frontend/AGENTS.md & docs/06-conventions.md
 */

export const tokens = {
  colors: {
    purpleDeep: '#5B2A86',
    purpleLight: '#9B6FC4',
    purplePale: '#F4EEFA',
    ink: '#16121C',
    white: '#FFFFFF',
    // Neutrals
    neutral50: '#FAFAFC',
    neutral100: '#F4F2F7',
    neutral200: '#EAE6F0',
    neutral400: '#8C8596',
    neutral600: '#524B5B',
    neutral800: '#2A2333',
    // Semantics
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
  typography: {
    fontSans: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  breakpoints: {
    xs: 360,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1440,
  },
  spacing: {
    space1: '0.25rem',
    space2: '0.5rem',
    space3: '0.75rem',
    space4: '1rem',
    space6: '1.5rem',
    space8: '2rem',
    space12: '3rem',
    space16: '4rem',
    space24: '6rem',
  },
  radii: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },
  shadows: {
    subtle: '0 1px 3px rgba(22, 18, 28, 0.05)',
    floating: '0 8px 30px rgba(22, 18, 28, 0.08)',
    elevated: '0 20px 40px -15px rgba(22, 18, 28, 0.12)',
    glass: '0 4px 24px -1px rgba(91, 42, 134, 0.08)',
  },
  transitions: {
    default: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
    smooth: 'all 400ms cubic-bezier(0.16, 1, 0.3, 1)',
  }
} as const;

export type DesignTokens = typeof tokens;
