/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.vue',
    './src/components/**/*.vue',
    './src/App.vue',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#E8A0B4',
          light: '#F2C8D4',
          dark: '#C47A92',
        },
        secondary: {
          DEFAULT: '#9FC5E8',
          light: '#C4DDF2',
          dark: '#6BA3D4',
        },
        surface: {
          DEFAULT: '#FAF5F7',
          card: '#FFFFFF',
          muted: '#F3ECF0',
        },
        ink: {
          DEFAULT: '#2D2A2E',
          secondary: '#6B6570',
          light: '#A39DA8',
          faint: '#D1CDD3',
        },
      },
      borderRadius: {
        card: '20px',
        image: '16px',
        button: '28px',
        pill: '100px',
      },
      boxShadow: {
        'card': '0 2px 16px rgba(45,42,46,0.06)',
        'card-lg': '0 8px 32px rgba(45,42,46,0.10)',
        'float': '0 12px 40px rgba(45,42,46,0.12)',
        'glow': '0 0 24px rgba(232,160,180,0.25)',
      },
      fontSize: {
        'hero': ['72px', { lineHeight: '1', fontWeight: '700', letterSpacing: '-2px' }],
        'display': ['48px', { lineHeight: '1.1', fontWeight: '700', letterSpacing: '-1px' }],
        'title': ['20px', { lineHeight: '1.4', fontWeight: '600' }],
        'body': ['15px', { lineHeight: '1.6', fontWeight: '400' }],
        'caption': ['13px', { lineHeight: '1.5', fontWeight: '400' }],
        'micro': ['11px', { lineHeight: '1.4', fontWeight: '500' }],
      },
      spacing: {
        '18': '72px',
        '22': '88px',
      },
    },
  },
  plugins: [],
}
