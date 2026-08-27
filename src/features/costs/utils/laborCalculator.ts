import { LaborRate } from '../data/laborRates';

export type LaborHours = Record<string, number>;

export function calculateLaborEstimate(rates: LaborRate[], hours: LaborHours) {
  return rates.reduce(
    (estimate, item) => {
      const itemHours = hours[item.code] ?? 0;

      return {
        itemCount: estimate.itemCount + (itemHours > 0 ? 1 : 0),
        total: estimate.total + itemHours * item.hourlyRate,
        totalHours: estimate.totalHours + itemHours,
      };
    },
    { itemCount: 0, total: 0, totalHours: 0 }
  );
}

export function formatTry(value: number) {
  return new Intl.NumberFormat('tr-TR', {
    currency: 'TRY',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: 'currency',
  }).format(value);
}
