import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { 
  AnalysisJob,
  AnalysisUIState,
  PollingState,
  JobStatusType,
  JobPhaseType,
} from '../../types/analysis.types';

export interface AnalysisState {
  // Active jobs being processed or monitored
  activeJobs: Record<string, AnalysisJob>;

  // Job history for completed/failed jobs
  jobHistory: AnalysisJob[];

  // UI state
  ui: AnalysisUIState;

  // Polling state
  polling: PollingState;

  // Global loading and error states
  isLoading: boolean;
  error: string | undefined;
}

const initialState: AnalysisState = {
  activeJobs: {},
  jobHistory: [],
  ui: {
    currentView: 'submission',
    selectedJobId: undefined,
    submissionPanelExpanded: true,
    trackingPanelExpanded: true,
    historyPanelExpanded: false,
    filters: {},
  },
  polling: {
    isPolling: false,
    interval: 2000, // 2 seconds
    jobsBeingPolled: [],
  },
  isLoading: false,
  error: undefined,
};

const analysisSlice = createSlice({
  name: 'analysis',
  initialState,
  reducers: {
    // Job management actions
    addJob: (state, action: PayloadAction<AnalysisJob>) => {
      state.activeJobs[action.payload.id] = action.payload;
    },

    updateJob: (state, action: PayloadAction<Partial<AnalysisJob> & { id: string }>) => {
      const { id, ...updates } = action.payload;
      if (state.activeJobs[id]) {
        state.activeJobs[id] = { ...state.activeJobs[id], ...updates };

        // Move to history if completed or failed
        if (updates.status === 'completed' || updates.status === 'failed') {
          const job = state.activeJobs[id];
          state.jobHistory.unshift(job);
          delete state.activeJobs[id];

          // Remove from polling list
          state.polling.jobsBeingPolled = state.polling.jobsBeingPolled.filter(
            jobId => jobId !== id
          );
        }
      }
    },

    removeJob: (state, action: PayloadAction<string>) => {
      delete state.activeJobs[action.payload];
      state.polling.jobsBeingPolled = state.polling.jobsBeingPolled.filter(
        jobId => jobId !== action.payload
      );
    },

    cancelJob: (state, action: PayloadAction<string>) => {
      const job = state.activeJobs[action.payload];
      if (job) {
        job.status = 'cancelled';
        job.completedAt = new Date().toISOString();

        // Move to history
        state.jobHistory.unshift(job);
        delete state.activeJobs[action.payload];

        // Remove from polling
        state.polling.jobsBeingPolled = state.polling.jobsBeingPolled.filter(
          jobId => jobId !== action.payload
        );
      }
    },

    // UI actions
    setCurrentView: (state, action: PayloadAction<AnalysisState['ui']['currentView']>) => {
      state.ui.currentView = action.payload;
    },

    setSelectedJob: (state, action: PayloadAction<string | undefined>) => {
      state.ui.selectedJobId = action.payload;
    },

    togglePanel: (state, action: PayloadAction<'submission' | 'tracking' | 'history'>) => {
      const panel = action.payload;
      switch (panel) {
        case 'submission':
          state.ui.submissionPanelExpanded = !state.ui.submissionPanelExpanded;
          break;
        case 'tracking':
          state.ui.trackingPanelExpanded = !state.ui.trackingPanelExpanded;
          break;
        case 'history':
          state.ui.historyPanelExpanded = !state.ui.historyPanelExpanded;
          break;
      }
    },

    setFilters: (state, action: PayloadAction<Partial<AnalysisState['ui']['filters']>>) => {
      state.ui.filters = { ...state.ui.filters, ...action.payload };
    },

    clearFilters: state => {
      state.ui.filters = {};
    },

    // Polling actions
    startPolling: (state, action: PayloadAction<{ jobIds: string[]; interval?: number }>) => {
      state.polling.isPolling = true;
      state.polling.jobsBeingPolled = action.payload.jobIds;
      if (action.payload.interval) {
        state.polling.interval = action.payload.interval;
      }
    },

    stopPolling: state => {
      state.polling.isPolling = false;
      state.polling.jobsBeingPolled = [];
    },

    addJobToPolling: (state, action: PayloadAction<string>) => {
      if (!state.polling.jobsBeingPolled.includes(action.payload)) {
        state.polling.jobsBeingPolled.push(action.payload);
      }
    },

    removeJobFromPolling: (state, action: PayloadAction<string>) => {
      state.polling.jobsBeingPolled = state.polling.jobsBeingPolled.filter(
        jobId => jobId !== action.payload
      );
    },

    // Global state actions
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    setError: (state, action: PayloadAction<string | undefined>) => {
      state.error = action.payload;
    },

    clearError: state => {
      state.error = undefined;
    },

    // Bulk actions for history management
    clearJobHistory: state => {
      state.jobHistory = [];
    },

    removeFromHistory: (state, action: PayloadAction<string>) => {
      state.jobHistory = state.jobHistory.filter(job => job.id !== action.payload);
    },
  },
});

export const {
  addJob,
  updateJob,
  removeJob,
  cancelJob,
  setCurrentView,
  setSelectedJob,
  togglePanel,
  setFilters,
  clearFilters,
  startPolling,
  stopPolling,
  addJobToPolling,
  removeJobFromPolling,
  setLoading,
  setError,
  clearError,
  clearJobHistory,
  removeFromHistory,
} = analysisSlice.actions;

export default analysisSlice.reducer;
