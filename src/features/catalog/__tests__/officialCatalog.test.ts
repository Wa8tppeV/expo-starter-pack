import {
  OFFICIAL_CATALOG_ITEMS,
  OFFICIAL_CATALOG_SOURCES,
  OTHER_OFFICIAL_POSITION_ITEMS,
} from '../data/officialCatalog';

describe('combined official 2026 catalog', () => {
  it('contains the validated YFK, İLBANK and restoration records', () => {
    expect(OTHER_OFFICIAL_POSITION_ITEMS).toHaveLength(10062);
    expect(OFFICIAL_CATALOG_ITEMS).toHaveLength(40355);
    expect(OFFICIAL_CATALOG_SOURCES).toHaveLength(13);
    expect(
      new Set(
        OFFICIAL_CATALOG_ITEMS.map(item => `${item.sourceVersionId}:${item.kind}:${item.code}`)
      ).size
    ).toBe(40355);
  });

  it('preserves official difference prices without making up replacements', () => {
    const negativeItems = OTHER_OFFICIAL_POSITION_ITEMS.filter(item => item.unitPriceKurus < 0);
    expect(negativeItems).toHaveLength(26);
    expect(negativeItems.every(item => item.metadata?.priced === true)).toBe(true);
  });
});
