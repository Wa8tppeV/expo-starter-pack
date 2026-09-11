import { createSeedData, NewProjectInput, useProjectOfficeStore } from '@project-office-store';

import { getDisciplineDetail } from '..';

jest.mock('react-native-mmkv', () => ({
  createMMKV: () => ({
    getString: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
  }),
}));

const newProject: NewProjectInput = {
  name: 'Çal Bağ Evi',
  employer: 'Özkan Ailesi',
  city: 'Denizli',
  district: 'Çal',
  neighborhood: 'Süller',
  block: '108',
  parcel: '7',
  projectType: 'Villa',
  licenseStatus: 'Hazırlanıyor',
  startDate: '2026-09-12',
  estimatedEndDate: '2027-03-30',
  note: 'Yeni yerel proje',
};

describe('ProjectOffice store', () => {
  beforeEach(() => {
    useProjectOfficeStore.setState(createSeedData());
  });

  it('yeni projeyle birlikte altı disiplini otomatik oluşturur', () => {
    const projectId = useProjectOfficeStore.getState().addProject(newProject);
    const state = useProjectOfficeStore.getState();

    expect(state.projects.find(project => project.id === projectId)?.name).toBe('Çal Bağ Evi');
    expect(state.disciplines.filter(discipline => discipline.projectId === projectId)).toHaveLength(
      6
    );
  });

  it('projeyi günceller ve arşivden geri yükler', () => {
    const projectId = useProjectOfficeStore.getState().addProject(newProject);
    useProjectOfficeStore
      .getState()
      .updateProject(projectId, { ...newProject, employer: 'DMH İnşaat' });
    useProjectOfficeStore.getState().archiveProject(projectId);

    expect(
      useProjectOfficeStore.getState().projects.find(project => project.id === projectId)?.employer
    ).toBe('DMH İnşaat');
    expect(
      useProjectOfficeStore.getState().projects.find(project => project.id === projectId)
        ?.archivedAt
    ).not.toBeNull();

    useProjectOfficeStore.getState().restoreProject(projectId);
    expect(
      useProjectOfficeStore.getState().projects.find(project => project.id === projectId)
        ?.archivedAt
    ).toBeNull();
  });

  it('disiplin sorumlusunu ve manuel ödenen tutarı günceller', () => {
    const projectId = useProjectOfficeStore.getState().addProject(newProject);
    const discipline = useProjectOfficeStore
      .getState()
      .disciplines.find(item => item.projectId === projectId && item.type === 'Mimari');

    expect(discipline).toBeDefined();
    useProjectOfficeStore.getState().updateDiscipline(discipline!.id, {
      professionalId: null,
      professionalName: 'Merve Kaya',
      professionalCompany: 'MK Mimarlık',
      phone: '+90 532 000 00 00',
      agreedFee: 150000,
      paidAmount: 50000,
      dueDate: '2026-12-20',
      status: 'Çalışılıyor',
      note: 'Avan proje hazırlanıyor.',
    });

    const state = useProjectOfficeStore.getState();
    const updated = state.disciplines.find(item => item.id === discipline!.id)!;
    const detail = getDisciplineDetail(updated, state);

    expect(detail.professional?.name).toBe('Merve Kaya');
    expect(detail.paidAmount).toBe(50000);
    expect(detail.remainingAmount).toBe(100000);
  });

  it('ödeme eklediğinde kalan tutarı otomatik azaltır', () => {
    const state = useProjectOfficeStore.getState();
    const discipline = state.disciplines.find(item => item.id === 'yalova-statik')!;
    const before = getDisciplineDetail(discipline, state).remainingAmount;

    useProjectOfficeStore.getState().addPayment({
      projectId: discipline.projectId,
      disciplineId: discipline.id,
      professionalId: discipline.professionalId!,
      amount: 25000,
      paidAt: '2026-09-12',
      note: 'Ara ödeme',
    });

    const nextState = useProjectOfficeStore.getState();
    expect(getDisciplineDetail(discipline, nextState).remainingAmount).toBe(before - 25000);
  });
});
