import { View } from 'react-native';

import { useColorScheme, vars } from 'nativewind';

import { colors } from '@constants';

// Generate CSS variable objects from colors.ts (single source of truth)
const lightTheme = vars({
  '--color-background': colors.background.light,
  '--color-surface': colors.surface.light,
  '--color-surface-elevated': colors['surface-elevated'].light,
  '--color-border': colors.border.light,
  '--color-content': colors.content.light,
  '--color-content-secondary': colors['content-secondary'].light,
  '--color-content-tertiary': colors['content-tertiary'].light,
  '--color-success': colors.success.light,
  '--color-warning': colors.warning.light,
  '--color-error': colors.error.light,
  '--color-info': colors.info.light,
});

const darkTheme = vars({
  '--color-background': colors.background.dark,
  '--color-surface': colors.surface.dark,
  '--color-surface-elevated': colors['surface-elevated'].dark,
  '--color-border': colors.border.dark,
  '--color-content': colors.content.dark,
  '--color-content-secondary': colors['content-secondary'].dark,
  '--color-content-tertiary': colors['content-tertiary'].dark,
  '--color-success': colors.success.dark,
  '--color-warning': colors.warning.dark,
  '--color-error': colors.error.dark,
  '--color-info': colors.info.dark,
});

const themes = {
  light: lightTheme,
  dark: darkTheme,
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { colorScheme } = useColorScheme();
  const theme = themes[colorScheme ?? 'light'];

  return <View style={[{ flex: 1 }, theme]}>{children}</View>;
}
