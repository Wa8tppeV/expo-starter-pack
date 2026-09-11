import { disciplines, payments, professionals, projects } from './data/mockData';
import {
  DISCIPLINE_TYPES,
  Discipline,
  DisciplineDetail,
  Project,
  ProjectOfficeData,
} from './types';

export const mockProjectOfficeData: ProjectOfficeData = {
  projects,
  disciplines,
  professionals,
  payments,
};

export function getProjectById(
  projectId: string,
  data: ProjectOfficeData = mockProjectOfficeData
): Project | undefined {
  return data.projects.find(project => project.id === projectId);
}

export function getDisciplineDetail(
  discipline: Discipline,
  data: ProjectOfficeData = mockProjectOfficeData
): DisciplineDetail {
  const professional = data.professionals.find(item => item.id === discipline.professionalId);
  const recordedPayments = data.payments
    .filter(payment => payment.disciplineId === discipline.id)
    .reduce((total, payment) => total + payment.amount, 0);
  const paidAmount = Math.max(recordedPayments + discipline.paidAdjustment, 0);

  return {
    ...discipline,
    professional,
    paidAmount,
    remainingAmount: Math.max(discipline.agreedFee - paidAmount, 0),
  };
}

export function getProjectDisciplines(
  projectId: string,
  data: ProjectOfficeData = mockProjectOfficeData
): DisciplineDetail[] {
  return DISCIPLINE_TYPES.map(type =>
    data.disciplines.find(
      discipline => discipline.projectId === projectId && discipline.type === type
    )
  )
    .filter((discipline): discipline is Discipline => Boolean(discipline))
    .map(discipline => getDisciplineDetail(discipline, data));
}

export function getUpcomingDiscipline(
  projectId: string,
  data: ProjectOfficeData = mockProjectOfficeData
): DisciplineDetail | undefined {
  return getProjectDisciplines(projectId, data)
    .filter(discipline => discipline.status !== 'Tamamlandı')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
}

export function getProfessionalAssignments(
  professionalId: string,
  data: ProjectOfficeData = mockProjectOfficeData
) {
  return data.disciplines
    .filter(discipline => discipline.professionalId === professionalId)
    .map(discipline => ({
      project: getProjectById(discipline.projectId, data),
      discipline: getDisciplineDetail(discipline, data),
    }))
    .filter(assignment => assignment.project !== undefined);
}

export function getProfessionalSummary(
  professionalId: string,
  data: ProjectOfficeData = mockProjectOfficeData
) {
  const assignments = getProfessionalAssignments(professionalId, data);

  return {
    activeProjectCount: new Set(
      assignments
        .filter(({ project }) => project?.status === 'Aktif' && !project.archivedAt)
        .map(({ project }) => project?.id)
    ).size,
    totalAgreed: assignments.reduce((total, { discipline }) => total + discipline.agreedFee, 0),
    totalPaid: assignments.reduce((total, { discipline }) => total + discipline.paidAmount, 0),
    totalRemaining: assignments.reduce(
      (total, { discipline }) => total + discipline.remainingAmount,
      0
    ),
  };
}

export function getProjectRemainingDebt(
  projectId: string,
  data: ProjectOfficeData = mockProjectOfficeData
): number {
  return getProjectDisciplines(projectId, data).reduce(
    (total, discipline) => total + discipline.remainingAmount,
    0
  );
}

export function getDashboardSummary(
  data: ProjectOfficeData = mockProjectOfficeData,
  referenceDate = new Date()
) {
  const activeProjects = data.projects.filter(
    project => project.status === 'Aktif' && !project.archivedAt
  );
  const completedProjects = data.projects.filter(
    project => project.status === 'Tamamlandı' && !project.archivedAt
  );
  const month = referenceDate.getMonth();
  const year = referenceDate.getFullYear();
  const activeDisciplines = activeProjects.flatMap(project =>
    getProjectDisciplines(project.id, data)
  );

  const overdueCount = activeDisciplines.filter(discipline => {
    const dueDate = new Date(`${discipline.dueDate}T00:00:00`);
    return discipline.status !== 'Tamamlandı' && dueDate < referenceDate;
  }).length;

  const dueThisMonth = activeDisciplines
    .filter(discipline => {
      const dueDate = new Date(`${discipline.dueDate}T00:00:00`);
      return dueDate.getMonth() === month && dueDate.getFullYear() === year;
    })
    .reduce((total, discipline) => total + discipline.remainingAmount, 0);

  return {
    activeCount: activeProjects.length,
    completedCount: completedProjects.length,
    totalDebt: activeProjects.reduce(
      (total, project) => total + getProjectRemainingDebt(project.id, data),
      0
    ),
    dueThisMonth,
    overdueCount,
  };
}

export function formatCurrency(value: number): string {
  const amount = new Intl.NumberFormat('tr-TR', {
    maximumFractionDigits: 0,
  }).format(value);

  return `${amount} ₺`;
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

export function formatShortDate(value: string): string {
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(`${value}T00:00:00`));
}
