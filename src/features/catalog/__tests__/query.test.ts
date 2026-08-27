import { queryCatalog } from '../query';
import { CatalogItem } from '../types';

const items: CatalogItem[] = [
  {
    category: 'Ustalar',
    code: '10.100.10',
    kind: 'labor',
    name: 'İnşaat ustası',
    sourceVersionId: 'official-2026-08',
    tags: ['kaba yapı', 'duvar'],
    unit: 'saat',
    unitPriceKurus: 34_480,
  },
  {
    category: 'Malzemeler',
    code: '10.100.2',
    kind: 'material',
    name: 'Çimento CEM I 42,5 R',
    sourceVersionId: 'official-2026-08',
    tags: ['bağlayıcı'],
    unit: 'ton',
    unitPriceKurus: 230_000,
  },
  {
    category: 'Makineler',
    code: '10.100.30',
    kind: 'equipment',
    name: 'Kule vinç',
    sourceVersionId: 'market-2026-08',
    unit: 'saat',
    unitPriceKurus: 53_944,
  },
  {
    category: 'Nakliye',
    code: '10.100.4',
    kind: 'transport',
    name: 'Kamyon ile şehir içi taşıma',
    sourceVersionId: 'market-2026-08',
    unit: 'ton-km',
    unitPriceKurus: 1_250,
  },
];

describe('catalog querying', () => {
  it('sorts codes naturally by default without mutating input', () => {
    const originalCodes = items.map(item => item.code);
    const result = queryCatalog(items);

    expect(result.items.map(item => item.code)).toEqual([
      '10.100.2',
      '10.100.4',
      '10.100.10',
      '10.100.30',
    ]);
    expect(items.map(item => item.code)).toEqual(originalCodes);
  });

  it('searches Turkish text without case or diacritic sensitivity', () => {
    expect(queryCatalog(items, { search: 'insaat' }).items).toEqual([items[0]]);
    expect(queryCatalog(items, { search: 'cimento' }).items).toEqual([items[1]]);
    expect(queryCatalog(items, { search: 'SEHIR ICI' }).items).toEqual([items[3]]);
  });

  it('requires every search term and includes codes, units, categories, and tags', () => {
    expect(queryCatalog(items, { search: 'kaba duvar' }).items).toEqual([items[0]]);
    expect(queryCatalog(items, { search: '10.100.30 saat' }).items).toEqual([items[2]]);
    expect(queryCatalog(items, { search: 'malzemeler ton' }).items).toEqual([items[1]]);
    expect(queryCatalog(items, { search: 'kaba vinç' }).items).toEqual([]);
  });

  it('combines kind, category, unit, source, and inclusive price filters', () => {
    const result = queryCatalog(items, {
      filters: {
        categories: ['USTALAR', 'makineler'],
        kinds: ['labor', 'equipment'],
        maximumUnitPriceKurus: 53_944,
        minimumUnitPriceKurus: 34_480,
        sourceVersionIds: ['official-2026-08'],
        units: ['SAAT'],
      },
    });

    expect(result.items).toEqual([items[0]]);
  });

  it('treats empty filter arrays as no restriction', () => {
    expect(
      queryCatalog(items, {
        filters: { categories: [], kinds: [], sourceVersionIds: [], units: [] },
      }).totalItems
    ).toBe(4);
  });

  it('sorts numeric prices descending and breaks ties by code', () => {
    const tiedItems = [...items, { ...items[0], code: '10.100.5' }];
    const result = queryCatalog(tiedItems, {
      sortBy: 'unitPriceKurus',
      sortDirection: 'desc',
    });

    expect(result.items.map(item => item.code)).toEqual([
      '10.100.2',
      '10.100.30',
      '10.100.5',
      '10.100.10',
      '10.100.4',
    ]);
  });

  it('paginates and reports navigation metadata', () => {
    const first = queryCatalog(items, { page: 1, pageSize: 2 });
    const second = queryCatalog(items, { page: 2, pageSize: 2 });

    expect(first).toMatchObject({
      hasNextPage: true,
      hasPreviousPage: false,
      page: 1,
      pageSize: 2,
      totalItems: 4,
      totalPages: 2,
    });
    expect(second).toMatchObject({ hasNextPage: false, hasPreviousPage: true, page: 2 });
    expect(first.items).toHaveLength(2);
    expect(second.items).toHaveLength(2);
  });

  it('clamps an out-of-range page to the final page', () => {
    const result = queryCatalog(items, { page: 99, pageSize: 3 });

    expect(result.page).toBe(2);
    expect(result.items).toHaveLength(1);
  });

  it('returns consistent metadata for an empty result', () => {
    expect(queryCatalog(items, { search: 'bulunmayan' })).toMatchObject({
      hasNextPage: false,
      hasPreviousPage: false,
      items: [],
      page: 1,
      totalItems: 0,
      totalPages: 0,
    });
  });

  it.each([
    [{ page: 0 }, 'page'],
    [{ page: 1.5 }, 'page'],
    [{ pageSize: 0 }, 'pageSize'],
    [{ pageSize: 251 }, 'pageSize'],
  ] as const)('rejects invalid pagination %#', (query, fieldName) => {
    expect(() => queryCatalog(items, query)).toThrow(fieldName);
  });

  it('rejects invalid price ranges', () => {
    expect(() => queryCatalog(items, { filters: { minimumUnitPriceKurus: -1 } })).toThrow(
      'minimumUnitPriceKurus'
    );
    expect(() =>
      queryCatalog(items, {
        filters: { maximumUnitPriceKurus: 99, minimumUnitPriceKurus: 100 },
      })
    ).toThrow('cannot exceed');
  });
});
