import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { CatalogItem, tryToKurus, YFK_CATALOG_SOURCE } from '../../catalog';
import { LABOR_RATES } from '../data/laborRates';
import { ESTIMATE_PROJECTS, EstimateProjectId } from '../data/projects';
import { EstimateAdjustments, EstimateDraft, EstimateLine } from '../types';
import { DEFAULT_ESTIMATE_ADJUSTMENTS } from '../utils/estimateCalculator';

const catalogSnapshot = {
  id: YFK_CATALOG_SOURCE.id,
  label: YFK_CATALOG_SOURCE.label,
  publishedAt: YFK_CATALOG_SOURCE.publishedAt,
  validFrom: YFK_CATALOG_SOURCE.validFrom,
};

const createDraft = (projectId: EstimateProjectId): EstimateDraft => {
  const project = ESTIMATE_PROJECTS.find(item => item.id === projectId) ?? ESTIMATE_PROJECTS[0];

  return {
    adjustments: DEFAULT_ESTIMATE_ADJUSTMENTS,
    catalog: catalogSnapshot,
    lines: [],
    projectId: project.id,
    projectName: project.name,
    updatedAt: new Date().toISOString(),
  };
};

interface EstimateStore {
  activeProjectId: EstimateProjectId;
  drafts: Record<EstimateProjectId, EstimateDraft>;
  clearActiveDraft: () => void;
  setActiveProject: (projectId: EstimateProjectId) => void;
  setAdjustment: (key: keyof EstimateAdjustments, value: number) => void;
  setCatalogItemQuantity: (item: CatalogItem, quantity: number) => void;
  setLineQuantity: (itemIdOrLegacyCode: string, quantity: number) => void;
}

const updateActiveDraft = (
  state: Pick<EstimateStore, 'activeProjectId' | 'drafts'>,
  update: (draft: EstimateDraft) => EstimateDraft
) => {
  const currentDraft = state.drafts[state.activeProjectId] ?? createDraft(state.activeProjectId);

  return {
    drafts: {
      ...state.drafts,
      [state.activeProjectId]: {
        ...update(currentDraft),
        updatedAt: new Date().toISOString(),
      },
    },
  };
};

export const useEstimateStore = create<EstimateStore>()(
  persist(
    set => ({
      activeProjectId: ESTIMATE_PROJECTS[0].id,
      clearActiveDraft: () =>
        set(state => ({
          drafts: { ...state.drafts, [state.activeProjectId]: createDraft(state.activeProjectId) },
        })),
      drafts: Object.fromEntries(
        ESTIMATE_PROJECTS.map(project => [project.id, createDraft(project.id)])
      ) as Record<EstimateProjectId, EstimateDraft>,
      setActiveProject: activeProjectId => set({ activeProjectId }),
      setAdjustment: (key, value) =>
        set(state =>
          updateActiveDraft(state, draft => ({
            ...draft,
            adjustments: { ...draft.adjustments, [key]: Math.min(100, Math.max(0, value)) },
          }))
        ),
      setCatalogItemQuantity: (item, quantity) =>
        set(state =>
          updateActiveDraft(state, draft => {
            const safeQuantity = Math.max(0, quantity);
            const itemId = `${item.sourceVersionId}:${item.kind}:${item.code}`;
            const existingLine = draft.lines.find(line => line.itemId === itemId);

            if (safeQuantity === 0) {
              return { ...draft, lines: draft.lines.filter(line => line.itemId !== itemId) };
            }

            const nextLine: EstimateLine = {
              code: item.code,
              description: item.name,
              itemId,
              kind: item.kind,
              quantity: safeQuantity,
              sourceVersionId: item.sourceVersionId,
              unit: item.unit,
              unitPriceKurus: item.unitPriceKurus,
            };

            return {
              ...draft,
              lines: existingLine
                ? draft.lines.map(line => (line.itemId === itemId ? nextLine : line))
                : [...draft.lines, nextLine],
            };
          })
        ),
      setLineQuantity: (itemIdOrLegacyCode, quantity) =>
        set(state =>
          updateActiveDraft(state, draft => {
            const safeQuantity = Math.max(0, quantity);
            const existingLine = draft.lines.find(
              line => line.itemId === itemIdOrLegacyCode || line.code === itemIdOrLegacyCode
            );
            const rate = LABOR_RATES.find(item => item.code === itemIdOrLegacyCode);

            if (safeQuantity === 0) {
              return {
                ...draft,
                lines: draft.lines.filter(line => line.itemId !== existingLine?.itemId),
              };
            }

            if (!existingLine && !rate) return draft;

            const nextLine: EstimateLine = existingLine
              ? { ...existingLine, quantity: safeQuantity }
              : {
                  code: itemIdOrLegacyCode,
                  description: rate!.name,
                  itemId: `${catalogSnapshot.id}:labor:${itemIdOrLegacyCode}`,
                  kind: 'labor',
                  quantity: safeQuantity,
                  sourceVersionId: catalogSnapshot.id,
                  unit: rate!.unit,
                  unitPriceKurus: tryToKurus(rate!.hourlyRate),
                };

            return {
              ...draft,
              lines: existingLine
                ? draft.lines.map(line => (line.itemId === existingLine.itemId ? nextLine : line))
                : [...draft.lines, nextLine],
            };
          })
        ),
    }),
    {
      migrate: persistedState => {
        const state = persistedState as EstimateStore;
        const drafts = Object.fromEntries(
          Object.entries(state.drafts).map(([projectId, draft]) => [
            projectId,
            {
              ...draft,
              lines: draft.lines.map(line => ({
                ...line,
                itemId:
                  line.itemId ?? `${line.sourceVersionId ?? draft.catalog.id}:labor:${line.code}`,
                kind: line.kind ?? 'labor',
                sourceVersionId: line.sourceVersionId ?? draft.catalog.id,
              })),
            },
          ])
        ) as Record<EstimateProjectId, EstimateDraft>;

        return { ...state, drafts };
      },
      name: 'dmh-estimate-drafts-v1',
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
    }
  )
);

export function getActiveDraft(state: EstimateStore) {
  return state.drafts[state.activeProjectId] ?? createDraft(state.activeProjectId);
}
