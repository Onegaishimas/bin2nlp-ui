/**
 * Tests for analysis selectors
 */

import type { RootState } from '../index';
import type { AnalysisJob, JobStatusType } from '../../types/analysis.types';
import {
  selectActiveJobs,
  selectActiveJobsArray,
  selectActiveJobsCount,
  selectJobById,
  selectJobsByStatus,
  selectProcessingJobs,
  selectCompletedJobs,
  selectCurrentView,
  selectSelectedJob,
  selectFilteredJobHistory,
  selectJobStats,
  selectTotalCost,
  selectCostByProvider,
  selectRecentJobs,
  selectHasActiveJobs,
  selectJobsWithErrors,
} from './analysisSelectors';

// Mock data
const mockJob1: AnalysisJob = {
  id: 'job-1',
  fileName: 'test1.exe',
  fileSize: 1024,
  fileType: 'PE',
  status: 'processing',
  progress: 50,
  phase: 'decompiling',
  submittedAt: '2023-01-01T00:00:00Z',
  config: {
    analysisDepth: 'basic',
    includeComments: true,
    decompilerOptions: {},
    llmProvider: 'openai',
  },
  actualCost: 0.05,
};

const mockJob2: AnalysisJob = {
  id: 'job-2',
  fileName: 'test2.exe',
  fileSize: 2048,
  fileType: 'ELF',
  status: 'completed',
  progress: 100,
  phase: 'completed',
  submittedAt: '2023-01-01T01:00:00Z',
  completedAt: '2023-01-01T01:05:00Z',
  config: {
    analysisDepth: 'detailed',
    includeComments: false,
    decompilerOptions: {},
    llmProvider: 'anthropic',
  },
  actualCost: 0.12,
};

const mockJob3: AnalysisJob = {
  id: 'job-3',
  fileName: 'test3.exe',
  fileSize: 512,
  fileType: 'PE',
  status: 'failed',
  progress: 25,
  phase: 'failed',
  submittedAt: '2023-01-01T02:00:00Z',
  error: 'Decompilation failed',
  config: {
    analysisDepth: 'basic',
    includeComments: true,
    decompilerOptions: {},
  },
};

// Create test state that matches the real RootState structure
const testState = {
  analysis: {
    activeJobs: {
      'job-1': mockJob1,
    },
    jobHistory: [mockJob2, mockJob3],
    ui: {
      currentView: 'tracking' as const,
      selectedJobId: 'job-1',
      submissionPanelExpanded: true,
      trackingPanelExpanded: true,
      historyPanelExpanded: false,
      filters: {
        status: 'completed' as JobStatusType,
        fileType: 'PE',
      },
    },
    polling: {
      isPolling: true,
      interval: 1000,
      jobsBeingPolled: ['job-1'],
    },
    isLoading: false,
    error: undefined,
    // Redux Persist metadata
    _persist: {
      version: -1,
      rehydrated: true,
    },
  },
  analysisApi: {} as any,
} as RootState;

