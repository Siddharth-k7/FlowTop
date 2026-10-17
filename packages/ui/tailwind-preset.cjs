/**
 * Flowtop Tailwind v3 Preset
 *
 * This preset REPLACES Tailwind defaults with Flowtop design tokens.
 * Only token-backed utilities are generated (e.g. bg-purple-deep, p-space-4, rounded-md).
 * Arbitrary hex/pixel values and default classes like bg-red-500 are excluded.
 */

const fs = require('fs');
const path = require('path');
const plugin = require('tailwindcss/plugin');

function getBreakpoints() {
  const tokensPath = path.resolve(__dirname, './src/tokens.css');
  try {
    const content = fs.readFileSync(tokensPath, 'utf8');
    const screens = {};
    const regex = /--breakpoint-([a-z0-9]+):\s*([0-9]+px);/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      screens[match[1]] = match[2];
    }
    if (Object.keys(screens).length > 0) {
      return screens;
    }
  } catch {
    // fallback if tokens.css cannot be read directly
  }
  return {
    xs: '360px',
    md: '768px',
    lg: '1024px',
    xl: '1440px',
  };
}

module.exports = {
  theme: {
    // REPLACES screens with token breakpoints
    screens: getBreakpoints(),

    // REPLACES default colors with Flowtop tokens only
    colors: {
      transparent: 'transparent',
      current: 'currentColor',

      // Brand
      'purple-deep': 'var(--color-purple-deep)',
      'purple-light': 'var(--color-purple-light)',
      'purple-pale': 'var(--color-purple-pale)',
      ink: 'var(--color-ink)',
      white: 'var(--color-white)',

      // Grey scale
      'grey-50': 'var(--color-grey-50)',
      'grey-100': 'var(--color-grey-100)',
      'grey-200': 'var(--color-grey-200)',
      'grey-300': 'var(--color-grey-300)',
      'grey-400': 'var(--color-grey-400)',
      'grey-500': 'var(--color-grey-500)',
      'grey-600': 'var(--color-grey-600)',
      'grey-700': 'var(--color-grey-700)',
      'grey-800': 'var(--color-grey-800)',
      'grey-900': 'var(--color-grey-900)',

      // Semantics
      success: 'var(--color-success)',
      'success-tint': 'var(--color-success-tint)',
      warning: 'var(--color-warning)',
      'warning-tint': 'var(--color-warning-tint)',
      error: 'var(--color-error)',
      'error-tint': 'var(--color-error-tint)',
      info: 'var(--color-info)',
      'info-tint': 'var(--color-info-tint)',

      // Roles
      primary: 'var(--primary)',
      'primary-dark': 'var(--primary-dark)',
      'primary-tint': 'var(--primary-tint)',
      accent: 'var(--accent)',
      'on-primary': 'var(--on-primary)',

      surface: 'var(--surface)',
      'surface-solid': 'var(--surface-solid)',
      'surface-glass': 'var(--surface-glass)',
      'surface-light': 'var(--surface-light)',
      'surface-inverse': 'var(--surface-inverse)',
      'on-surface-inverse': 'var(--on-surface-inverse)',

      'text-primary': 'var(--text-primary)',
      'text-muted': 'var(--text-muted)',

      border: 'var(--border)',
      'border-strong': 'var(--border-strong)',
      'border-input': 'var(--border-input)',
      'focus-ring': 'var(--focus-ring)',
    },

    // REPLACES spacing with Flowtop 4px scale + touch
    spacing: {
      '0': 'var(--space-0)',
      px: 'var(--space-px)',
      'space-1': 'var(--space-1)', // 4px
      'space-2': 'var(--space-2)', // 8px
      'space-3': 'var(--space-3)', // 12px
      'space-4': 'var(--space-4)', // 16px
      'space-5': 'var(--space-5)', // 24px
      'space-6': 'var(--space-6)', // 32px
      'space-7': 'var(--space-7)', // 48px
      'space-8': 'var(--space-8)', // 64px
      touch: 'var(--size-touch)', // 44px touch target
    },

    // REPLACES border radius with Flowtop radius scale
    borderRadius: {
      none: 'var(--radius-none)',
      sm: 'var(--radius-sm)', // 12px
      md: 'var(--radius-md)', // 24px
      lg: 'var(--radius-lg)', // 40px
      pill: 'var(--radius-pill)', // 9999px
    },

    // REPLACES shadows with Flowtop purple-tinted shadows
    boxShadow: {
      none: 'none',
      sm: 'var(--shadow-sm)',
      md: 'var(--shadow-md)',
      lg: 'var(--shadow-lg)',
    },

    // REPLACES typography sizes with Flowtop fluid/fixed type scale
    fontSize: {
      caption: ['var(--text-caption-size)', { lineHeight: 'var(--text-caption-leading)' }],
      small: ['var(--text-small-size)', { lineHeight: 'var(--text-small-leading)' }],
      body: ['var(--text-body-size)', { lineHeight: 'var(--text-body-leading)' }],
      title: ['var(--text-title-size)', { lineHeight: 'var(--text-title-leading)' }],
      headline: ['var(--text-headline-size)', { lineHeight: 'var(--text-headline-leading)' }],
      display: ['var(--text-display-size)', { lineHeight: 'var(--text-display-leading)' }],
    },

    // REPLACES font families
    fontFamily: {
      display: 'var(--font-display)',
      body: 'var(--font-body)',
    },

    // REPLACES font weights
    fontWeight: {
      light: 'var(--weight-light)',
      regular: 'var(--weight-regular)',
      medium: 'var(--weight-medium)',
      semibold: 'var(--weight-semibold)',
    },

    // REPLACES z-index layers
    zIndex: {
      base: 'var(--z-base)',
      raised: 'var(--z-raised)',
      dropdown: 'var(--z-dropdown)',
      sticky: 'var(--z-sticky)',
      overlay: 'var(--z-overlay)',
      modal: 'var(--z-modal)',
      toast: 'var(--z-toast)',
      tooltip: 'var(--z-tooltip)',
      'skip-link': 'var(--z-skip-link)',
    },

    // REPLACES transition durations & easings
    transitionDuration: {
      fast: 'var(--duration-fast)',
      base: 'var(--duration-base)',
      slow: 'var(--duration-slow)',
    },
    transitionTimingFunction: {
      standard: 'var(--ease-standard)',
      emphasized: 'var(--ease-emphasized)',
    },
  },
  plugins: [
    plugin(function ({ addComponents }) {
      addComponents({
        '.container-page': {
          width: '100%',
          marginLeft: 'auto',
          marginRight: 'auto',
          paddingLeft: 'var(--gutter-xs)',
          paddingRight: 'var(--gutter-xs)',
          maxWidth: 'var(--container-xs)',
          '@screen md': {
            paddingLeft: 'var(--gutter-md)',
            paddingRight: 'var(--gutter-md)',
            maxWidth: 'var(--container-md)',
          },
          '@screen lg': {
            paddingLeft: 'var(--gutter-lg)',
            paddingRight: 'var(--gutter-lg)',
            maxWidth: 'var(--container-lg)',
          },
          '@screen xl': {
            paddingLeft: 'var(--gutter-xl)',
            paddingRight: 'var(--gutter-xl)',
            maxWidth: 'var(--container-xl)',
          },
        },
        '.container-wide': {
          width: '100%',
          marginLeft: 'auto',
          marginRight: 'auto',
          paddingLeft: 'var(--gutter-xs)',
          paddingRight: 'var(--gutter-xs)',
          maxWidth: '100%',
          '@screen md': {
            paddingLeft: 'var(--gutter-md)',
            paddingRight: 'var(--gutter-md)',
          },
          '@screen lg': {
            paddingLeft: 'var(--gutter-lg)',
            paddingRight: 'var(--gutter-lg)',
          },
          '@screen xl': {
            paddingLeft: 'var(--gutter-xl)',
            paddingRight: 'var(--gutter-xl)',
            maxWidth: 'var(--container-wide)',
          },
        },
        '.focus-ring': {
          outline: 'none',
          '&:focus-visible': {
            outline: 'var(--focus-ring-width) solid var(--focus-ring)',
            outlineOffset: 'var(--focus-ring-offset)',
          },
        },
        '.touch-target': {
          minWidth: 'var(--size-touch)',
          minHeight: 'var(--size-touch)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
      });
    }),
  ],
};
