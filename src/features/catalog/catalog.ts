import { CATALOG_ITEM_KINDS, Catalog, CatalogItem, CatalogSourceVersion } from './types';

function requireNonEmpty(value: string, fieldName: string) {
  if (value.trim().length === 0) {
    throw new Error(`${fieldName} cannot be empty`);
  }
}

function requireIsoDate(value: string, fieldName: string) {
  const parsed = new Date(`${value}T00:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== value
  ) {
    throw new Error(`${fieldName} must be an ISO date`);
  }
}

export function createCatalog<TItem extends CatalogItem>(
  sourceVersions: readonly CatalogSourceVersion[],
  items: readonly TItem[]
): Catalog<TItem> {
  const sourcesById = new Map<string, CatalogSourceVersion>();

  sourceVersions.forEach(source => {
    requireNonEmpty(source.id, 'source.id');
    requireNonEmpty(source.authority, 'source.authority');
    requireNonEmpty(source.label, 'source.label');
    requireNonEmpty(source.sourceUrl, 'source.sourceUrl');
    requireIsoDate(source.publishedAt, 'source.publishedAt');
    requireIsoDate(source.validFrom, 'source.validFrom');

    if (source.validUntil) {
      requireIsoDate(source.validUntil, 'source.validUntil');
      if (source.validUntil < source.validFrom) {
        throw new Error(`Source ${source.id} is valid until before it is valid from`);
      }
    }

    if (sourcesById.has(source.id)) {
      throw new Error(`Duplicate source version id: ${source.id}`);
    }

    if (source.itemKinds.length === 0) {
      throw new Error(`Source ${source.id} must declare at least one item kind`);
    }

    source.itemKinds.forEach(kind => {
      if (!CATALOG_ITEM_KINDS.includes(kind)) {
        throw new Error(`Source ${source.id} declares an invalid item kind: ${kind}`);
      }
    });
    sourcesById.set(source.id, source);
  });

  const itemKeys = new Set<string>();
  items.forEach(item => {
    requireNonEmpty(item.code, 'item.code');
    requireNonEmpty(item.name, 'item.name');
    requireNonEmpty(item.category, 'item.category');
    requireNonEmpty(item.unit, 'item.unit');

    if (!Number.isSafeInteger(item.unitPriceKurus) || item.unitPriceKurus < 0) {
      throw new Error(`Item ${item.code} must have a non-negative, safe integer price`);
    }

    const source = sourcesById.get(item.sourceVersionId);
    if (!source) {
      throw new Error(`Item ${item.code} refers to unknown source ${item.sourceVersionId}`);
    }
    if (!source.itemKinds.includes(item.kind)) {
      throw new Error(`Source ${source.id} does not cover ${item.kind} items`);
    }

    const itemKey = `${item.sourceVersionId}\u0000${item.kind}\u0000${item.code}`;
    if (itemKeys.has(itemKey)) {
      throw new Error(`Duplicate catalog item: ${item.code}`);
    }
    itemKeys.add(itemKey);
  });

  return {
    items: [...items],
    sourceVersions: [...sourceVersions],
  };
}

export function getSourceVersion(
  catalog: Catalog,
  sourceVersionId: string
): CatalogSourceVersion | undefined {
  return catalog.sourceVersions.find(source => source.id === sourceVersionId);
}

export function getActiveSourceVersions(catalog: Catalog, onDate: string) {
  requireIsoDate(onDate, 'onDate');

  return catalog.sourceVersions.filter(
    source => source.validFrom <= onDate && (!source.validUntil || source.validUntil >= onDate)
  );
}
