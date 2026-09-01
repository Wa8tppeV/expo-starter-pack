import rawDsiSources from '../../costs/data/generated/dsi-2026-positions-sources.json';
import rawDsiItems from '../../costs/data/generated/dsi-2026-positions.json';
import rawOtherSources from '../../costs/data/generated/official-2026-08-ilbank-vgm-positions-sources.json';
import rawOtherItems from '../../costs/data/generated/official-2026-08-ilbank-vgm-positions.json';
import rawKgmSources from '../../costs/data/generated/official-2026-08-kgm-positions-sources.json';
import rawKgmItems from '../../costs/data/generated/official-2026-08-kgm-positions.json';
import { CatalogItem, CatalogSourceVersion } from '../types';
import { YFK_CATALOG_ITEMS, YFK_CATALOG_SOURCES } from './yfkCatalog';

export const OTHER_OFFICIAL_POSITION_ITEMS = rawOtherItems as CatalogItem[];
export const OTHER_OFFICIAL_POSITION_SOURCES = rawOtherSources as CatalogSourceVersion[];
export const KGM_POSITION_ITEMS = rawKgmItems as unknown as CatalogItem[];
export const KGM_POSITION_SOURCES = rawKgmSources as CatalogSourceVersion[];
export const DSI_POSITION_ITEMS = rawDsiItems as unknown as CatalogItem[];
export const DSI_POSITION_SOURCES = rawDsiSources as CatalogSourceVersion[];
export const OFFICIAL_CATALOG_ITEMS = [
  ...YFK_CATALOG_ITEMS,
  ...OTHER_OFFICIAL_POSITION_ITEMS,
  ...KGM_POSITION_ITEMS,
  ...DSI_POSITION_ITEMS,
];
export const OFFICIAL_CATALOG_SOURCES = [
  ...YFK_CATALOG_SOURCES,
  ...OTHER_OFFICIAL_POSITION_SOURCES,
  ...KGM_POSITION_SOURCES,
  ...DSI_POSITION_SOURCES,
];
