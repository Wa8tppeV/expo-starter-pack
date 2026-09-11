import React from 'react';

import { render, screen } from '@testing-library/react-native';

import ProjectsScreen from '../index';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: jest.fn(),
    push: jest.fn(),
  }),
}));

describe('Projeler ekranı', () => {
  it('merkezi demo verideki projeleri listeler', () => {
    render(<ProjectsScreen />);

    expect(screen.getByText('Çal Bağ Evleri')).toBeTruthy();
    expect(screen.getByText('Aşağıseyit Konutları')).toBeTruthy();
    expect(screen.getByText('DMH Çal Ofisi')).toBeTruthy();
  });

  it('proje kartında temel takip alanlarını gösterir', () => {
    render(<ProjectsScreen />);

    expect(screen.getByText('Özkan Ailesi')).toBeTruthy();
    expect(screen.getByText('Süller, Çal / Denizli')).toBeTruthy();
    expect(screen.getByText('Ada 184 · Parsel 12')).toBeTruthy();
    expect(screen.getByText('Başvuruda')).toBeTruthy();
    expect(screen.getByText('Mimari teslimi · 16 Eyl')).toBeTruthy();
  });
});
