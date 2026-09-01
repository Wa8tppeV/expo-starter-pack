import { YFK_CATALOG_ITEM_COUNT } from './yfkSource';
import rawOtherValidation from '../../costs/data/generated/official-2026-08-ilbank-vgm-positions-validation.json';

export const OFFICIAL_CATALOG_ITEM_COUNT = YFK_CATALOG_ITEM_COUNT + rawOtherValidation.itemCount;
export const OFFICIAL_CATALOG_EXCLUDED_TARIFF_COUNT = rawOtherValidation.excludedTariffGridCount;
