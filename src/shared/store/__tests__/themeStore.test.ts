import { createMMKV } from 'react-native-mmkv';

import { useThemeStore } from '../themeStore';

jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => ({
    set: jest.fn(),
    getString: jest.fn(),
  })),
}));

const storage = (createMMKV as jest.Mock).mock.results[0].value as {
  set: jest.Mock;
  getString: jest.Mock;
};

describe('Theme Store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    storage.getString.mockReturnValue(undefined);
    useThemeStore.setState({ savedTheme: null });
  });

  it('kayıtlı tercih yoksa boş başlar', () => {
    expect(useThemeStore.getState().savedTheme).toBeNull();
  });

  it.each(['light', 'dark', 'system'] as const)(
    '%s temasını kaydeder ve store durumunu günceller',
    theme => {
      useThemeStore.getState().saveTheme(theme);

      expect(storage.set).toHaveBeenCalledWith('theme_preference', theme);
      expect(useThemeStore.getState().savedTheme).toBe(theme);
    }
  );

  it('geçerli kayıtlı temayı yükler', () => {
    storage.getString.mockReturnValue('dark');

    expect(useThemeStore.getState().loadTheme()).toBe('dark');
    expect(storage.getString).toHaveBeenCalledWith('theme_preference');
  });

  it('geçersiz kayıtlı değeri yok sayar', () => {
    storage.getString.mockReturnValue('sepia');

    expect(useThemeStore.getState().loadTheme()).toBeNull();
  });
});
