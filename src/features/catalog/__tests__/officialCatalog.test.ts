import { createCatalog } from '../catalog';
import {
  DSI_POSITION_ITEMS,
  KGM_POSITION_ITEMS,
  OFFICIAL_CATALOG_ITEMS,
  OFFICIAL_CATALOG_SOURCES,
  OTHER_OFFICIAL_POSITION_ITEMS,
} from '../data/officialCatalog';

describe('combined official 2026 catalog', () => {
  it('contains the validated YFK, İLBANK, restoration, KGM and DSİ records', () => {
    expect(OTHER_OFFICIAL_POSITION_ITEMS).toHaveLength(10062);
    expect(KGM_POSITION_ITEMS).toHaveLength(2400);
    expect(DSI_POSITION_ITEMS).toHaveLength(1974);
    expect(OFFICIAL_CATALOG_ITEMS).toHaveLength(44729);
    expect(OFFICIAL_CATALOG_SOURCES).toHaveLength(19);
    expect(
      new Set(
        OFFICIAL_CATALOG_ITEMS.map(item => `${item.sourceVersionId}:${item.kind}:${item.code}`)
      ).size
    ).toBe(44729);
    expect(createCatalog(OFFICIAL_CATALOG_SOURCES, OFFICIAL_CATALOG_ITEMS).items).toHaveLength(
      44729
    );
  });

  it('preserves official difference prices without making up replacements', () => {
    const negativeItems = OTHER_OFFICIAL_POSITION_ITEMS.filter(item => item.unitPriceKurus < 0);
    expect(negativeItems).toHaveLength(26);
    expect(negativeItems.every(item => item.metadata?.priced === true)).toBe(true);
  });

  it('keeps formula and externally priced records visible but non-selectable', () => {
    const nonSelectableItems = [...KGM_POSITION_ITEMS, ...DSI_POSITION_ITEMS].filter(
      item => item.unitPriceKurus <= 0
    );

    expect(nonSelectableItems).toHaveLength(59);
    expect(nonSelectableItems.every(item => item.unitPriceKurus === 0)).toBe(true);
  });
});
