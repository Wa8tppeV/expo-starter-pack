import {
  DISCIPLINE_TYPES,
  getDashboardSummary,
  getProjectById,
  getProjectDisciplines,
  getProjectRemainingDebt,
} from '..';

describe('proje veri seçicileri', () => {
  it('her proje için altı disiplini tanımlı sırada döndürür', () => {
    const projectDisciplines = getProjectDisciplines('yalova-villa');

    expect(projectDisciplines.map(discipline => discipline.type)).toEqual(DISCIPLINE_TYPES);
  });

  it('ödemelerden kalan proje borcunu hesaplar', () => {
    expect(getProjectRemainingDebt('yalova-villa')).toBe(410000);
  });

  it('proje kimliğine göre doğru projeyi bulur', () => {
    expect(getProjectById('sahil-konutlari')?.name).toBe('Sahil Konutları');
    expect(getProjectById('bilinmeyen')).toBeUndefined();
  });

  it('ana ekran özetini merkezi veriden üretir', () => {
    const summary = getDashboardSummary(new Date('2026-09-11T12:00:00'));

    expect(summary.activeCount).toBe(2);
    expect(summary.completedCount).toBe(1);
    expect(summary.totalDebt).toBe(1364000);
    expect(summary.overdueCount).toBe(1);
  });
});
