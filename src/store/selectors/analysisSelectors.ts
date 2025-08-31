/**
 * Redux selectors for analysis state
 * Provides memoized and optimized access to analysis state
 */

import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import type { AnalysisState } from '../slices/analysisSlice';
import type { AnalysisJob, JobStatusType, JobPhaseType } from '../../types/analysis.types';

// Helper to safely access analysis state (handles PersistPartial)
const getAnalysisState = (state: RootState): AnalysisState => state.analysis as unknown as AnalysisState;

// Base selectors
export const selectAnalysisState = (state: RootState) => getAnalysisState(state);
export const selectActiveJobs = (state: RootState) => getAnalysisState(state).activeJobs;
export const selectJobHistory = (state: RootState) => getAnalysisState(state).jobHistory;
export const selectUIState = (state: RootState) => getAnalysisState(state).ui;
export const selectPollingState = (state: RootState) => getAnalysisState(state).polling;
export const selectIsLoading = (state: RootState) => getAnalysisState(state).isLoading;
export const selectError = (state: RootState) => getAnalysisState(state).error;

// Active jobs selectors
export const selectActiveJobsArray = createSelector(
  [selectActiveJobs],
  activeJobs => Object.values(activeJobs)
);

export const selectActiveJobsCount = createSelector(
  [selectActiveJobsArray],
  jobs => jobs.length
);

export const selectJobById = (jobId: string) =>
  createSelector(
    [selectActiveJobs, selectJobHistory],
    (activeJobs, history) => activeJobs[jobId] || history.find(job => job.id === jobId)
  );

export const selectActiveJobById = (jobId: string) =>
  createSelector([selectActiveJobs], activeJobs => activeJobs[jobId]);

// Job filtering selectors
export const selectJobsByStatus = (status: JobStatusType) =>
  createSelector([selectActiveJobsArray], jobs => jobs.filter(job => job.status === status));

export const selectJobsByPhase = (phase: JobPhaseType) =>
  createSelector([selectActiveJobsArray], jobs => jobs.filter(job => job.phase === phase));

export const selectProcessingJobs = createSelector([selectActiveJobsArray], jobs =>
  jobs.filter(job => job.status === 'processing')
);

export const selectCompletedJobs = createSelector([selectJobHistory], history =>
  history.filter(job => job.status === 'completed')
);

export const selectFailedJobs = createSelector([selectJobHistory], history =>
  history.filter(job => job.status === 'failed')
);

// UI selectors
export const selectCurrentView = (state: RootState) => getAnalysisState(state).ui.currentView;
export const selectSelectedJobId = (state: RootState) => getAnalysisState(state).ui.selectedJobId;
export const selectFilters = (state: RootState) => getAnalysisState(state).ui.filters;

export const selectSelectedJob = createSelector(
  [selectSelectedJobId, selectActiveJobs, selectJobHistory],
  (selectedId, activeJobs, history) => {
    if (!selectedId) return undefined;
    return activeJobs[selectedId] || history.find(job => job.id === selectedId);
  }
);

export const selectPanelStates = createSelector([selectUIState], ui => ({
  submission: ui.submissionPanelExpanded,
  tracking: ui.trackingPanelExpanded,
  history: ui.historyPanelExpanded,
}));

// Filtered job history based on UI filters
export const selectFilteredJobHistory = createSelector(
  [selectJobHistory, selectFilters],
  (history, filters) => {
    let filtered = history;

    if (filters.status) {
      filtered = filtered.filter(job => job.status === filters.status);
    }

    if (filters.fileType) {
      filtered = filtered.filter(job => job.fileType === filters.fileType);
    }

    if (filters.dateRange) {
      const start = new Date(filters.dateRange.start);
      const end = new Date(filters.dateRange.end);
      filtered = filtered.filter(job => {
        const jobDate = new Date(job.submittedAt);
        return jobDate >= start && jobDate <= end;
      });
    }

    return filtered;
  }
);

// Polling selectors
export const selectIsPolling = (state: RootState) => getAnalysisState(state).polling.isPolling;
export const selectPollingInterval = (state: RootState) => getAnalysisState(state).polling.interval;
export const selectJobsBeingPolled = (state: RootState) => getAnalysisState(state).polling.jobsBeingPolled;

export const selectShouldPoll = createSelector(
  [selectActiveJobsArray, selectIsPolling],
  (activeJobs, isPolling) => {
    const hasProcessingJobs = activeJobs.some(job => 
      job.status === 'processing' || job.status === 'pending'
    );
    return hasProcessingJobs && !isPolling;
  }
);

// Statistics selectors
export const selectJobStats = createSelector(
  [selectActiveJobsArray, selectJobHistory],
  (activeJobs, history) => {
    const allJobs = [...activeJobs, ...history];
    const totalJobs = allJobs.length;
    
    const statusCounts = allJobs.reduce(
      (acc, job) => {
        acc[job.status] = (acc[job.status] || 0) + 1;
        return acc;
      },
      {} as Record<JobStatusType, number>
    );

    const fileTypeCounts = allJobs.reduce(
      (acc, job) => {
        acc[job.fileType] = (acc[job.fileType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalJobs,
      activeJobsCount: activeJobs.length,
      historyCount: history.length,
      statusCounts,
      fileTypeCounts,
    };
  }
);

// Cost tracking selectors
export const selectTotalCost = createSelector([selectJobHistory], history =>
  history.reduce((total, job) => total + (job.actualCost || 0), 0)
);

export const selectCostByProvider = createSelector([selectJobHistory], history => {
  const costByProvider = history.reduce(
    (acc, job) => {
      if (job.config.llmProvider && job.actualCost) {
        const provider = job.config.llmProvider;
        acc[provider] = (acc[provider] || 0) + job.actualCost;
      }
      return acc;
    },
    {} as Record<string, number>
  );
  return costByProvider;
});

// Progress tracking selectors
export const selectOverallProgress = createSelector([selectActiveJobsArray], jobs => {
  if (jobs.length === 0) return 0;
  
  const totalProgress = jobs.reduce((sum, job) => sum + job.progress, 0);
  return Math.round(totalProgress / jobs.length);
});

export const selectJobProgress = (jobId: string) =>
  createSelector([selectActiveJobById(jobId)], job => job?.progress || 0);

// Recent activity selectors
export const selectRecentJobs = (limit = 5) =>
  createSelector([selectJobHistory], history =>
    history
      .slice()
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, limit)
  );

export const selectHasActiveJobs = createSelector(
  [selectActiveJobsCount],
  count => count > 0
);

export const selectHasJobHistory = createSelector(
  [selectJobHistory],
  history => history.length > 0
);

// Error state selectors
export const selectJobsWithErrors = createSelector([selectActiveJobsArray, selectJobHistory], 
  (activeJobs, history) => {
    const allJobs = [...activeJobs, ...history];
    return allJobs.filter(job => job.status === 'failed' || job.error);
  }
);