import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { LABOR_RATE_SOURCE, LABOR_RATES } from '../data/laborRates';
import { ESTIMATE_PROJECTS, EstimateProjectId } from '../data/projects';
import { EstimateAdjustments, EstimateDraft, EstimateLine } from '../types';
import { DEFAULT_ESTIMATE_ADJUSTMENTS, tryToKurus } from '../utils/estimateCalculator';

const catalogSnapshot = {
  id: `yfk-${LABOR_RATE_SOURCE.validFrom}`,
  label: LABOR_RATE_SOURCE.label,
  publishedAt: LABOR_RATE_SOURCE.publishedAt,
  validFrom: LABOR_RATE_SOURCE.validFrom,
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
  setLineQuantity: (code: string, quantity: number) => void;
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
      setLineQuantity: (code, quantity) =>
        set(state =>
          updateActiveDraft(state, draft => {
            const safeQuantity = Math.max(0, quantity);
            const existingLine = draft.lines.find(line => line.code === code);
            const rate = LABOR_RATES.find(item => item.code === code);

            if (safeQuantity === 0) {
              return { ...draft, lines: draft.lines.filter(line => line.code !== code) };
            }

            if (!existingLine && !rate) return draft;

            const nextLine: EstimateLine = existingLine
              ? { ...existingLine, quantity: safeQuantity }
              : {
                  code,
                  description: rate!.name,
                  quantity: safeQuantity,
                  unit: rate!.unit,
                  unitPriceKurus: tryToKurus(rate!.hourlyRate),
                };

            return {
              ...draft,
              lines: existingLine
                ? draft.lines.map(line => (line.code === code ? nextLine : line))
                : [...draft.lines, nextLine],
            };
          })
        ),
    }),
    {
      name: 'dmh-estimate-drafts-v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export function getActiveDraft(state: EstimateStore) {
  return state.drafts[state.activeProjectId] ?? createDraft(state.activeProjectId);
}
