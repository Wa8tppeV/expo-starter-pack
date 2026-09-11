export const DISCIPLINE_TYPES = [
  'Mimari',
  'Statik',
  'Mekanik',
  'Elektrik',
  'Harita',
  'Zemin Etüdü',
] as const;

export type DisciplineType = (typeof DISCIPLINE_TYPES)[number];

export type WorkStatus =
  'Başlamadı' | 'Çalışılıyor' | 'Revizyonda' | 'Onay Bekliyor' | 'Tamamlandı';

export type ProjectStatus = 'Aktif' | 'Tamamlandı';

export type LicenseStatus = 'Hazırlanıyor' | 'Başvuruda' | 'Ruhsat Alındı';

export interface Project {
  id: string;
  name: string;
  employer: string;
  city: string;
  district: string;
  neighborhood: string;
  block: string;
  parcel: string;
  projectType: string;
  licenseStatus: LicenseStatus;
  status: ProjectStatus;
  progress: number;
  startDate: string;
  estimatedEndDate: string;
  note: string;
  archivedAt: string | null;
}

export interface Discipline {
  id: string;
  projectId: string;
  type: DisciplineType;
  professionalId: string | null;
  agreedFee: number;
  paidAdjustment: number;
  status: WorkStatus;
  dueDate: string;
  note: string;
}

export interface Professional {
  id: string;
  name: string;
  company?: string;
  phone: string;
  disciplines: DisciplineType[];
}

export interface Payment {
  id: string;
  projectId: string;
  disciplineId: string;
  professionalId: string;
  amount: number;
  paidAt: string;
  note?: string;
}

export interface DisciplineDetail extends Discipline {
  professional?: Professional;
  paidAmount: number;
  remainingAmount: number;
}

export interface ProjectOfficeData {
  projects: Project[];
  disciplines: Discipline[];
  professionals: Professional[];
  payments: Payment[];
}
