import rawOtherSources from '../../costs/data/generated/official-2026-08-ilbank-vgm-positions-sources.json';
import rawOtherItems from '../../costs/data/generated/official-2026-08-ilbank-vgm-positions.json';
import { CatalogItem, CatalogSourceVersion } from '../types';
import { YFK_CATALOG_ITEMS, YFK_CATALOG_SOURCES } from './yfkCatalog';

export const OTHER_OFFICIAL_POSITION_ITEMS = rawOtherItems as CatalogItem[];
export const OTHER_OFFICIAL_POSITION_SOURCES = rawOtherSources as CatalogSourceVersion[];
export const OFFICIAL_CATALOG_ITEMS = [...YFK_CATALOG_ITEMS, ...OTHER_OFFICIAL_POSITION_ITEMS];
export const OFFICIAL_CATALOG_SOURCES = [
  ...YFK_CATALOG_SOURCES,
  ...OTHER_OFFICIAL_POSITION_SOURCES,
];
