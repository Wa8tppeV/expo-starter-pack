export const CATALOG_ITEM_KINDS = [
  'labor',
  'material',
  'equipment',
  'transport',
  'construction',
  'mechanical',
  'electrical',
] as const;

export type CatalogItemKind = (typeof CATALOG_ITEM_KINDS)[number];

export type CatalogCurrency = 'TRY';

export type CatalogMetadataValue = boolean | number | string | null;

export type CatalogMetadata = Readonly<Record<string, CatalogMetadataValue>>;

export interface CatalogSourceVersion {
  readonly authority: string;
  readonly checksum?: string;
  readonly currency: CatalogCurrency;
  readonly id: string;
  readonly itemKinds: readonly CatalogItemKind[];
  readonly label: string;
  readonly publishedAt: string;
  readonly sourceUrl: string;
  readonly validFrom: string;
  readonly validUntil?: string;
}

export interface CatalogItem<TMetadata extends CatalogMetadata = CatalogMetadata> {
  readonly category: string;
  readonly code: string;
  readonly kind: CatalogItemKind;
  readonly metadata?: TMetadata;
  readonly name: string;
  readonly sourceVersionId: string;
  readonly tags?: readonly string[];
  readonly unit: string;
  readonly unitPriceKurus: number;
}

export interface Catalog<TItem extends CatalogItem = CatalogItem> {
  readonly items: readonly TItem[];
  readonly sourceVersions: readonly CatalogSourceVersion[];
}

export type CatalogSortField = 'category' | 'code' | 'kind' | 'name' | 'unitPriceKurus';

export interface CatalogFilters {
  readonly categories?: readonly string[];
  readonly kinds?: readonly CatalogItemKind[];
  readonly maximumUnitPriceKurus?: number;
  readonly minimumUnitPriceKurus?: number;
  readonly sourceVersionIds?: readonly string[];
  readonly units?: readonly string[];
}

export interface CatalogQuery {
  readonly filters?: CatalogFilters;
  readonly page?: number;
  readonly pageSize?: number;
  readonly search?: string;
  readonly sortBy?: CatalogSortField;
  readonly sortDirection?: 'asc' | 'desc';
}

export interface CatalogPage<TItem extends CatalogItem = CatalogItem> {
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
  readonly items: readonly TItem[];
  readonly page: number;
  readonly pageSize: number;
  readonly totalItems: number;
  readonly totalPages: number;
}

export interface CatalogLine<TItem extends CatalogItem = CatalogItem> {
  readonly item: TItem;
  readonly quantity: number;
}

export interface CatalogKindSubtotal {
  readonly kind: CatalogItemKind;
  readonly totalKurus: number;
}

export interface CatalogUnitQuantity {
  readonly quantity: number;
  readonly unit: string;
}

export interface CatalogTotals {
  readonly grandTotalKurus: number;
  readonly itemCount: number;
  readonly kindSubtotals: readonly CatalogKindSubtotal[];
  readonly unitQuantities: readonly CatalogUnitQuantity[];
}
