import type { Config } from 'tailwindcss';
import preset from '@flowtop/ui/tailwind-preset';

// Dev C's preset supplies the colours, the token scales (under theme.extend, so Tailwind's
// defaults stay) and the screens: xs 360, sm 640 (Tailwind), md 768, lg 1024, xl 1440.
// Only admin-specific layout sizes live here.
const config: Config = {
  presets: [preset],
  // packages/ui is scanned so its components get their CSS generated in this app.
  content: ['./src/**/*.{ts,tsx}', '../packages/ui/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      spacing: { sidebar: 'var(--sidebar-w)', rail: 'var(--rail-w)', dialog: 'var(--dialog-w)', panel: 'var(--panel-w)' },
      // rounded-lg is the preset's 40px token. Admin cards and menus use rounded-card (14px).
      borderRadius: { DEFAULT: 'var(--admin-radius)', card: 'var(--admin-radius-card)' },
      fontSize: { xs: 'var(--text-xs)', sm: 'var(--text-sm)', base: 'var(--text-base)', lg: 'var(--text-lg)', xl: 'var(--text-xl)', '2xl': 'var(--text-2xl)' },
      maxWidth: { content: 'var(--content-w)' },
      boxShadow: { card: 'var(--shadow-card)' },
    },
  },
  plugins: [],
};
export default config;
