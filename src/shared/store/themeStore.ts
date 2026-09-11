import { createMMKV } from 'react-native-mmkv';
import { create } from 'zustand';

const storage = createMMKV();
const THEME_STORAGE_KEY = 'theme_preference';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeStore {
  // State - only for persistence
  savedTheme: ThemeMode | null;

  // Actions
  saveTheme: (theme: ThemeMode) => void;
  loadTheme: () => ThemeMode | null;
}

// Load initial theme from storage
const getInitialTheme = (): ThemeMode | null => {
  try {
    const saved = storage.getString(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved;
    }
    return null;
  } catch {
    return null;
  }
};

export const useThemeStore = create<ThemeStore>(set => ({
  savedTheme: getInitialTheme(),

  saveTheme: (theme: ThemeMode) => {
    try {
      storage.set(THEME_STORAGE_KEY, theme);
      set({ savedTheme: theme });
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  },

  loadTheme: () => {
    return getInitialTheme();
  },
}));
