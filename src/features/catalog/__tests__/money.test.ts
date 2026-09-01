import {
  applyRateBasisPoints,
  assertKurus,
  calculateCatalogTotals,
  calculateLineTotalKurus,
  formatKurus,
  kurusToTry,
  sumKurus,
  tryToKurus,
} from '../money';
import { CatalogItem } from '../types';

const item = (code: string, kind: CatalogItem['kind'], unitPriceKurus: number): CatalogItem => ({
  category: 'Test',
  code,
  kind,
  name: `${kind} item`,
  sourceVersionId: 'source',
  unit: 'adet',
  unitPriceKurus,
});

describe('kuruş money calculations', () => {
  it('converts TRY to kuruş using commercial rounding', () => {
    expect(tryToKurus(1)).toBe(100);
    expect(tryToKurus(1.005)).toBe(101);
    expect(tryToKurus(1234.567)).toBe(123_457);
    expect(kurusToTry(123_457)).toBe(1234.57);
  });

  it('rejects non-finite TRY and non-integer kuruş values', () => {
    expect(() => tryToKurus(Number.NaN)).toThrow('finite');
    expect(() => tryToKurus(Number.POSITIVE_INFINITY)).toThrow('finite');
    expect(() => assertKurus(1.2)).toThrow('safe integer');
  });

  it('sums only safe integer kuruş amounts and detects overflow', () => {
    expect(sumKurus([100, 250, -50])).toBe(300);
    expect(() => sumKurus([100, 2.5])).toThrow('safe integer');
    expect(() => sumKurus([Number.MAX_SAFE_INTEGER, 1])).toThrow('sum');
  });

  it('calculates fractional-quantity line totals once at the kuruş boundary', () => {
    expect(calculateLineTotalKurus(12_345, 2.5)).toBe(30_863);
    expect(calculateLineTotalKurus(10_001, 0)).toBe(0);
  });

  it('rejects invalid line quantities and negative unit prices', () => {
    expect(() => calculateLineTotalKurus(-1, 1)).toThrow('cannot be negative');
    expect(() => calculateLineTotalKurus(100, -1)).toThrow('non-negative finite');
    expect(() => calculateLineTotalKurus(100, Number.NaN)).toThrow('non-negative finite');
  });

  it('applies integer basis-point rates with kuruş rounding', () => {
    expect(applyRateBasisPoints(10_001, 2_000)).toBe(2_000);
    expect(applyRateBasisPoints(10_001, 1_500)).toBe(1_500);
    expect(applyRateBasisPoints(10_000, -500)).toBe(-500);
    expect(() => applyRateBasisPoints(100, 10.5)).toThrow('safe integer');
  });

  it('totals every item kind and retains zero-valued subtotals', () => {
    const totals = calculateCatalogTotals([
      { item: item('L1', 'labor', 10_001), quantity: 2.5 },
      { item: item('M1', 'material', 20_000), quantity: 3 },
      { item: item('E1', 'equipment', 50_000), quantity: 0 },
      { item: item('T1', 'transport', 1_250), quantity: 10 },
    ]);

    expect(totals).toEqual({
      grandTotalKurus: 97_503,
      itemCount: 3,
      kindSubtotals: [
        { kind: 'labor', totalKurus: 25_003 },
        { kind: 'material', totalKurus: 60_000 },
        { kind: 'equipment', totalKurus: 0 },
        { kind: 'transport', totalKurus: 12_500 },
        { kind: 'construction', totalKurus: 0 },
        { kind: 'mechanical', totalKurus: 0 },
        { kind: 'electrical', totalKurus: 0 },
      ],
      unitQuantities: [{ quantity: 15.5, unit: 'adet' }],
    });
  });

  it('formats Turkish lira from integer kuruş', () => {
    const formatted = formatKurus(123_456);

    expect(formatted).toContain('1.234,56');
    expect(formatted).toContain('₺');
  });
});
