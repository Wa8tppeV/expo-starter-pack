import { EstimateAdjustments, EstimateLine, EstimateTotals } from '../types';

export const DEFAULT_ESTIMATE_ADJUSTMENTS: EstimateAdjustments = {
  overheadRate: 10,
  profitRate: 15,
  vatRate: 20,
};

export function calculateEstimateTotals(
  lines: EstimateLine[],
  adjustments: EstimateAdjustments
): EstimateTotals {
  const subtotalForKind = (kind: EstimateLine['kind']) =>
    lines
      .filter(line => line.kind === kind)
      .reduce((total, line) => total + Math.round(line.unitPriceKurus * line.quantity), 0);
  const laborSubtotalKurus = subtotalForKind('labor');
  const materialSubtotalKurus = subtotalForKind('material');
  const equipmentSubtotalKurus = subtotalForKind('equipment');
  const transportSubtotalKurus = subtotalForKind('transport');
  const constructionSubtotalKurus = subtotalForKind('construction');
  const mechanicalSubtotalKurus = subtotalForKind('mechanical');
  const electricalSubtotalKurus = subtotalForKind('electrical');
  const directSubtotalKurus =
    laborSubtotalKurus +
    materialSubtotalKurus +
    equipmentSubtotalKurus +
    transportSubtotalKurus +
    constructionSubtotalKurus +
    mechanicalSubtotalKurus +
    electricalSubtotalKurus;
  const overheadKurus = Math.round(directSubtotalKurus * (adjustments.overheadRate / 100));
  const profitBaseKurus = directSubtotalKurus + overheadKurus;
  const profitKurus = Math.round(profitBaseKurus * (adjustments.profitRate / 100));
  const subtotalBeforeVatKurus = profitBaseKurus + profitKurus;
  const vatKurus = Math.round(subtotalBeforeVatKurus * (adjustments.vatRate / 100));

  return {
    constructionSubtotalKurus,
    directSubtotalKurus,
    electricalSubtotalKurus,
    equipmentSubtotalKurus,
    grandTotalKurus: subtotalBeforeVatKurus + vatKurus,
    itemCount: lines.filter(line => line.quantity > 0).length,
    laborSubtotalKurus,
    materialSubtotalKurus,
    mechanicalSubtotalKurus,
    overheadKurus,
    profitKurus,
    subtotalBeforeVatKurus,
    totalHours: lines
      .filter(line => line.kind === 'labor')
      .reduce((total, line) => total + line.quantity, 0),
    transportSubtotalKurus,
    vatKurus,
  };
}
