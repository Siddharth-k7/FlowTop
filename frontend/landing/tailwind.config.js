/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      'xs': '360px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1440px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        purple: {
          deep: '#5B2A86',
          light: '#9B6FC4',
          pale: '#F4EEFA',
        },
        ink: {
          DEFAULT: '#16121C',
          muted: '#524B5B',
          subtle: '#8C8596',
          faint: '#D4CFDC',
        },
        surface: {
          white: '#FFFFFF',
          subtle: '#FAFAFC',
          card: '#FDFCFF',
          elevated: '#FFFFFF',
        },
        border: {
          subtle: '#EAE6F0',
          medium: '#D8D2E2',
          strong: '#8C8596',
        },
        accent: {
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#3B82F6',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        'space-1': '0.25rem',  // 4px
        'space-2': '0.5rem',   // 8px
        'space-3': '0.75rem',  // 12px
        'space-4': '1rem',     // 16px
        'space-5': '1.25rem',  // 20px
        'space-6': '1.5rem',   // 24px
        'space-8': '2rem',     // 32px
        'space-10': '2.5rem',  // 40px
        'space-12': '3rem',    // 48px
        'space-16': '4rem',    // 64px
        'space-20': '5rem',    // 80px
        'space-24': '6rem',    // 96px
        'space-32': '8rem',    // 128px
      },
      borderRadius: {
        'token-xs': '2px',
        'token-sm': '4px',
        'token-md': '8px',
        'token-lg': '12px',
        'token-xl': '16px',
        'token-full': '9999px',
      },
      boxShadow: {
        'subtle': '0 1px 3px rgba(22, 18, 28, 0.05)',
        'floating': '0 8px 30px rgba(22, 18, 28, 0.08)',
        'elevated': '0 20px 40px -15px rgba(22, 18, 28, 0.12)',
        'glass': '0 4px 24px -1px rgba(91, 42, 134, 0.08)',
      },
      backdropBlur: {
        'glass': '12px',
      }
    },
  },
  plugins: [],
}
