import { colors, getColor } from "../colors";

describe("Color Constants", () => {
  it("exports primary colors", () => {
    expect(colors.primary).toBe("#D4AF37");
    expect(colors["primary-dark"]).toBe("#A88722");
    expect(colors["primary-light"]).toBe("#E6CD78");
  });

  it("exports accent colors", () => {
    expect(colors.accent).toBe("#171717");
    expect(colors["accent-dark"]).toBe("#0B0B0B");
    expect(colors["accent-light"]).toBe("#333333");
  });

  it("exports light theme colors", () => {
    expect(colors.background.light).toBe("#F7F7F5");
    expect(colors["content"].light).toBe("#171717");
    expect(colors.surface.light).toBe("#EFEFEA");
  });

  it("exports dark theme colors", () => {
    expect(colors.background.dark).toBe("#111111");
    expect(colors["content"].dark).toBe("#F5F5F2");
    expect(colors.surface.dark).toBe("#1B1B1B");
  });

  it("exports semantic colors with light/dark variants", () => {
    expect(colors.success.light).toBe("#16835B");
    expect(colors.success.dark).toBe("#35B27F");
    expect(colors.error.light).toBe("#C43B3B");
    expect(colors.error.dark).toBe("#E46464");
  });

  it("getColor returns correct color for fixed colors", () => {
    expect(getColor("primary", "light")).toBe("#D4AF37");
    expect(getColor("primary", "dark")).toBe("#D4AF37");
  });

  it("getColor returns correct color for theme-aware colors", () => {
    expect(getColor("background", "light")).toBe("#F7F7F5");
    expect(getColor("background", "dark")).toBe("#111111");
    expect(getColor("content", "light")).toBe("#171717");
    expect(getColor("content", "dark")).toBe("#F5F5F2");
  });

  it("getColor returns correct semantic colors", () => {
    expect(getColor("success", "light")).toBe("#16835B");
    expect(getColor("success", "dark")).toBe("#35B27F");
    expect(getColor("error", "light")).toBe("#C43B3B");
    expect(getColor("error", "dark")).toBe("#E46464");
  });

  it("all primary colors are valid hex strings", () => {
    expect(colors.primary).toMatch(/^#[0-9A-F]{6}$/i);
    expect(colors["primary-dark"]).toMatch(/^#[0-9A-F]{6}$/i);
    expect(colors["primary-light"]).toMatch(/^#[0-9A-F]{6}$/i);
  });

  it("all theme colors have light and dark variants", () => {
    expect(colors.background).toHaveProperty("light");
    expect(colors.background).toHaveProperty("dark");
    expect(colors.surface).toHaveProperty("light");
    expect(colors.surface).toHaveProperty("dark");
    expect(colors.border).toHaveProperty("light");
    expect(colors.border).toHaveProperty("dark");
  });
});
