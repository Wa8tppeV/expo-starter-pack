export interface EstimateCatalogSnapshot {
  id: string;
  label: string;
  publishedAt: string;
  validFrom: string;
}

export interface EstimateLine {
  code: string;
  description: string;
  quantity: number;
  unit: 'saat';
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
  grandTotalKurus: number;
  itemCount: number;
  laborSubtotalKurus: number;
  overheadKurus: number;
  profitKurus: number;
  subtotalBeforeVatKurus: number;
  totalHours: number;
  vatKurus: number;
}
