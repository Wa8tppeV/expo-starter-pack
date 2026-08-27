import { YFK_CATALOG, YFK_CATALOG_ITEMS, YFK_CATALOG_SOURCE } from '../data/yfkCatalog';

describe('official YFK August 2026 catalog', () => {
  it('contains every unique construction rate with integer kuruş prices', () => {
    expect(YFK_CATALOG.items).toHaveLength(5521);
    expect(new Set(YFK_CATALOG_ITEMS.map(item => item.code))).toHaveProperty('size', 5521);
    expect(YFK_CATALOG_ITEMS.every(item => Number.isSafeInteger(item.unitPriceKurus))).toBe(true);
  });

  it('preserves the official category totals and source snapshot', () => {
    const totals = Object.fromEntries(
      ['labor', 'transport', 'equipment', 'material'].map(kind => [
        kind,
        YFK_CATALOG_ITEMS.filter(item => item.kind === kind).length,
      ])
    );

    expect(totals).toEqual({ equipment: 260, labor: 113, material: 5145, transport: 3 });
    expect(YFK_CATALOG_SOURCE).toEqual(
      expect.objectContaining({
        id: 'yfk-insaat-2026-08',
        publishedAt: '2026-08-03',
        validFrom: '2026-08-01',
      })
    );
  });
});
