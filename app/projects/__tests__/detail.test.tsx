import React from 'react';

import { render, screen } from '@testing-library/react-native';

import ProjectDetailScreen from '../[id]';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'yalova-villa' }),
  useRouter: () => ({ back: jest.fn() }),
}));

describe('Proje detayı ekranı', () => {
  it('projenin genel bilgilerini gösterir', () => {
    render(<ProjectDetailScreen />);

    expect(screen.getByText('Yalova Villa Projesi')).toBeTruthy();
    expect(screen.getByText('Kuzey Yapı A.Ş.')).toBeTruthy();
    expect(screen.getByText('Kocadere, Çınarcık / Yalova')).toBeTruthy();
    expect(screen.getByText('184 / 12')).toBeTruthy();
  });

  it('altı proje disiplinini gösterir', () => {
    render(<ProjectDetailScreen />);

    for (const discipline of ['Mimari', 'Statik', 'Mekanik', 'Elektrik', 'Harita', 'Zemin Etüdü']) {
      expect(screen.getByText(discipline)).toBeTruthy();
    }
  });

  it('disiplin sorumlusu ve mali alanları gösterir', () => {
    render(<ProjectDetailScreen />);

    expect(screen.getByText('Ayşe Yılmaz')).toBeTruthy();
    expect(screen.getByText('+90 532 111 22 33')).toBeTruthy();
    expect(screen.getAllByText('Anlaşma')).toHaveLength(6);
    expect(screen.getAllByText('Ödenen')).toHaveLength(6);
    expect(screen.getAllByText('Kalan')).toHaveLength(6);
  });
});
