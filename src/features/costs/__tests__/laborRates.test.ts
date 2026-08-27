import { LABOR_RATES } from '../data/laborRates';
import { calculateLaborEstimate, formatTry } from '../utils/laborCalculator';

describe('Labor rates', () => {
  it('contains the complete 2026 building labor range', () => {
    expect(LABOR_RATES).toHaveLength(91);
    expect(LABOR_RATES[0].code).toBe('10.100.1001');
    expect(LABOR_RATES.at(-1)?.code).toBe('10.100.1091');
  });

  it('has unique codes and positive prices', () => {
    const codes = LABOR_RATES.map(item => item.code);

    expect(new Set(codes).size).toBe(LABOR_RATES.length);
    expect(LABOR_RATES.every(item => item.hourlyRate > 0)).toBe(true);
  });

  it('calculates selected labor hours and total', () => {
    const estimate = calculateLaborEstimate(LABOR_RATES, {
      '10.100.1001': 8,
      '10.100.1062': 4,
    });

    expect(estimate.itemCount).toBe(2);
    expect(estimate.totalHours).toBe(12);
    expect(estimate.total).toBeCloseTo(3772.76);
  });

  it('formats Turkish lira values', () => {
    expect(formatTry(354.41)).toContain('354,41');
  });
});
