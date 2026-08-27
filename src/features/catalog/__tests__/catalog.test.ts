import { createCatalog, getActiveSourceVersions, getSourceVersion } from '../catalog';
import { CatalogItem, CatalogSourceVersion } from '../types';

const laborSource: CatalogSourceVersion = {
  authority: 'Resmî Kurum',
  currency: 'TRY',
  id: 'labor-2026-08',
  itemKinds: ['labor'],
  label: 'Ağustos 2026 İşçilik',
  publishedAt: '2026-08-03',
  sourceUrl: 'https://example.com/labor',
  validFrom: '2026-08-01',
  validUntil: '2026-08-31',
};

const materialSource: CatalogSourceVersion = {
  ...laborSource,
  id: 'material-2026-08',
  itemKinds: ['material', 'transport'],
  label: 'Ağustos 2026 Malzeme ve Nakliye',
  sourceUrl: 'https://example.com/material',
};

const worker: CatalogItem = {
  category: 'Ustalar',
  code: '10.100.1001',
  kind: 'labor',
  name: 'İnşaat ustası',
  sourceVersionId: laborSource.id,
  unit: 'saat',
  unitPriceKurus: 34_480,
};

describe('catalog construction and source versions', () => {
  it('creates a validated catalog without retaining mutable input arrays', () => {
    const sources = [laborSource];
    const items = [worker];
    const catalog = createCatalog(sources, items);

    sources.length = 0;
    items.length = 0;

    expect(catalog.sourceVersions).toEqual([laborSource]);
    expect(catalog.items).toEqual([worker]);
    expect(getSourceVersion(catalog, laborSource.id)).toBe(laborSource);
    expect(getSourceVersion(catalog, 'missing')).toBeUndefined();
  });

  it('allows the same code in a different source version', () => {
    const newerSource = {
      ...laborSource,
      id: 'labor-2026-09',
      validFrom: '2026-09-01',
      validUntil: '2026-09-30',
    };
    const newerWorker = { ...worker, sourceVersionId: newerSource.id, unitPriceKurus: 36_000 };

    expect(createCatalog([laborSource, newerSource], [worker, newerWorker]).items).toHaveLength(2);
  });

  it('rejects duplicate item identities within one source', () => {
    expect(() => createCatalog([laborSource], [worker, { ...worker }])).toThrow(
      'Duplicate catalog item'
    );
  });

  it('rejects duplicate source ids', () => {
    expect(() => createCatalog([laborSource, { ...laborSource }], [worker])).toThrow(
      'Duplicate source version id'
    );
  });

  it('rejects missing sources and kinds a source does not cover', () => {
    expect(() => createCatalog([laborSource], [{ ...worker, sourceVersionId: 'missing' }])).toThrow(
      'unknown source'
    );
    expect(() => createCatalog([laborSource], [{ ...worker, kind: 'material' }])).toThrow(
      'does not cover material'
    );
  });

  it('rejects invalid money and required string fields', () => {
    expect(() => createCatalog([laborSource], [{ ...worker, unitPriceKurus: 10.5 }])).toThrow(
      'safe integer price'
    );
    expect(() => createCatalog([laborSource], [{ ...worker, code: '  ' }])).toThrow(
      'item.code cannot be empty'
    );
  });

  it('validates source dates and validity range', () => {
    expect(() => createCatalog([{ ...laborSource, publishedAt: '03.08.2026' }], [])).toThrow(
      'ISO date'
    );
    expect(() => createCatalog([{ ...laborSource, validUntil: '2026-07-31' }], [])).toThrow(
      'valid until before'
    );
  });

  it('finds versions active on inclusive validity boundaries', () => {
    const catalog = createCatalog([laborSource, materialSource], [worker]);

    expect(getActiveSourceVersions(catalog, '2026-08-01')).toHaveLength(2);
    expect(getActiveSourceVersions(catalog, '2026-08-31')).toHaveLength(2);
    expect(getActiveSourceVersions(catalog, '2026-09-01')).toHaveLength(0);
    expect(() => getActiveSourceVersions(catalog, '1 Ağustos 2026')).toThrow('ISO date');
  });
});
