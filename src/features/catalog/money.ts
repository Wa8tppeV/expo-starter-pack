import {
  CATALOG_ITEM_KINDS,
  CatalogItem,
  CatalogKindSubtotal,
  CatalogLine,
  CatalogTotals,
} from './types';

export function assertKurus(value: number, fieldName = 'value') {
  if (!Number.isSafeInteger(value)) {
    throw new Error(`${fieldName} must be a safe integer amount in kuruş`);
  }
  return value;
}

export function tryToKurus(valueTry: number) {
  if (!Number.isFinite(valueTry)) {
    throw new Error('TRY value must be finite');
  }
  const roundingOffset = Math.sign(valueTry) * Number.EPSILON;
  return assertKurus(Math.round((valueTry + roundingOffset) * 100));
}

export function kurusToTry(valueKurus: number) {
  return assertKurus(valueKurus) / 100;
}

export function sumKurus(values: readonly number[]) {
  return values.reduce((total, value) => {
    assertKurus(value);
    return assertKurus(total + value, 'sum');
  }, 0);
}

export function calculateLineTotalKurus(unitPriceKurus: number, quantity: number) {
  assertKurus(unitPriceKurus, 'unitPriceKurus');
  if (unitPriceKurus < 0) {
    throw new Error('unitPriceKurus cannot be negative');
  }
  if (!Number.isFinite(quantity) || quantity < 0) {
    throw new Error('quantity must be a non-negative finite number');
  }

  return assertKurus(Math.round(unitPriceKurus * quantity), 'line total');
}

export function applyRateBasisPoints(valueKurus: number, rateBasisPoints: number) {
  assertKurus(valueKurus, 'valueKurus');
  if (!Number.isSafeInteger(rateBasisPoints)) {
    throw new Error('rateBasisPoints must be a safe integer');
  }

  return assertKurus(Math.round((valueKurus * rateBasisPoints) / 10_000), 'rate result');
}

export function calculateCatalogTotals<TItem extends CatalogItem>(
  lines: readonly CatalogLine<TItem>[]
): CatalogTotals {
  const subtotalMap = new Map<CatalogItem['kind'], number>(
    CATALOG_ITEM_KINDS.map(kind => [kind, 0])
  );
  const quantityMap = new Map<string, number>();

  lines.forEach(line => {
    const lineTotal = calculateLineTotalKurus(line.item.unitPriceKurus, line.quantity);
    subtotalMap.set(line.item.kind, sumKurus([subtotalMap.get(line.item.kind) ?? 0, lineTotal]));
    const unitQuantity = (quantityMap.get(line.item.unit) ?? 0) + line.quantity;
    if (!Number.isFinite(unitQuantity)) {
      throw new Error(`quantity total for ${line.item.unit} must be finite`);
    }
    quantityMap.set(line.item.unit, unitQuantity);
  });

  const kindSubtotals: CatalogKindSubtotal[] = CATALOG_ITEM_KINDS.map(kind => ({
    kind,
    totalKurus: subtotalMap.get(kind) ?? 0,
  }));

  return {
    grandTotalKurus: sumKurus(kindSubtotals.map(subtotal => subtotal.totalKurus)),
    itemCount: lines.filter(line => line.quantity > 0).length,
    kindSubtotals,
    unitQuantities: [...quantityMap].map(([unit, quantity]) => ({ quantity, unit })),
  };
}

export function formatKurus(valueKurus: number, locale = 'tr-TR') {
  return new Intl.NumberFormat(locale, {
    currency: 'TRY',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: 'currency',
  }).format(kurusToTry(valueKurus));
}
