import AsyncStorage from '@react-native-async-storage/async-storage';

import { useThemeStore } from '../themeStore';

describe('Theme Store', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useThemeStore.setState({ savedTheme: null });
  });

  it('initializes without a saved preference', () => {
    expect(useThemeStore.getState().savedTheme).toBeNull();
  });

  it('saves the selected theme in Expo Go compatible storage', () => {
    useThemeStore.getState().saveTheme('dark');

    expect(useThemeStore.getState().savedTheme).toBe('dark');
    expect(useThemeStore.getState().loadTheme()).toBe('dark');
  });

  it('supports system, light and dark preferences', () => {
    for (const theme of ['system', 'light', 'dark'] as const) {
      useThemeStore.getState().saveTheme(theme);
      expect(useThemeStore.getState().loadTheme()).toBe(theme);
    }
  });
});
