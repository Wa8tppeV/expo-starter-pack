import rawPositionsValidation from '../../costs/data/generated/yfk-2026-08-all-positions-validation.json';
import rawSource from '../../costs/data/generated/yfk-2026-08-source.json';
import rawRateValidation from '../../costs/data/generated/yfk-2026-08-validation.json';
import { CatalogSourceVersion } from '../types';

export const YFK_CATALOG_SOURCE = rawSource as CatalogSourceVersion;
export const YFK_CATALOG_ITEM_COUNT =
  rawRateValidation.itemCount + rawPositionsValidation.itemCount;
