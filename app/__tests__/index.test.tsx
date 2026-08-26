import React from "react";

import { render, screen } from "@testing-library/react-native";

import HomeScreen from "../(tabs)/home";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

jest.mock("expo-router", () => {
  return {
    useRouter: () => ({ push: jest.fn() }),
  };
});

describe("Home Screen", () => {
  it("renders the dashboard heading", () => {
    render(<HomeScreen />);

    const heading = screen.getByText("Kontrol Merkezi");
    expect(heading).toBeTruthy();
  });

  it("renders the project shortcut", () => {
    render(<HomeScreen />);

    const shortcut = screen.getByText("Yeni Proje Oluştur");
    expect(shortcut).toBeTruthy();
  });
});
