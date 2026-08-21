/**
 * DMH İnşaat color system.
 * Single source of truth for light/dark theme colors.
 */

export interface ColorScale {
  light: string;
  dark: string;
}

export const colors = {
  primary: "#D4AF37",
  "primary-dark": "#A88722",
  "primary-light": "#E6CD78",

  accent: "#171717",
  "accent-dark": "#0B0B0B",
  "accent-light": "#333333",

  background: {
    light: "#F7F7F5",
    dark: "#111111",
  },
  surface: {
    light: "#EFEFEA",
    dark: "#1B1B1B",
  },
  "surface-elevated": {
    light: "#FFFFFF",
    dark: "#242424",
  },
  border: {
    light: "#E2E2DC",
    dark: "#353535",
  },
  content: {
    light: "#171717",
    dark: "#F5F5F2",
  },
  "content-secondary": {
    light: "#666666",
    dark: "#B8B8B3",
  },
  "content-tertiary": {
    light: "#8C8C86",
    dark: "#80807A",
  },

  success: {
    light: "#16835B",
    dark: "#35B27F",
  },
  warning: {
    light: "#C88719",
    dark: "#E5A838",
  },
  error: {
    light: "#C43B3B",
    dark: "#E46464",
  },
  info: {
    light: "#356FA8",
    dark: "#67A2D9",
  },
} as const;

export function getColor(colorKey: string, theme: "light" | "dark"): string {
  const color = colors[colorKey as keyof typeof colors];

  if (typeof color === "string") {
    return color;
  }

  return color[theme];
}

export default colors;
