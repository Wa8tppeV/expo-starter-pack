import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeStore {
  loadTheme: () => ThemeMode | null;
  savedTheme: ThemeMode | null;
  saveTheme: (theme: ThemeMode) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      loadTheme: () => get().savedTheme,
      savedTheme: null,
      saveTheme: savedTheme => set({ savedTheme }),
    }),
    {
      name: 'theme_preference',
      partialize: state => ({ savedTheme: state.savedTheme }),
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    }
  )
);
