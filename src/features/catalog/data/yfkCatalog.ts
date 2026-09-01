import rawPositionSources from '../../costs/data/generated/yfk-2026-08-all-position-sources.json';
import rawPositionItems from '../../costs/data/generated/yfk-2026-08-all-positions.json';
import rawItems from '../../costs/data/generated/yfk-2026-08.json';
import { Catalog, CatalogItem, CatalogSourceVersion } from '../types';
import { YFK_CATALOG_SOURCE } from './yfkSource';

export const YFK_CONSTRUCTION_RATE_ITEMS = rawItems as CatalogItem[];
export const YFK_POSITION_SOURCES = rawPositionSources as CatalogSourceVersion[];
export const YFK_POSITION_ITEMS = rawPositionItems as CatalogItem[];
export const YFK_CATALOG_SOURCES = [YFK_CATALOG_SOURCE, ...YFK_POSITION_SOURCES];
export const YFK_CATALOG_ITEMS = [...YFK_CONSTRUCTION_RATE_ITEMS, ...YFK_POSITION_ITEMS];

export const YFK_CATALOG: Catalog = {
  items: YFK_CATALOG_ITEMS,
  sourceVersions: YFK_CATALOG_SOURCES,
};

export { YFK_CATALOG_SOURCE };
