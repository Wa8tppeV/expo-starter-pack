/** @type {import('tailwindcss').Config} */
const { colors } = require('./src/shared/constants/colors');

module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Fixed colors (no theme variants - same in light and dark)
        primary: colors.primary,
        'primary-dark': colors['primary-dark'],
        'primary-light': colors['primary-light'],
        accent: colors.accent,
        'accent-dark': colors['accent-dark'],
        'accent-light': colors['accent-light'],

        // Theme-aware colors via CSS variables (injected by ThemeProvider)
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        'surface-elevated': 'var(--color-surface-elevated)',
        border: 'var(--color-border)',
        content: 'var(--color-content)',
        'content-secondary': 'var(--color-content-secondary)',
        'content-tertiary': 'var(--color-content-tertiary)',

        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        info: 'var(--color-info)',
      },
      fontFamily: {
        manrope: ['Manrope-Regular'],
        'manrope-medium': ['Manrope-Medium'],
        'manrope-semibold': ['Manrope-SemiBold'],
        'manrope-bold': ['Manrope-Bold'],
        'manrope-extrabold': ['Manrope-ExtraBold'],
      },
      fontSize: {
        // Display: 48-56pt
        display: ['56px', { lineHeight: '67.2px' }],
        'display-sm': ['48px', { lineHeight: '57.6px' }],

        // H1: 28-32pt
        h1: ['32px', { lineHeight: '38.4px' }],
        'h1-sm': ['28px', { lineHeight: '33.6px' }],

        // H2: 20-24pt
        h2: ['24px', { lineHeight: '28.8px' }],
        'h2-sm': ['20px', { lineHeight: '24px' }],

        // H3: 16-18pt
        h3: ['18px', { lineHeight: '21.6px' }],
        'h3-sm': ['16px', { lineHeight: '19.2px' }],

        // Body: 15-16pt
        body: ['16px', { lineHeight: '24px' }],
        'body-sm': ['15px', { lineHeight: '22.5px' }],

        // Caption: 12-13pt
        caption: ['13px', { lineHeight: '18.2px' }],
        'caption-sm': ['12px', { lineHeight: '16.8px' }],

        // Small: 11pt
        small: ['11px', { lineHeight: '15.4px' }],
      },
    },
  },
  plugins: [],
};
