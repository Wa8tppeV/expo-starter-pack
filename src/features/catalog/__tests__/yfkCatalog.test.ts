import {
  YFK_CATALOG,
  YFK_CATALOG_SOURCE,
  YFK_CONSTRUCTION_RATE_ITEMS,
  YFK_POSITION_ITEMS,
  YFK_POSITION_SOURCES,
} from '../data/yfkCatalog';

describe('official YFK August 2026 catalog', () => {
  it('contains every unique construction rate with integer kuruş prices', () => {
    expect(YFK_CONSTRUCTION_RATE_ITEMS).toHaveLength(5521);
    expect(new Set(YFK_CONSTRUCTION_RATE_ITEMS.map(item => item.code))).toHaveProperty(
      'size',
      5521
    );
    expect(YFK_CATALOG.items.every(item => Number.isSafeInteger(item.unitPriceKurus))).toBe(true);
  });

  it('preserves the official category totals and source snapshot', () => {
    const totals = Object.fromEntries(
      ['labor', 'transport', 'equipment', 'material'].map(kind => [
        kind,
        YFK_CONSTRUCTION_RATE_ITEMS.filter(item => item.kind === kind).length,
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

  it('contains every official construction, mechanical and electrical position list', () => {
    expect(YFK_POSITION_SOURCES).toHaveLength(5);
    expect(YFK_POSITION_ITEMS).toHaveLength(24772);
    expect(YFK_CATALOG.items).toHaveLength(30293);
    expect(YFK_POSITION_ITEMS.filter(item => item.kind === 'construction')).toHaveLength(1878);
    expect(YFK_POSITION_ITEMS.filter(item => item.kind === 'mechanical')).toHaveLength(11281);
    expect(YFK_POSITION_ITEMS.filter(item => item.kind === 'electrical')).toHaveLength(11613);
  });
});
