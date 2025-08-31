import analysisReducer, {
  setCurrentView,
  setLoading,
  addJob,
  updateJob,
  removeJob,
  cancelJob,
  setSelectedJob,
  togglePanel,
  startPolling,
  stopPolling,
  setFilters,
  clearJobHistory,
} from './analysisSlice';
import type { AnalysisState } from './analysisSlice';
import type { AnalysisJob } from '../../types/analysis.types';

// Test data
const mockJob: AnalysisJob = {
  id: 'test-job-1',
  fileName: 'test.exe',
  fileSize: 1024,
  fileType: 'PE',
  status: 'pending',
  progress: 0,
  phase: 'queued',
  submittedAt: '2023-01-01T00:00:00Z',
  config: {
    analysisDepth: 'basic',
    includeComments: true,
    decompilerOptions: {},
    llmProvider: 'openai',
  },
};

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
    interval: 2000,
    jobsBeingPolled: [],
  },
  isLoading: false,
  error: undefined,
};

describe('analysisSlice', () => {
  describe('UI actions', () => {
    it('should handle setCurrentView', () => {
      const action = setCurrentView('tracking');
      const state = analysisReducer(initialState, action);

      expect(state.ui.currentView).toBe('tracking');
    });

    it('should handle setSelectedJob', () => {
      const action = setSelectedJob('job-123');
      const state = analysisReducer(initialState, action);

      expect(state.ui.selectedJobId).toBe('job-123');
    });

    it('should handle togglePanel', () => {
      const action = togglePanel('submission');
      const state = analysisReducer(initialState, action);

      expect(state.ui.submissionPanelExpanded).toBe(false);
    });

    it('should handle setFilters', () => {
      const filters = { status: 'completed' as const, fileType: 'PE' };
      const action = setFilters(filters);
      const state = analysisReducer(initialState, action);

      expect(state.ui.filters).toEqual(filters);
    });
  });

  describe('Job management actions', () => {
    it('should handle addJob', () => {
      const action = addJob(mockJob);
      const state = analysisReducer(initialState, action);

      expect(state.activeJobs[mockJob.id]).toEqual(mockJob);
    });

    it('should handle updateJob', () => {
      const stateWithJob = analysisReducer(initialState, addJob(mockJob));
      const updates = { status: 'processing' as const, progress: 50 };
      const action = updateJob({ id: mockJob.id, ...updates });
      const state = analysisReducer(stateWithJob, action);

      expect(state.activeJobs[mockJob.id].status).toBe('processing');
      expect(state.activeJobs[mockJob.id].progress).toBe(50);
    });

    it('should move completed job to history', () => {
      const stateWithJob = analysisReducer(initialState, addJob(mockJob));
      const updates = { status: 'completed' as const, progress: 100, completedAt: '2023-01-01T01:00:00Z' };
      const action = updateJob({ id: mockJob.id, ...updates });
      const state = analysisReducer(stateWithJob, action);

      expect(state.activeJobs[mockJob.id]).toBeUndefined();
      expect(state.jobHistory).toHaveLength(1);
      expect(state.jobHistory[0].status).toBe('completed');
    });

    it('should handle removeJob', () => {
      const stateWithJob = analysisReducer(initialState, addJob(mockJob));
      const action = removeJob(mockJob.id);
      const state = analysisReducer(stateWithJob, action);

      expect(state.activeJobs[mockJob.id]).toBeUndefined();
    });

    it('should handle cancelJob', () => {
      const stateWithJob = analysisReducer(initialState, addJob(mockJob));
      const action = cancelJob(mockJob.id);
      const state = analysisReducer(stateWithJob, action);

      expect(state.activeJobs[mockJob.id]).toBeUndefined();
      expect(state.jobHistory).toHaveLength(1);
      expect(state.jobHistory[0].status).toBe('cancelled');
    });
  });

  describe('Polling actions', () => {
    it('should handle startPolling', () => {
      const action = startPolling({ jobIds: ['job1', 'job2'] });
      const state = analysisReducer(initialState, action);

      expect(state.polling.isPolling).toBe(true);
      expect(state.polling.jobsBeingPolled).toEqual(['job1', 'job2']);
    });

    it('should handle stopPolling', () => {
      const stateWithPolling = analysisReducer(initialState, startPolling({ jobIds: ['job1'] }));
      const action = stopPolling();
      const state = analysisReducer(stateWithPolling, action);

      expect(state.polling.isPolling).toBe(false);
      expect(state.polling.jobsBeingPolled).toEqual([]);
    });
  });

  describe('Loading and error states', () => {
    it('should handle setLoading', () => {
      const action = setLoading(true);
      const state = analysisReducer(initialState, action);

      expect(state.isLoading).toBe(true);
    });

    it('should handle clearJobHistory', () => {
      const stateWithHistory = {
        ...initialState,
        jobHistory: [mockJob],
      };
      const action = clearJobHistory();
      const state = analysisReducer(stateWithHistory, action);

      expect(state.jobHistory).toHaveLength(0);
    });
  });
});
