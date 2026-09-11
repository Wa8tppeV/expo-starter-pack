import React from 'react';

import { render, screen } from '@testing-library/react-native';

import Index from '../index';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('@hooks', () => ({
  useTheme: () => ({
    theme: 'light',
    toggleTheme: jest.fn(),
  }),
}));

describe('Ana ekran', () => {
  it('proje ofisi özetini gösterir', () => {
    render(<Index />);

    expect(screen.getByText('Proje Ofisi')).toBeTruthy();
    expect(screen.getByText('₺1.285.000')).toBeTruthy();
    expect(screen.getByText('4')).toBeTruthy();
    expect(screen.getByText('12')).toBeTruthy();
    expect(screen.getByText('3 geciken iş var')).toBeTruthy();
  });

  it('demo aktif projelerini gösterir', () => {
    render(<Index />);

    expect(screen.getByText('Yalova Villa Projesi')).toBeTruthy();
    expect(screen.getByText('Sahil Konutları')).toBeTruthy();
    expect(screen.getByText('Merkez Ofis')).toBeTruthy();
  });
});
