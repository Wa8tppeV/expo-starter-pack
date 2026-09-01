import { formatKurus, tryToKurus } from '../../catalog';
import { calculateEstimateTotals } from '../utils/estimateCalculator';

describe('Estimate calculator', () => {
  it('stores TRY amounts as integer kuruş', () => {
    expect(tryToKurus(354.41)).toBe(35441);
    expect(formatKurus(35441)).toContain('354,41');
  });

  it('calculates overhead, profit and VAT in order without floating point drift', () => {
    const totals = calculateEstimateTotals(
      [
        {
          code: '10.100.1001',
          description: 'Taşçı ustası',
          itemId: 'yfk-insaat-2026-08:labor:10.100.1001',
          kind: 'labor',
          quantity: 8,
          sourceVersionId: 'yfk-insaat-2026-08',
          unit: 'saat',
          unitPriceKurus: 35441,
        },
        {
          code: '10.100.1062',
          description: 'Düz işçi',
          itemId: 'yfk-insaat-2026-08:labor:10.100.1062',
          kind: 'labor',
          quantity: 4,
          sourceVersionId: 'yfk-insaat-2026-08',
          unit: 'saat',
          unitPriceKurus: 23437,
        },
      ],
      { overheadRate: 10, profitRate: 15, vatRate: 20 }
    );

    expect(totals).toEqual({
      constructionSubtotalKurus: 0,
      directSubtotalKurus: 377276,
      electricalSubtotalKurus: 0,
      equipmentSubtotalKurus: 0,
      grandTotalKurus: 572706,
      itemCount: 2,
      laborSubtotalKurus: 377276,
      materialSubtotalKurus: 0,
      mechanicalSubtotalKurus: 0,
      overheadKurus: 37728,
      profitKurus: 62251,
      subtotalBeforeVatKurus: 477255,
      totalHours: 12,
      transportSubtotalKurus: 0,
      vatKurus: 95451,
    });
  });

  it('supports fractional quantities and rounds each line to kuruş', () => {
    const totals = calculateEstimateTotals(
      [
        {
          code: '10.100.1001',
          description: 'Taşçı ustası',
          itemId: 'yfk-insaat-2026-08:labor:10.100.1001',
          kind: 'labor',
          quantity: 1.5,
          sourceVersionId: 'yfk-insaat-2026-08',
          unit: 'saat',
          unitPriceKurus: 35441,
        },
      ],
      { overheadRate: 0, profitRate: 0, vatRate: 0 }
    );

    expect(totals.laborSubtotalKurus).toBe(53162);
    expect(totals.grandTotalKurus).toBe(53162);
  });

  it('separates all direct-cost kinds while applying adjustments to their sum', () => {
    const shared = { quantity: 2, sourceVersionId: 'yfk-insaat-2026-08', unit: 'Ad' };
    const totals = calculateEstimateTotals(
      [
        {
          ...shared,
          code: 'M1',
          description: 'Malzeme',
          itemId: 'material:M1',
          kind: 'material',
          unitPriceKurus: 10000,
        },
        {
          ...shared,
          code: 'E1',
          description: 'Makine',
          itemId: 'equipment:E1',
          kind: 'equipment',
          unitPriceKurus: 20000,
        },
        {
          ...shared,
          code: 'T1',
          description: 'Nakliye',
          itemId: 'transport:T1',
          kind: 'transport',
          unitPriceKurus: 30000,
        },
        {
          ...shared,
          code: 'C1',
          description: 'İnşaat pozu',
          itemId: 'construction:C1',
          kind: 'construction',
          unitPriceKurus: 40000,
        },
        {
          ...shared,
          code: 'H1',
          description: 'Mekanik poz',
          itemId: 'mechanical:H1',
          kind: 'mechanical',
          unitPriceKurus: 50000,
        },
        {
          ...shared,
          code: 'X1',
          description: 'Elektrik poz',
          itemId: 'electrical:X1',
          kind: 'electrical',
          unitPriceKurus: 60000,
        },
      ],
      { overheadRate: 0, profitRate: 0, vatRate: 0 }
    );

    expect(totals.directSubtotalKurus).toBe(420000);
    expect(totals.materialSubtotalKurus).toBe(20000);
    expect(totals.equipmentSubtotalKurus).toBe(40000);
    expect(totals.transportSubtotalKurus).toBe(60000);
    expect(totals.constructionSubtotalKurus).toBe(80000);
    expect(totals.mechanicalSubtotalKurus).toBe(100000);
    expect(totals.electricalSubtotalKurus).toBe(120000);
  });
});
