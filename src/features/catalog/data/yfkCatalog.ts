import rawSource from '../../costs/data/generated/yfk-2026-08-source.json';
import rawItems from '../../costs/data/generated/yfk-2026-08.json';
import { createCatalog } from '../catalog';
import { CatalogItem, CatalogSourceVersion } from '../types';

export const YFK_CATALOG_SOURCE = rawSource as CatalogSourceVersion;
export const YFK_CATALOG_ITEMS = rawItems as CatalogItem[];

export const YFK_CATALOG = createCatalog([YFK_CATALOG_SOURCE], YFK_CATALOG_ITEMS);
