import { colors, getColor } from '../colors';

describe('Color Constants', () => {
  it('exports primary colors', () => {
    expect(colors.primary).toBe('#C17F4F');
    expect(colors['primary-dark']).toBe('#A86D42');
    expect(colors['primary-light']).toBe('#D19968');
  });

  it('exports accent colors', () => {
    expect(colors.accent).toBe('#9B6B4F');
    expect(colors['accent-dark']).toBe('#7D5840');
    expect(colors['accent-light']).toBe('#B8836A');
  });

  it('exports light theme colors', () => {
    expect(colors.background.light).toBe('#FCFAF8');
    expect(colors['content'].light).toBe('#1A1715');
    expect(colors.surface.light).toBe('#F5F1ED');
  });

  it('exports dark theme colors', () => {
    expect(colors.background.dark).toBe('#1A1715');
    expect(colors['content'].dark).toBe('#F5F1ED');
    expect(colors.surface.dark).toBe('#2B2823');
  });

  it('exports semantic colors with light/dark variants', () => {
    expect(colors.success.light).toBe('#2D7A4F');
    expect(colors.success.dark).toBe('#40A36D');
    expect(colors.error.light).toBe('#C73E3A');
    expect(colors.error.dark).toBe('#E05550');
  });

  it('getColor returns correct color for fixed colors', () => {
    expect(getColor('primary', 'light')).toBe('#C17F4F');
    expect(getColor('primary', 'dark')).toBe('#C17F4F');
  });

  it('getColor returns correct color for theme-aware colors', () => {
    expect(getColor('background', 'light')).toBe('#FCFAF8');
    expect(getColor('background', 'dark')).toBe('#1A1715');
    expect(getColor('content', 'light')).toBe('#1A1715');
    expect(getColor('content', 'dark')).toBe('#F5F1ED');
  });

  it('getColor returns correct semantic colors', () => {
    expect(getColor('success', 'light')).toBe('#2D7A4F');
    expect(getColor('success', 'dark')).toBe('#40A36D');
    expect(getColor('error', 'light')).toBe('#C73E3A');
    expect(getColor('error', 'dark')).toBe('#E05550');
  });

  it('all primary colors are valid hex strings', () => {
    expect(colors.primary).toMatch(/^#[0-9A-F]{6}$/i);
    expect(colors['primary-dark']).toMatch(/^#[0-9A-F]{6}$/i);
    expect(colors['primary-light']).toMatch(/^#[0-9A-F]{6}$/i);
  });

  it('all theme colors have light and dark variants', () => {
    expect(colors.background).toHaveProperty('light');
    expect(colors.background).toHaveProperty('dark');
    expect(colors.surface).toHaveProperty('light');
    expect(colors.surface).toHaveProperty('dark');
    expect(colors.border).toHaveProperty('light');
    expect(colors.border).toHaveProperty('dark');
  });
});
