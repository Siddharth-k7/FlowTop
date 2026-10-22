import type { Config } from 'tailwindcss';

// TODO: swap for @flowtop/ui tokens when Dev C ships them. Values mirror frontend/AGENTS.md.
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    screens: { sm: '360px', md: '768px', lg: '1024px', xl: '1440px' },
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: 'var(--white)',
      ink: 'var(--ink)',
      purple: { deep: 'var(--purple-deep)', light: 'var(--purple-light)', pale: 'var(--purple-pale)' },
      grey: { 100: 'var(--grey-100)', 200: 'var(--grey-200)', 500: 'var(--grey-500)', 700: 'var(--grey-700)' },
      success: 'var(--success)',
      warning: 'var(--warning)',
      error: 'var(--error)',
      info: 'var(--info)',
    },
    spacing: {
      0: '0', 1: 'var(--space-1)', 2: 'var(--space-2)', 3: 'var(--space-3)', 4: 'var(--space-4)',
      5: 'var(--space-5)', 6: 'var(--space-6)', 8: 'var(--space-8)', 10: 'var(--space-10)',
      12: 'var(--space-12)', touch: 'var(--touch)', sidebar: 'var(--sidebar-w)', rail: 'var(--rail-w)',
      dialog: 'var(--dialog-w)', panel: 'var(--panel-w)',
    },
    extend: {
      borderRadius: { DEFAULT: 'var(--radius)', lg: 'var(--radius-lg)' },
      fontSize: { xs: 'var(--text-xs)', sm: 'var(--text-sm)', base: 'var(--text-base)', lg: 'var(--text-lg)', xl: 'var(--text-xl)', '2xl': 'var(--text-2xl)' },
      maxWidth: { content: 'var(--content-w)' },
      boxShadow: { card: 'var(--shadow-card)' },
    },
  },
  plugins: [],
};
export default config;