describe('Analysis Selectors', () => {
  describe('Basic selectors', () => {
    it('should select active jobs', () => {
      const result = selectActiveJobs(testState);
      expect(result).toEqual({ 'job-1': mockJob1 });
    });

    it('should select active jobs as array', () => {
      const result = selectActiveJobsArray(testState);
      expect(result).toEqual([mockJob1]);
    });

    it('should select active jobs count', () => {
      const result = selectActiveJobsCount(testState);
      expect(result).toBe(1);
    });

    it('should select current view', () => {
      const result = selectCurrentView(testState);
      expect(result).toBe('tracking');
    });
  });

  describe('Job filtering selectors', () => {
    it('should select jobs by status', () => {
      const selector = selectJobsByStatus('processing');
      const result = selector(testState);
      expect(result).toEqual([mockJob1]);
    });

    it('should select processing jobs', () => {
      const result = selectProcessingJobs(testState);
      expect(result).toEqual([mockJob1]);
    });

    it('should select completed jobs from history', () => {
      const result = selectCompletedJobs(testState);
      expect(result).toEqual([mockJob2]);
    });

    it('should select jobs with errors', () => {
      const result = selectJobsWithErrors(testState);
      expect(result).toEqual([mockJob3]);
    });
  });

  describe('Job lookup selectors', () => {
    it('should select job by id from active jobs', () => {
      const selector = selectJobById('job-1');
      const result = selector(testState);
      expect(result).toEqual(mockJob1);
    });

    it('should select job by id from history', () => {
      const selector = selectJobById('job-2');
      const result = selector(testState);
      expect(result).toEqual(mockJob2);
    });

    it('should return undefined for non-existent job', () => {
      const selector = selectJobById('non-existent');
      const result = selector(testState);
      expect(result).toBeUndefined();
    });
  });

  describe('Selected job selector', () => {
    it('should select the currently selected job', () => {
      const result = selectSelectedJob(testState);
      expect(result).toEqual(mockJob1);
    });

    it('should return undefined when no job is selected', () => {
      const stateWithoutSelection = {
        ...testState,
        analysis: {
          ...testState.analysis,
          ui: {
            ...(testState.analysis as any).ui,
            selectedJobId: undefined,
          },
        },
      } as RootState;
      const result = selectSelectedJob(stateWithoutSelection);
      expect(result).toBeUndefined();
    });
  });

  describe('Filtered job history', () => {
    it('should filter job history by status', () => {
      const stateWithStatusFilter = {
        ...testState,
        analysis: {
          ...testState.analysis,
          ui: {
            ...(testState.analysis as any).ui,
            filters: {
              status: 'completed' as JobStatusType,
            },
          },
        },
      } as RootState;
      const result = selectFilteredJobHistory(stateWithStatusFilter);
      // Should filter by status: 'completed' from mock filters
      expect(result).toEqual([mockJob2]);
    });

    it('should return all history when no filters', () => {
      const stateWithoutFilters = {
        ...testState,
        analysis: {
          ...testState.analysis,
          ui: {
            ...(testState.analysis as any).ui,
            filters: {},
          },
        },
      } as RootState;
      const result = selectFilteredJobHistory(stateWithoutFilters);
      expect(result).toEqual([mockJob2, mockJob3]);
    });
  });

  describe('Statistics selectors', () => {
    it('should calculate job stats', () => {
      const result = selectJobStats(testState);
      expect(result).toEqual({
        totalJobs: 3,
        activeJobsCount: 1,
        historyCount: 2,
        statusCounts: {
          processing: 1,
          completed: 1,
          failed: 1,
        },
        fileTypeCounts: {
          PE: 2,
          ELF: 1,
        },
      });
    });

    it('should calculate total cost', () => {
      const result = selectTotalCost(testState);
      expect(result).toBe(0.12); // Only job2 has actualCost
    });

    it('should calculate cost by provider', () => {
      const result = selectCostByProvider(testState);
      expect(result).toEqual({
        anthropic: 0.12,
      });
    });
  });

  describe('Utility selectors', () => {
    it('should detect active jobs', () => {
      const result = selectHasActiveJobs(testState);
      expect(result).toBe(true);
    });

    it('should select recent jobs', () => {
      const selector = selectRecentJobs(2);
      const result = selector(testState);
      // Should be sorted by submittedAt descending
      expect(result).toEqual([mockJob3, mockJob2]);
    });

    it('should limit recent jobs', () => {
      const selector = selectRecentJobs(1);
      const result = selector(testState);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockJob3);
    });
  });

  describe('Empty state handling', () => {
    const emptyState = {
      ...testState,
      analysis: {
        ...testState.analysis,
        activeJobs: {},
        jobHistory: [],
      },
    } as RootState;

    it('should handle empty active jobs', () => {
      const result = selectActiveJobsCount(emptyState);
      expect(result).toBe(0);
    });

    it('should handle empty job history', () => {
      const result = selectCompletedJobs(emptyState);
      expect(result).toEqual([]);
    });

    it('should return zero for total cost with no jobs', () => {
      const result = selectTotalCost(emptyState);
      expect(result).toBe(0);
    });

    it('should detect no active jobs', () => {
      const result = selectHasActiveJobs(emptyState);
      expect(result).toBe(false);
    });
  });
});