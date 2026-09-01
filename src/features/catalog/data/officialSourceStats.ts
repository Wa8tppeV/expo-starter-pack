import { YFK_CATALOG_ITEM_COUNT } from './yfkSource';
import rawDsiValidation from '../../costs/data/generated/dsi-2026-positions-validation.json';
import rawOtherValidation from '../../costs/data/generated/official-2026-08-ilbank-vgm-positions-validation.json';
import rawKgmValidation from '../../costs/data/generated/official-2026-08-kgm-positions-validation.json';

export const OFFICIAL_CATALOG_ITEM_COUNT =
  YFK_CATALOG_ITEM_COUNT +
  rawOtherValidation.itemCount +
  rawKgmValidation.itemCount +
  rawDsiValidation.itemCount;
export const OFFICIAL_CATALOG_EXCLUDED_TARIFF_COUNT = rawOtherValidation.excludedTariffGridCount;
