import {
  DISCIPLINE_TYPES,
  mockProjectOfficeData,
  getDashboardSummary,
  getProjectById,
  getProjectDisciplines,
  getProjectRemainingDebt,
  getProfessionalAssignments,
  getProfessionalSummary,
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
    expect(getProjectById('sahil-konutlari')?.name).toBe('Aşağıseyit Konutları');
    expect(getProjectById('bilinmeyen')).toBeUndefined();
  });

  it('ana ekran özetini merkezi veriden üretir', () => {
    const summary = getDashboardSummary(mockProjectOfficeData, new Date('2026-09-11T12:00:00'));

    expect(summary.activeCount).toBe(2);
    expect(summary.completedCount).toBe(1);
    expect(summary.totalDebt).toBe(1364000);
    expect(summary.overdueCount).toBe(1);
  });

  it('projecinin proje ve finans özetini disiplinlerden hesaplar', () => {
    const assignments = getProfessionalAssignments('ayse-yilmaz');
    const summary = getProfessionalSummary('ayse-yilmaz');

    expect(assignments.map(item => item.discipline.type)).toEqual(['Mimari', 'Mimari', 'Mimari']);
    expect(summary.activeProjectCount).toBe(2);
    expect(summary.totalAgreed).toBeGreaterThan(summary.totalPaid);
    expect(summary.totalRemaining).toBe(summary.totalAgreed - summary.totalPaid);
  });
});
