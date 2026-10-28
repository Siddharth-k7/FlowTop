/**
 * Flowtop Tailwind v3 Preset
 *
 * Token scales live under theme.extend so consumers keep Tailwind's defaults
 * (w-56, z-10, font-mono, the sm screen, and the rest). theme.colors is the
 * one scale this preset still replaces: the default palette is not part of
 * the design system. Arbitrary hex colours and pixel brackets stay banned
 * by project convention and are validated by check.mjs.
 *
 * Same-named keys inside extend override the Tailwind default. See
 * "What the preset replaces" in COMPONENTS.md.
 */

const fs = require('fs');
const path = require('path');
const plugin = require('tailwindcss/plugin');

function colorToken(variableName) {
  return ({ opacityValue } = {}) => {
    if (opacityValue !== undefined) {
      return `color-mix(in srgb, var(${variableName}) calc(${opacityValue} * 100%), transparent)`;
    }
    return `var(${variableName})`;
  };
}

function getBreakpoints(customContent) {
  let content;
  if (customContent !== undefined) {
    content = customContent;
  } else {
    const tokensPath = path.join(__dirname, 'src', 'tokens.css');
    if (!fs.existsSync(tokensPath)) {
      throw new Error(`[Flowtop Preset] tokens.css not found at: ${tokensPath}`);
    }
    content = fs.readFileSync(tokensPath, 'utf8');
  }
  const screens = {};
  const regex = /--breakpoint-([a-z0-9]+):\s*([0-9]+px);/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    screens[match[1]] = match[2];
  }

  const REQUIRED_BREAKPOINTS = ['xs', 'md', 'lg', 'xl'];
  const missing = REQUIRED_BREAKPOINTS.filter((bp) => !screens[bp]);
  if (missing.length > 0) {
    throw new Error(
      `[Flowtop Preset] Missing required breakpoint(s) in tokens.css: ${missing.join(', ')}. ` +
      `Expected definitions for: ${REQUIRED_BREAKPOINTS.join(', ')}.`
    );
  }

  return screens;
}

