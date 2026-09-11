import { disciplines, payments, professionals, projects } from './data/mockData';
import { DISCIPLINE_TYPES, Discipline, DisciplineDetail, Project } from './types';

export function getProjectById(projectId: string): Project | undefined {
  return projects.find(project => project.id === projectId);
}

export function getDisciplineDetail(discipline: Discipline): DisciplineDetail {
  const professional = professionals.find(item => item.id === discipline.professionalId);

  if (!professional) {
    throw new Error(`Proje müellifi bulunamadı: ${discipline.professionalId}`);
  }

  const paidAmount = payments
    .filter(payment => payment.disciplineId === discipline.id)
    .reduce((total, payment) => total + payment.amount, 0);

  return {
    ...discipline,
    professional,
    paidAmount,
    remainingAmount: Math.max(discipline.agreedFee - paidAmount, 0),
  };
}

export function getProjectDisciplines(projectId: string): DisciplineDetail[] {
  return DISCIPLINE_TYPES.map(type =>
    disciplines.find(discipline => discipline.projectId === projectId && discipline.type === type)
  )
    .filter((discipline): discipline is Discipline => Boolean(discipline))
    .map(getDisciplineDetail);
}

export function getUpcomingDiscipline(projectId: string): DisciplineDetail | undefined {
  return getProjectDisciplines(projectId)
    .filter(discipline => discipline.status !== 'Tamamlandı')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
}

export function getProjectRemainingDebt(projectId: string): number {
  return getProjectDisciplines(projectId).reduce(
    (total, discipline) => total + discipline.remainingAmount,
    0
  );
}

export function getDashboardSummary(referenceDate = new Date()) {
  const activeProjects = projects.filter(project => project.status === 'Aktif');
  const completedProjects = projects.filter(project => project.status === 'Tamamlandı');
  const month = referenceDate.getMonth();
  const year = referenceDate.getFullYear();
  const activeDisciplines = activeProjects.flatMap(project => getProjectDisciplines(project.id));

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
      (total, project) => total + getProjectRemainingDebt(project.id),
      0
    ),
    dueThisMonth,
    overdueCount,
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(value);
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
