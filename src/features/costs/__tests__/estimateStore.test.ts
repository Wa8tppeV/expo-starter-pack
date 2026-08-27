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
});
