/**
 * Redux Persist configuration
 * Selectively persists job history and UI preferences
 */

import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // localStorage
import type { AnalysisState } from '../types/analysis.types';

// Transform to exclude sensitive data and large objects
const analysisTransform = {
  in: (inboundState: AnalysisState): AnalysisState => {
    // Clean up any sensitive data before persisting
    const cleanJobHistory = inboundState.jobHistory.map(job => ({
      ...job,
      config: {
        ...job.config,
        // Don't persist API keys
        llmApiKey: undefined,
      },
      // Limit results size for storage efficiency
      results: job.results ? {
        decompilation: job.results.decompilation ? {
          ...job.results.decompilation,
          // Keep metadata but limit code size
          code: job.results.decompilation.code?.substring(0, 10000) || '',
        } : undefined,
        translation: job.results.translation,
      } : undefined,
    }));

    return {
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
      error: undefined,
    };
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
export const createPersistedAnalysisReducer = (reducer: any) => {
  return persistReducer(analysisPersistConfig, reducer);
};