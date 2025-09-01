/**
 * Redux Persist configuration
 * Selectively persists job history and UI preferences
 */

import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // localStorage
import type { AnalysisState } from './slices/analysisSlice';

// Transform to exclude sensitive data and large objects
const analysisTransform = {
  in: (inboundState: AnalysisState): AnalysisState => {
    // Clean up any sensitive data before persisting
    const cleanJobHistory = (inboundState.jobHistory || []).map(job => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { llmApiKey: _, ...configWithoutApiKey } = job.config;
      return {
        ...job,
        config: configWithoutApiKey,
        // Limit results size for storage efficiency
        ...(job.results && {
          results: {
            ...(job.results.decompilation && {
              decompilation: {
                ...job.results.decompilation,
                // Keep metadata but limit code size
                code: job.results.decompilation.code?.substring(0, 10000) || '',
              },
            }),
            ...(job.results.translation && { translation: job.results.translation }),
          },
        }),
      };
    });

    const result = {
      ...inboundState,
      // Don't persist active jobs (they should be refreshed)
      activeJobs: {},
      jobHistory: cleanJobHistory,
      // Reset polling state
      polling: {
        ...inboundState.polling,
        isPolling: false,
        jobsBeingPolled: [],
      },
      // Reset loading states
      isLoading: false,
    };

    // Remove error property instead of setting to undefined
    delete result.error;

    return result;
  },
  out: (outboundState: AnalysisState): AnalysisState => {
    // No transformation needed when reading from storage
    return outboundState;
  },
};

// Analysis slice persist config
export const analysisPersistConfig = {
  key: 'analysis',
  storage,
  // Only persist specific parts of the state
  whitelist: ['jobHistory', 'ui'] as Array<keyof AnalysisState>,
  // Don't persist these sensitive or temporary fields
  blacklist: ['activeJobs', 'polling', 'isLoading', 'error'] as Array<keyof AnalysisState>,
  transforms: [analysisTransform],
  // Throttle writes to storage
  throttle: 1000,
};

// Helper function to create persisted reducer
export const createPersistedAnalysisReducer = (
  reducer: (
    state: AnalysisState | undefined,
    action: { type: string; payload?: unknown }
  ) => AnalysisState
) => {
  return persistReducer(analysisPersistConfig, reducer);
};
