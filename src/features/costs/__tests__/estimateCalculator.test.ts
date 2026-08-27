import { calculateEstimateTotals, formatKurus, tryToKurus } from '../utils/estimateCalculator';

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
          quantity: 8,
          unit: 'saat',
          unitPriceKurus: 35441,
        },
        {
          code: '10.100.1062',
          description: 'Düz işçi',
          quantity: 4,
          unit: 'saat',
          unitPriceKurus: 23437,
        },
      ],
      { overheadRate: 10, profitRate: 15, vatRate: 20 }
    );

    expect(totals).toEqual({
      grandTotalKurus: 572706,
      itemCount: 2,
      laborSubtotalKurus: 377276,
      overheadKurus: 37728,
      profitKurus: 62251,
      subtotalBeforeVatKurus: 477255,
      totalHours: 12,
      vatKurus: 95451,
    });
  });

  it('supports fractional quantities and rounds each line to kuruş', () => {
    const totals = calculateEstimateTotals(
      [
        {
          code: '10.100.1001',
          description: 'Taşçı ustası',
          quantity: 1.5,
          unit: 'saat',
          unitPriceKurus: 35441,
        },
      ],
      { overheadRate: 0, profitRate: 0, vatRate: 0 }
    );

    expect(totals.laborSubtotalKurus).toBe(53162);
    expect(totals.grandTotalKurus).toBe(53162);
  });
});
