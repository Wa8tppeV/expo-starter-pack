import { CatalogItemKind } from '../catalog';

export interface EstimateCatalogSnapshot {
  id: string;
  label: string;
  publishedAt: string;
  validFrom: string;
}

export interface EstimateLine {
  code: string;
  description: string;
  itemId: string;
  kind: CatalogItemKind;
  quantity: number;
  sourceVersionId: string;
  unit: string;
  unitPriceKurus: number;
}

export interface EstimateAdjustments {
  overheadRate: number;
  profitRate: number;
  vatRate: number;
}

export interface EstimateDraft {
  adjustments: EstimateAdjustments;
  catalog: EstimateCatalogSnapshot;
  lines: EstimateLine[];
  projectId: string;
  projectName: string;
  updatedAt: string;
}

export interface EstimateTotals {
  constructionSubtotalKurus: number;
  directSubtotalKurus: number;
  electricalSubtotalKurus: number;
  equipmentSubtotalKurus: number;
  grandTotalKurus: number;
  itemCount: number;
  laborSubtotalKurus: number;
  materialSubtotalKurus: number;
  mechanicalSubtotalKurus: number;
  overheadKurus: number;
  profitKurus: number;
  subtotalBeforeVatKurus: number;
  totalHours: number;
  transportSubtotalKurus: number;
  vatKurus: number;
}