module.exports = {
  theme: {
    // Replaces the default palette. Opacity modifiers stay on colorToken().
    colors: {
      transparent: 'transparent',
      current: 'currentColor',

      // Brand
      'purple-deep': colorToken('--color-purple-deep'),
      'purple-light': colorToken('--color-purple-light'),
      'purple-pale': colorToken('--color-purple-pale'),
      ink: colorToken('--color-ink'),
      white: colorToken('--color-white'),

      // Grey scale
      'grey-50': colorToken('--color-grey-50'),
      'grey-100': colorToken('--color-grey-100'),
      'grey-200': colorToken('--color-grey-200'),
      'grey-300': colorToken('--color-grey-300'),
      'grey-400': colorToken('--color-grey-400'),
      'grey-500': colorToken('--color-grey-500'),
      'grey-600': colorToken('--color-grey-600'),
      'grey-700': colorToken('--color-grey-700'),
      'grey-800': colorToken('--color-grey-800'),
      'grey-900': colorToken('--color-grey-900'),

      // Semantics
      success: colorToken('--color-success'),
      'success-tint': colorToken('--color-success-tint'),
      warning: colorToken('--color-warning'),
      'warning-tint': colorToken('--color-warning-tint'),
      error: colorToken('--color-error'),
      'error-tint': colorToken('--color-error-tint'),
      info: colorToken('--color-info'),
      'info-tint': colorToken('--color-info-tint'),

      // Roles
      primary: colorToken('--primary'),
      'primary-dark': colorToken('--primary-dark'),
      'primary-tint': colorToken('--primary-tint'),
      accent: colorToken('--accent'),
      'on-primary': colorToken('--on-primary'),

      surface: colorToken('--surface'),
      'surface-solid': colorToken('--surface-solid'),
      'surface-glass': colorToken('--surface-glass'),
      'surface-light': colorToken('--surface-light'),
      'surface-inverse': colorToken('--surface-inverse'),
      'on-surface-inverse': colorToken('--on-surface-inverse'),

      // Foreground text roles
      fg: colorToken('--fg'),
      'fg-muted': colorToken('--fg-muted'),

      border: colorToken('--border'),
      'border-strong': colorToken('--border-strong'),
      'border-input': colorToken('--border-input'),
      'focus-ring': colorToken('--focus-ring'),
    },

    extend: {
      // Token breakpoints. xl overrides Tailwind's 1280px with 1440px.
      // sm (640px) and 2xl (1536px) stay from the default theme.
      screens: getBreakpoints(),

      // Named space-* steps do not collide with Tailwind's numeric scale.
      // 0 and px match the default pixel values and resolve through tokens.
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

      // sm/md/lg override Tailwind's 2px/6px/8px radii with the token radii.
      borderRadius: {
        none: 'var(--radius-none)',
        sm: 'var(--radius-sm)', // 12px
        md: 'var(--radius-md)', // 24px
        lg: 'var(--radius-lg)', // 40px
        pill: 'var(--radius-pill)', // 9999px
      },

      // sm/md/lg override Tailwind's black shadows with the purple-tinted tokens.
      boxShadow: {
        none: 'none',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },

      fontSize: {
        caption: ['var(--text-caption-size)', { lineHeight: 'var(--text-caption-leading)' }],
        small: ['var(--text-small-size)', { lineHeight: 'var(--text-small-leading)' }],
        body: ['var(--text-body-size)', { lineHeight: 'var(--text-body-leading)' }],
        title: ['var(--text-title-size)', { lineHeight: 'var(--text-title-leading)' }],
        headline: ['var(--text-headline-size)', { lineHeight: 'var(--text-headline-leading)' }],
        display: ['var(--text-display-size)', { lineHeight: 'var(--text-display-leading)' }],
      },

      // display and body are additive. sans, serif, and mono stay.
      fontFamily: {
        display: 'var(--font-display)',
        body: 'var(--font-body)',
      },

      // light/medium/semibold match Tailwind's 300/500/600 and resolve through tokens.
      fontWeight: {
        light: 'var(--weight-light)',
        regular: 'var(--weight-regular)',
        medium: 'var(--weight-medium)',
        semibold: 'var(--weight-semibold)',
      },

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

      // DEFAULT is what bare transition, transition-colors, transition-opacity
      // and the rest emit. Without these two DEFAULTs Tailwind falls back to its
      // own 150ms and cubic-bezier(0.4, 0, 0.2, 1), which ignores the motion
      // tokens and the reduced-motion overrides in tokens.css.
      transitionDuration: {
        DEFAULT: 'var(--duration-fast)',
        fast: 'var(--duration-fast)',
        base: 'var(--duration-base)',
        slow: 'var(--duration-slow)',
      },
      transitionTimingFunction: {
        DEFAULT: 'var(--ease-standard)',
        standard: 'var(--ease-standard)',
        emphasized: 'var(--ease-emphasized)',
      },

      maxHeight: {
        none: 'none',
        full: '100%',
        screen: '100vh',
        dialog: 'var(--max-h-dialog)',
        sheet: 'var(--max-h-sheet)',
        modal: 'var(--max-h-dialog)',
      },

      maxWidth: {
        measure: 'var(--measure)',
      },
    },
  },
  plugins: [
    plugin(function ({ addComponents, addUtilities }) {
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

      addUtilities({
        '.scrollbar-none': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        '@keyframes enter': {
          from: {
            opacity: 'var(--tw-enter-opacity, 1)',
            transform:
              'translate3d(var(--tw-enter-translate-x, 0), var(--tw-enter-translate-y, 0), 0) scale3d(var(--tw-enter-scale, 1), var(--tw-enter-scale, 1), var(--tw-enter-scale, 1))',
          },
        },
        '.animate-in': {
          animationName: 'enter',
          animationDuration: 'var(--duration-base)',
          animationTimingFunction: 'var(--ease-standard)',
          '--tw-enter-opacity': 'initial',
          '--tw-enter-scale': 'initial',
          '--tw-enter-translate-x': 'initial',
          '--tw-enter-translate-y': 'initial',
          '@media (prefers-reduced-motion: reduce)': {
            animationDuration: 'var(--duration-fast)',
            '--tw-enter-scale': '1 !important',
            '--tw-enter-translate-x': '0 !important',
            '--tw-enter-translate-y': '0 !important',
          },
        },
        '.fade-in': {
          '--tw-enter-opacity': '0',
        },
        '.zoom-in-95': {
          '--tw-enter-scale': '0.95',
        },
        '.slide-in-from-left': {
          '--tw-enter-translate-x': '-100%',
        },
        '.slide-in-from-right': {
          '--tw-enter-translate-x': '100%',
        },
        '.slide-in-from-bottom': {
          '--tw-enter-translate-y': '100%',
        },
      });
    }),
  ],
};

module.exports.getBreakpoints = getBreakpoints;
