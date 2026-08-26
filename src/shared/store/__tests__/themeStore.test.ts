jest.mock("react-native-mmkv", () => {
  const storage = {
    getString: jest.fn(),
    set: jest.fn(),
  };

  return {
    __storage: storage,
    createMMKV: () => storage,
  };
});

import { useThemeStore } from "../themeStore";

const mockStorage = jest.requireMock("react-native-mmkv").__storage as {
  getString: jest.Mock;
  set: jest.Mock;
};

describe("Theme Store", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.getString.mockReturnValue(undefined);
    useThemeStore.setState({ savedTheme: null });
  });

  it("initializes without a saved preference", () => {
    expect(useThemeStore.getState().savedTheme).toBeNull();
  });

  it("saves the selected theme", () => {
    useThemeStore.getState().saveTheme("dark");

    expect(mockStorage.set).toHaveBeenCalledWith("theme_preference", "dark");
    expect(useThemeStore.getState().savedTheme).toBe("dark");
  });

  it("loads a valid saved preference", () => {
    mockStorage.getString.mockReturnValue("light");

    expect(useThemeStore.getState().loadTheme()).toBe("light");
  });

  it("ignores an invalid saved preference", () => {
    mockStorage.getString.mockReturnValue("sepia");

    expect(useThemeStore.getState().loadTheme()).toBeNull();
  });
});
