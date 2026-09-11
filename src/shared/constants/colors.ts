/**
 * Color Constants for Coffee App
 *
 * IMPORTANT: This is the SINGLE SOURCE OF TRUTH for all colors.
 * - Imported by tailwind.config.js for CSS variable generation
 * - Exported for programmatic use (charts, animations, etc.)
 *
 * Each color is defined with light and dark mode values.
 */

export interface ColorScale {
  light: string;
  dark: string;
}

export const colors = {
  // Primary colors (no light/dark variants - same in both themes)
  primary: '#C17F4F',
  'primary-dark': '#A86D42',
  'primary-light': '#D19968',

  // Accent colors (no light/dark variants - same in both themes)
  accent: '#9B6B4F',
  'accent-dark': '#7D5840',
  'accent-light': '#B8836A',

  // Theme-aware colors (different values for light/dark mode)
  background: {
    light: '#FCFAF8',
    dark: '#1A1715',
  },
  surface: {
    light: '#F5F1ED',
    dark: '#2B2823',
  },
  'surface-elevated': {
    light: '#FFFFFF',
    dark: '#363230',
  },
  border: {
    light: '#E8E3DD',
    dark: '#3D3935',
  },
  content: {
    light: '#1A1715',
    dark: '#F5F1ED',
  },
  'content-secondary': {
    light: '#68615B',
    dark: '#B8B0A8',
  },
  'content-tertiary': {
    light: '#9B9389',
    dark: '#7D7670',
  },

  // Semantic colors (different values for light/dark mode)
  success: {
    light: '#2D7A4F',
    dark: '#40A36D',
  },
  warning: {
    light: '#D69E2E',
    dark: '#ECC94B',
  },
  error: {
    light: '#C73E3A',
    dark: '#E05550',
  },
  info: {
    light: '#2E5D8A',
    dark: '#4A90C7',
  },
} as const;

// Helper function to get color value for current theme
export function getColor(colorKey: string, theme: 'light' | 'dark'): string {
  const color = colors[colorKey as keyof typeof colors];

  if (typeof color === 'string') {
    // Fixed color (no light/dark variants)
    return color;
  }

  // Color with light/dark variants
  return color[theme];
}

// Export all colors for convenience
export default colors;
