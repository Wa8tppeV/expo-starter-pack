import { EstimateAdjustments, EstimateLine, EstimateTotals } from '../types';

export const DEFAULT_ESTIMATE_ADJUSTMENTS: EstimateAdjustments = {
  overheadRate: 10,
  profitRate: 15,
  vatRate: 20,
};

export function tryToKurus(value: number) {
  return Math.round(value * 100);
}

export function calculateEstimateTotals(
  lines: EstimateLine[],
  adjustments: EstimateAdjustments
): EstimateTotals {
  const laborSubtotalKurus = lines.reduce(
    (total, line) => total + Math.round(line.unitPriceKurus * line.quantity),
    0
  );
  const overheadKurus = Math.round(laborSubtotalKurus * (adjustments.overheadRate / 100));
  const profitBaseKurus = laborSubtotalKurus + overheadKurus;
  const profitKurus = Math.round(profitBaseKurus * (adjustments.profitRate / 100));
  const subtotalBeforeVatKurus = profitBaseKurus + profitKurus;
  const vatKurus = Math.round(subtotalBeforeVatKurus * (adjustments.vatRate / 100));

  return {
    grandTotalKurus: subtotalBeforeVatKurus + vatKurus,
    itemCount: lines.filter(line => line.quantity > 0).length,
    laborSubtotalKurus,
    overheadKurus,
    profitKurus,
    subtotalBeforeVatKurus,
    totalHours: lines.reduce((total, line) => total + line.quantity, 0),
    vatKurus,
  };
}

export function formatKurus(valueKurus: number) {
  return new Intl.NumberFormat('tr-TR', {
    currency: 'TRY',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: 'currency',
  }).format(valueKurus / 100);
}
