import { CatalogFilters, CatalogItem, CatalogPage, CatalogQuery, CatalogSortField } from './types';

export const DEFAULT_CATALOG_PAGE_SIZE = 25;
export const MAX_CATALOG_PAGE_SIZE = 250;

const searchableTextCache = new WeakMap<CatalogItem, string>();
const matchedItemsCache = new WeakMap<
  readonly CatalogItem[],
  Map<string, readonly CatalogItem[]>
>();
const MAX_QUERY_CACHE_ENTRIES = 12;

function normalizeText(value: string) {
  return value
    .trim()
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function matchesAny(value: string, candidates: readonly string[] | undefined) {
  if (!candidates || candidates.length === 0) {
    return true;
  }

  const normalizedValue = normalizeText(value);
  return candidates.some(candidate => normalizeText(candidate) === normalizedValue);
}

function matchesFilters(item: CatalogItem, filters: CatalogFilters | undefined) {
  if (!filters) {
    return true;
  }

  return (
    (!filters.kinds || filters.kinds.length === 0 || filters.kinds.includes(item.kind)) &&
    matchesAny(item.category, filters.categories) &&
    matchesAny(item.unit, filters.units) &&
    (!filters.sourceVersionIds ||
      filters.sourceVersionIds.length === 0 ||
      filters.sourceVersionIds.includes(item.sourceVersionId)) &&
    (filters.minimumUnitPriceKurus === undefined ||
      item.unitPriceKurus >= filters.minimumUnitPriceKurus) &&
    (filters.maximumUnitPriceKurus === undefined ||
      item.unitPriceKurus <= filters.maximumUnitPriceKurus)
  );
}

function matchesSearch(item: CatalogItem, search: string | undefined) {
  if (!search?.trim()) {
    return true;
  }

  const terms = normalizeText(search).split(/\s+/).filter(Boolean);
  let searchableText = searchableTextCache.get(item);
  if (!searchableText) {
    searchableText = normalizeText(
      [item.code, item.name, item.category, item.unit, ...(item.tags ?? [])].join(' ')
    );
    searchableTextCache.set(item, searchableText);
  }
  return terms.every(term => searchableText.includes(term));
}

function compareItems(
  left: CatalogItem,
  right: CatalogItem,
  sortBy: CatalogSortField,
  direction: 'asc' | 'desc'
) {
  const factor = direction === 'asc' ? 1 : -1;
  const leftValue = left[sortBy];
  const rightValue = right[sortBy];

  if (typeof leftValue === 'number' && typeof rightValue === 'number') {
    return (leftValue - rightValue) * factor;
  }

  return (
    String(leftValue).localeCompare(String(rightValue), 'tr-TR', {
      numeric: true,
      sensitivity: 'base',
    }) * factor
  );
}

function requirePositiveInteger(value: number, fieldName: string, maximum?: number) {
  if (!Number.isSafeInteger(value) || value < 1 || (maximum !== undefined && value > maximum)) {
    const range = maximum === undefined ? 'a positive integer' : `between 1 and ${maximum}`;
    throw new Error(`${fieldName} must be ${range}`);
  }
}

function validatePriceRange(filters: CatalogFilters | undefined) {
  const minimum = filters?.minimumUnitPriceKurus;
  const maximum = filters?.maximumUnitPriceKurus;

  if (minimum !== undefined && (!Number.isSafeInteger(minimum) || minimum < 0)) {
    throw new Error('minimumUnitPriceKurus must be a non-negative, safe integer');
  }
  if (maximum !== undefined && (!Number.isSafeInteger(maximum) || maximum < 0)) {
    throw new Error('maximumUnitPriceKurus must be a non-negative, safe integer');
  }
  if (minimum !== undefined && maximum !== undefined && minimum > maximum) {
    throw new Error('minimumUnitPriceKurus cannot exceed maximumUnitPriceKurus');
  }
}

export function queryCatalog<TItem extends CatalogItem>(
  items: readonly TItem[],
  query: CatalogQuery = {}
): CatalogPage<TItem> {
  const requestedPage = query.page ?? 1;
  const pageSize = query.pageSize ?? DEFAULT_CATALOG_PAGE_SIZE;
  requirePositiveInteger(requestedPage, 'page');
  requirePositiveInteger(pageSize, 'pageSize', MAX_CATALOG_PAGE_SIZE);
  validatePriceRange(query.filters);

  const sortBy = query.sortBy ?? 'code';
  const sortDirection = query.sortDirection ?? 'asc';
  const cacheKey = JSON.stringify({
    filters: query.filters ?? null,
    search: normalizeText(query.search ?? ''),
    sortBy,
    sortDirection,
  });
  let itemCache = matchedItemsCache.get(items);
  if (!itemCache) {
    itemCache = new Map();
    matchedItemsCache.set(items, itemCache);
  }
  let matchedItems = itemCache.get(cacheKey) as readonly TItem[] | undefined;
  if (!matchedItems) {
    matchedItems = items
      .filter(item => matchesFilters(item, query.filters) && matchesSearch(item, query.search))
      .sort((left, right) => {
        const primary = compareItems(left, right, sortBy, sortDirection);
        return primary || compareItems(left, right, 'code', 'asc');
      });
    if (itemCache.size >= MAX_QUERY_CACHE_ENTRIES) {
      const oldestKey = itemCache.keys().next().value;
      if (oldestKey) itemCache.delete(oldestKey);
    }
    itemCache.set(cacheKey, matchedItems);
  }

  const totalItems = matchedItems.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const page = totalPages === 0 ? 1 : Math.min(requestedPage, totalPages);
  const startIndex = (page - 1) * pageSize;

  return {
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1 && totalPages > 0,
    items: matchedItems.slice(startIndex, startIndex + pageSize),
    page,
    pageSize,
    totalItems,
    totalPages,
  };
}
