import { createMMKV } from 'react-native-mmkv';
import { create } from 'zustand';
import type { StateStorage } from 'zustand/middleware';

import { disciplines, payments, professionals, projects } from '../data/mockData';
import {
  DISCIPLINE_TYPES,
  Discipline,
  DisciplineType,
  LicenseStatus,
  Payment,
  Professional,
  Project,
  ProjectOfficeData,
  WorkStatus,
} from '../types';

// Metro web currently emits Zustand's ESM middleware as a classic script.
// Requiring the equivalent CJS entry prevents an unsupported `import.meta` token.
/* eslint-disable @typescript-eslint/no-require-imports */
const { createJSONStorage, persist } =
  require('zustand/middleware') as typeof import('zustand/middleware');
/* eslint-enable @typescript-eslint/no-require-imports */

const storage = createMMKV();

const zustandStorage: StateStorage = {
  getItem: key => storage.getString(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: key => storage.remove(key),
};

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createSeedData(): ProjectOfficeData {
  return {
    projects: projects.map(project => ({ ...project })),
    disciplines: disciplines.map(discipline => ({ ...discipline })),
    professionals: professionals.map(professional => ({
      ...professional,
      disciplines: [...professional.disciplines],
    })),
    payments: payments.map(payment => ({ ...payment })),
  };
}

export type NewProjectInput = Omit<Project, 'id' | 'status' | 'progress' | 'archivedAt'> & {
  licenseStatus: LicenseStatus;
};

export interface DisciplineUpdateInput {
  professionalId: string | null;
  professionalName: string;
  professionalCompany?: string;
  phone: string;
  agreedFee: number;
  paidAmount: number;
  dueDate: string;
  status: WorkStatus;
  note: string;
}

export interface NewPaymentInput {
  projectId: string;
  disciplineId: string;
  professionalId: string;
  amount: number;
  paidAt: string;
  note?: string;
}

interface ProjectOfficeActions {
  addProject: (input: NewProjectInput) => string;
  updateProject: (projectId: string, input: NewProjectInput) => void;
  archiveProject: (projectId: string) => void;
  restoreProject: (projectId: string) => void;
  updateDiscipline: (disciplineId: string, input: DisciplineUpdateInput) => void;
  addPayment: (input: NewPaymentInput) => string;
}

export type ProjectOfficeStore = ProjectOfficeData & ProjectOfficeActions;

function addDisciplineType(
  currentTypes: DisciplineType[],
  disciplineType: DisciplineType
): DisciplineType[] {
  return currentTypes.includes(disciplineType) ? currentTypes : [...currentTypes, disciplineType];
}

export const useProjectOfficeStore = create<ProjectOfficeStore>()(
  persist(
    (set, get) => ({
      ...createSeedData(),

      addProject: input => {
        const projectId = createId('project');
        const project: Project = {
          ...input,
          id: projectId,
          status: 'Aktif',
          progress: 0,
          archivedAt: null,
        };
        const projectDisciplines: Discipline[] = DISCIPLINE_TYPES.map(type => ({
          id: createId(`discipline-${type.toLocaleLowerCase('tr-TR').replaceAll(' ', '-')}`),
          projectId,
          type,
          professionalId: null,
          agreedFee: 0,
          paidAdjustment: 0,
          status: 'Başlamadı',
          dueDate: input.estimatedEndDate,
          note: '',
        }));

        set(state => ({
          projects: [...state.projects, project],
          disciplines: [...state.disciplines, ...projectDisciplines],
        }));

        return projectId;
      },

      updateProject: (projectId, input) => {
        set(state => ({
          projects: state.projects.map(project =>
            project.id === projectId ? { ...project, ...input } : project
          ),
        }));
      },

      archiveProject: projectId => {
        set(state => ({
          projects: state.projects.map(project =>
            project.id === projectId
              ? { ...project, archivedAt: new Date().toISOString() }
              : project
          ),
        }));
      },

      restoreProject: projectId => {
        set(state => ({
          projects: state.projects.map(project =>
            project.id === projectId ? { ...project, archivedAt: null } : project
          ),
        }));
      },

      updateDiscipline: (disciplineId, input) => {
        const currentDiscipline = get().disciplines.find(item => item.id === disciplineId);
        if (!currentDiscipline) return;

        let professionalId = input.professionalId;
        const trimmedName = input.professionalName.trim();
        let nextProfessionals = get().professionals;

        if (trimmedName) {
          const existingProfessional = professionalId
            ? nextProfessionals.find(item => item.id === professionalId)
            : undefined;

          if (existingProfessional) {
            nextProfessionals = nextProfessionals.map(professional =>
              professional.id === professionalId
                ? {
                    ...professional,
                    name: trimmedName,
                    company: input.professionalCompany?.trim() || undefined,
                    phone: input.phone.trim(),
                    disciplines: addDisciplineType(
                      professional.disciplines,
                      currentDiscipline.type
                    ),
                  }
                : professional
            );
          } else {
            professionalId = createId('professional');
            const professional: Professional = {
              id: professionalId,
              name: trimmedName,
              company: input.professionalCompany?.trim() || undefined,
              phone: input.phone.trim(),
              disciplines: [currentDiscipline.type],
            };
            nextProfessionals = [...nextProfessionals, professional];
          }
        } else {
          professionalId = null;
        }

        const recordedPayments = get()
          .payments.filter(payment => payment.disciplineId === disciplineId)
          .reduce((total, payment) => total + payment.amount, 0);

        set(state => ({
          professionals: nextProfessionals,
          disciplines: state.disciplines.map(discipline =>
            discipline.id === disciplineId
              ? {
                  ...discipline,
                  professionalId,
                  agreedFee: Math.max(input.agreedFee, 0),
                  paidAdjustment: Math.max(input.paidAmount, 0) - recordedPayments,
                  dueDate: input.dueDate,
                  status: input.status,
                  note: input.note.trim(),
                }
              : discipline
          ),
        }));
      },

      addPayment: input => {
        const paymentId = createId('payment');
        const payment: Payment = {
          ...input,
          id: paymentId,
          amount: Math.max(input.amount, 0),
          note: input.note?.trim() || undefined,
        };

        set(state => ({ payments: [...state.payments, payment] }));
        return paymentId;
      },
    }),
    {
      name: 'dmh-project-office-v1',
      storage: createJSONStorage(() => zustandStorage),
      partialize: state => ({
        projects: state.projects,
        disciplines: state.disciplines,
        professionals: state.professionals,
        payments: state.payments,
      }),
    }
  )
);
