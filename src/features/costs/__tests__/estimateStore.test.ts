import { useEstimateStore } from '../store/estimateStore';

describe('Estimate store', () => {
  beforeEach(() => {
    const store = useEstimateStore.getState();

    store.setActiveProject('cal-konut');
    store.clearActiveDraft();
    store.setActiveProject('villa-uygulama');
    store.clearActiveDraft();
    store.setActiveProject('cal-konut');
  });

  it('keeps project drafts isolated and snapshots the selected price', () => {
    useEstimateStore.getState().setLineQuantity('10.100.1001', 8);

    const calDraft = useEstimateStore.getState().drafts['cal-konut'];
    expect(calDraft.lines).toEqual([
      expect.objectContaining({
        code: '10.100.1001',
        quantity: 8,
        unitPriceKurus: 35441,
      }),
    ]);

    useEstimateStore.getState().setActiveProject('villa-uygulama');
    expect(useEstimateStore.getState().drafts['villa-uygulama'].lines).toEqual([]);
  });

  it('clamps percentages and removes zero quantity lines', () => {
    const store = useEstimateStore.getState();

    store.setAdjustment('profitRate', 125);
    store.setLineQuantity('10.100.1062', 2);
    store.setLineQuantity('10.100.1062', 0);

    const draft = useEstimateStore.getState().drafts['cal-konut'];
    expect(draft.adjustments.profitRate).toBe(100);
    expect(draft.lines).toEqual([]);
  });

  it('adds and snapshots any catalog item kind', () => {
    const item = {
      category: 'Malzeme',
      code: '10.130.1001',
      kind: 'material' as const,
      name: 'Örnek malzeme',
      sourceVersionId: 'yfk-insaat-2026-08',
      unit: 'm³',
      unitPriceKurus: 125050,
    };

    useEstimateStore.getState().setCatalogItemQuantity(item, 3);
    expect(useEstimateStore.getState().drafts['cal-konut'].lines[0]).toEqual({
      code: item.code,
      description: item.name,
      itemId: 'yfk-insaat-2026-08:material:10.130.1001',
      kind: 'material',
      quantity: 3,
      sourceVersionId: 'yfk-insaat-2026-08',
      unit: 'm³',
      unitPriceKurus: 125050,
    });
  });

  it('updates same-code rows by their source-qualified item ID', () => {
    const store = useEstimateStore.getState();
    const rate = {
      category: 'Mekanik Rayiç',
      code: '25.100.1001',
      kind: 'mechanical' as const,
      name: 'Mekanik rayiç',
      sourceVersionId: 'yfk-mekanik-rayic-2026-08',
      unit: 'Ad',
      unitPriceKurus: 10000,
    };
    const position = {
      ...rate,
      category: 'Mekanik Birim Fiyatı',
      name: 'Mekanik birim fiyat',
      sourceVersionId: 'yfk-mekanik-birim-fiyat-2026-08',
      unitPriceKurus: 20000,
    };

    store.setCatalogItemQuantity(rate, 1);
    store.setCatalogItemQuantity(position, 1);
    store.setLineQuantity('yfk-mekanik-birim-fiyat-2026-08:mechanical:25.100.1001', 3);

    const lines = useEstimateStore.getState().drafts['cal-konut'].lines;
    expect(lines).toHaveLength(2);
    expect(lines.find(line => line.sourceVersionId === rate.sourceVersionId)?.quantity).toBe(1);
    expect(lines.find(line => line.sourceVersionId === position.sourceVersionId)?.quantity).toBe(3);
  });
});
