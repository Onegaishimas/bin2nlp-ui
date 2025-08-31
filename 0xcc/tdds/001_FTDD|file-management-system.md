# Technical Design Document: Analysis Job Management System

**Date:** 2025-08-31  
**Project:** bin2nlp-frontend  
**Feature:** Analysis Job Management System  
**Document ID:** 001_FTDD|file-management-system  
**Related PRD:** 001_FPRD|file-management-system.md

## Executive Summary

The Analysis Job Management System provides a comprehensive interface for job submission, tracking, and history management via REST polling integration. The technical approach leverages React 18 functional components with Material-UI for the interface, Redux Toolkit for state management, and RTK Query with smart polling for job status updates. The system emphasizes performance through efficient job state management and seamless integration with the bin2nlp job-based API architecture.

**Key Technical Decisions:**
- Single comprehensive AnalysisJobManager component with focused sub-components
- Job-centric state management with unified `/api/v1/decompile` endpoint integration
- RTK Query with intelligent polling for job status updates (1-2 second intervals)
- Session-based job history with persistent tracking across browser sessions
- Material-UI components following established design system patterns

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              AnalysisJobManager Component                  │
│  ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐  │
│  │ JobSubmission   │ │  JobTracking    │ │  JobHistory   │  │
│  │   Panel         │ │    Panel        │ │    Panel      │  │
│  └─────────────────┘ └─────────────────┘ └───────────────┘  │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                Redux Toolkit Store                          │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                 analysisSlice                           │ │
│  │  • Active jobs management                               │ │
│  │  • Job history tracking                                 │ │
│  │  • User credential storage (session)                    │ │
│  │  • Job status real-time updates                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                  RTK Query API                          │ │
│  │  • Job submission endpoint                              │ │
│  │  • Job status polling                                   │ │
│  │  • Job cancellation                                     │ │
│  │  • LLM provider management                              │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              RTK Query Smart Polling                        │
│  • Dynamic polling intervals based on job status           │
│  • Automatic pause/resume for inactive jobs                │
│  • Connection recovery and error handling                  │
│  • Batch status updates for multiple active jobs           │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                Browser Storage Layer                        │
│  ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐  │
│  │   localStorage  │ │  sessionStorage │ │   Memory      │  │
│  │   Job History   │ │  User Creds     │ │  Active Jobs  │  │
│  └─────────────────┘ └─────────────────┘ └───────────────┘  │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    bin2nlp Job API                          │
│  • POST /api/v1/decompile - Submit analysis job            │
│  • GET /api/v1/decompile/{job_id} - Get job status/results │
│  • DELETE /api/v1/decompile/{job_id} - Cancel job          │
│  • GET /api/v1/llm-providers - List LLM providers          │
│  • POST /api/v1/llm-providers/{id}/health-check            │
└─────────────────────────────────────────────────────────────┘
```

### Component Relationships and Data Flow

**Job Submission Flow:**
1. User uploads file via JobSubmissionPanel → FormData created with file + configuration
2. LLM credentials (if provided) → stored in sessionStorage securely
3. FormData submitted to POST /api/v1/decompile → job created with unique job_id
4. Job response received → Redux state updated with new active job
5. RTK Query polling starts → job status monitored at 1-2 second intervals
6. JobTracking panel displays progress → user sees real-time updates

**Job Status Flow:**
1. RTK Query polls GET /api/v1/decompile/{job_id} → status updates received
2. Job status changes trigger Redux updates → UI automatically refreshes
3. Completed jobs move to history → localStorage updated for persistence
4. Failed jobs display error information → retry/cancel options provided

**History Management Flow:**
1. JobHistory panel loads from localStorage → historical job data displayed
2. User selects historical job → job details and results accessed
3. Historical job retry triggers new submission → original configuration reused

### Integration Points

- **Configuration Interface Integration:** Job submission panel includes analysis configuration and LLM provider selection
- **Results Platform Integration:** Job completion triggers results viewer with decompilation and LLM translation data
- **RTK Query Smart Polling:** Centralized polling service manages all job status communications
- **LLM Provider Integration:** Provider discovery, health checking, and credential management

## Technical Stack

### Core Technologies

**Frontend Framework:**
- **React 18.2+** with functional components and hooks
- **TypeScript 5.1+** in strict mode for type safety
- **Vite 4.0+** for development and build tooling

**UI Framework:**
- **Material-UI (MUI) v5.14+** for consistent component design
- **@mui/icons-material** for job management icons
- **@mui/x-data-grid** for job history display and sorting

**State Management:**
- **Redux Toolkit 1.9+** for application state management
- **RTK Query** for API state management and smart polling
- **react-redux 8.1+** for React-Redux integration

**Job Processing:**
- **Web Crypto API** for secure credential handling
- **FormData API** for multipart job submission
- **File API** for file handling and validation

### Supporting Libraries

**Job Management:**
- **uuid** for client-side job ID generation and tracking
- **date-fns** for job timestamp formatting and duration calculations
- **lodash/debounce** for efficient polling interval management

**Development and Testing:**
- **Jest 29+** for unit testing
- **React Testing Library** for component testing
- **MSW (Mock Service Worker)** for API mocking in tests

### Justification for Technology Choices

**RTK Query Selection:** Provides intelligent polling capabilities with built-in caching, error handling, and automatic re-fetching based on job status changes.

**Redux Toolkit Choice:** Essential for complex job state management including active job tracking, polling coordination, and session-based credential management.

**Material-UI Integration:** Provides professional enterprise-ready components with excellent TypeScript support, aligning with ADR requirements for consistent UI patterns.

**Session-based Storage:** Balances security (credentials never persist) with user experience (job history retained across sessions).

## Data Design

### Redux State Schema

```typescript
// Consolidated Application Store Structure
interface RootState {
  // Analysis slice - Job management and tracking
  analysis: {
    activeJobs: Record<string, JobStatus>;    // Currently running/queued jobs
    jobHistory: JobStatus[];                  // Completed/cancelled job history
    selectedJob: string | null;               // Currently selected job for details
    submission: {
      isSubmitting: boolean;
      error: string | null;
      lastSubmittedJobId: string | null;
    };
  };
  
  // Providers slice - LLM provider management
  providers: {
    available: LLMProviderInfo[];             // Available providers from API
    selected: string | null;                  // Currently selected provider ID
    userCredentials: Record<string, string>;  // providerId -> apiKey (session-only)
    health: Record<string, ProviderHealthStatus>; // Provider health status
  };
  
  // UI slice - Application UI state
  ui: {
    currentView: 'submission' | 'tracking' | 'results'; // Main application view
    selectedJobId: string | null;            // Job selected for viewing
    sidebarExpanded: boolean;                 // Sidebar visibility state
    notifications: UINotification[];         // In-app notifications
  };
}

// Supporting interfaces
interface LLMProviderInfo {
  id: string;
  name: string;
  description: string;
  supported_models: string[];
  pricing_info: {
    input_cost_per_token: number;
    output_cost_per_token: number;
    currency: string;
  };
  capabilities: {
    supports_code_analysis: boolean;
    max_context_length: number;
    average_response_time_ms: number;
  };
}

interface JobStatus {
  job_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  submitted_at: string; // ISO timestamp
  completed_at?: string; // ISO timestamp
  error_message?: string;
  
  // Job configuration
  file_name: string;
  file_size: number;
  analysis_depth: 'basic' | 'standard' | 'detailed';
  llm_provider?: string;
  llm_model?: string;
  translation_detail?: 'basic' | 'detailed';
  
  // Results (when completed)
  results?: {
    function_count: number;
    import_count: number;
    string_count: number;
    decompilation_output: string;
    llm_translations?: Array<{
      function_name: string;
      original_code: string;
      translated_code: string;
      confidence: number;
    }>;
  };
  
  // Client-side tracking
  client_job_id: string; // UUID for client-side tracking
  last_updated: string; // ISO timestamp
  polling_active: boolean;
}
```

### Browser Storage Design

**localStorage Schema:**
```typescript
interface StoredJobHistory {
  version: string; // Schema version for migrations
  jobs: JobStatus[]; // Historical job records
  settings: {
    maxEntries: number; // Maximum history entries
    retentionDays: number; // Days to retain history
  };
  lastCleaned: string; // ISO timestamp
}
```

**sessionStorage Schema:**
```typescript
interface SessionCredentials {
  version: string;
  credentials: Record<string, {
    providerId: string;
    apiKey: string;
    encrypted: string; // Base64 encrypted API key
    lastUsed: string; // ISO timestamp
  }>;
  selectedProvider: string | null;
}
```

### Data Validation Strategy

**Job Submission Validation:**
- File validation: Size limits, format detection, malware scanning preparation
- Configuration validation: Required fields, parameter ranges, provider compatibility
- Credential validation: API key format, provider connectivity pre-check
- Rate limiting: Prevent excessive job submissions per session

**State Consistency:**
- All job state updates through Redux actions only
- Job status polling response validation before state updates
- Automatic cleanup of stale job data and expired credentials
- Version-based schema migration for localStorage data

### Migration and Data Preservation

**localStorage Migration Strategy:**
```typescript
const migrations = {
  '1.0': (data: any) => /* Initial version handling */,
  '1.1': (data: any) => /* Add new job status fields */,
  '1.2': (data: any) => /* Add LLM provider tracking */,
};

function migrateJobHistory(data: any): StoredJobHistory {
  const currentVersion = data.version || '1.0';
  const targetVersion = '1.2';
  
  if (currentVersion !== targetVersion) {
    return applyMigrations(data, currentVersion, targetVersion);
  }
  return data;
}
```

## API Design

### RTK Query Endpoint Design

```typescript
const analysisApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Job submission with FormData
    submitAnalysisJob: builder.mutation<JobSubmissionResponse, JobSubmissionRequest>({
      query: (jobData) => {
        const formData = new FormData();
        formData.append('file', jobData.file);
        formData.append('analysis_depth', jobData.analysisDepth);
        
        if (jobData.llmProvider) {
          formData.append('llm_provider', jobData.llmProvider);
          formData.append('llm_api_key', jobData.llmApiKey);
          formData.append('llm_model', jobData.llmModel || '');
          formData.append('translation_detail', jobData.translationDetail || 'basic');
        }
        
        return {
          url: '/api/v1/decompile',
          method: 'POST',
          body: formData,
        };
      },
      // Optimistic updates for immediate UI feedback
      onQueryStarted: async (jobData, { dispatch, queryFulfilled }) => {
        const clientJobId = generateUUID();
        dispatch(addActiveJob({
          clientJobId,
          status: 'queued',
          fileName: jobData.file.name,
          fileSize: jobData.file.size,
          analysisDepth: jobData.analysisDepth,
          llmProvider: jobData.llmProvider,
        }));
        
        try {
          const result = await queryFulfilled;
          dispatch(updateJobWithServerResponse({
            clientJobId,
            serverResponse: result.data,
          }));
        } catch (error) {
          dispatch(setJobError({
            clientJobId,
            error: error.message,
          }));
        }
      },
    }),

    // Job status with smart polling
    getJobStatus: builder.query<JobStatusResponse, string>({
      query: (jobId) => `/api/v1/decompile/${jobId}`,
      // Dynamic polling based on job status
      pollingInterval: (args, { getState }) => {
        const state = getState() as RootState;
        const job = Object.values(state.analysis.activeJobs)
          .find(j => j.job_id === args);
        
        if (!job) return 0; // No polling if job not found
        
        switch (job.status) {
          case 'processing':
            return 1000; // Poll every 1 second during processing
          case 'queued':
            return 2000; // Poll every 2 seconds when queued
          case 'completed':
          case 'failed':
          case 'cancelled':
            return 0; // Stop polling for terminal states
          default:
            return 5000; // Default 5 second polling
        }
      },
      // Transform response for consistent state management
      transformResponse: (response: any): JobStatusResponse => ({
        job_id: response.job_id,
        status: response.status,
        progress: response.progress || 0,
        submitted_at: response.submitted_at,
        completed_at: response.completed_at,
        error_message: response.error_message,
        results: response.results,
      }),
    }),

    // Job cancellation
    cancelAnalysisJob: builder.mutation<void, string>({
      query: (jobId) => ({
        url: `/api/v1/decompile/${jobId}`,
        method: 'DELETE',
      }),
      // Optimistic cancellation
      onQueryStarted: async (jobId, { dispatch, queryFulfilled }) => {
        dispatch(updateJobStatus({ jobId, status: 'cancelled' }));
        
        try {
          await queryFulfilled;
        } catch (error) {
          // Revert optimistic update on failure
          dispatch(revertJobStatus({ jobId }));
        }
      },
    }),

    // LLM Provider discovery
    listLLMProviders: builder.query<LLMProviderInfo[], void>({
      query: () => '/api/v1/llm-providers',
      // Cache for 5 minutes to avoid excessive calls
      keepUnusedDataFor: 300,
    }),

    // Provider health check
    checkProviderHealth: builder.mutation<ProviderHealthResponse, string>({
      query: (providerId) => ({
        url: `/api/v1/llm-providers/${providerId}/health-check`,
        method: 'POST',
      }),
    }),
  }),
});
```

### Request/Response Schemas

**Job Submission Request:**
```typescript
interface JobSubmissionRequest {
  file: File;
  analysisDepth: 'basic' | 'standard' | 'detailed';
  llmProvider?: string;
  llmApiKey?: string;
  llmModel?: string;
  translationDetail?: 'basic' | 'detailed';
}

interface JobSubmissionResponse {
  job_id: string;
  status: 'queued';
  submitted_at: string;
  estimated_completion_minutes: number;
}
```

**Job Status Response:**
```typescript
interface JobStatusResponse {
  job_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  submitted_at: string;
  completed_at?: string;
  error_message?: string;
  results?: {
    function_count: number;
    import_count: number;
    string_count: number;
    decompilation_output: string;
    llm_translations?: Array<{
      function_name: string;
      original_code: string;
      translated_code: string;
      confidence: number;
    }>;
  };
}
```

### Error Handling Strategy

**API Error Classification:**
```typescript
enum JobAPIError {
  NETWORK_ERROR = 'network_error',
  VALIDATION_ERROR = 'validation_error',
  SUBMISSION_ERROR = 'submission_error',
  SERVER_ERROR = 'server_error',
  JOB_NOT_FOUND = 'job_not_found',
  PROVIDER_ERROR = 'provider_error'
}

const handleJobAPIError = (error: any): JobAPIError => {
  if (error.status === 404) return JobAPIError.JOB_NOT_FOUND;
  if (error.status === 400) return JobAPIError.VALIDATION_ERROR;
  if (error.status >= 500) return JobAPIError.SERVER_ERROR;
  if (!navigator.onLine) return JobAPIError.NETWORK_ERROR;
  return JobAPIError.SUBMISSION_ERROR;
};
```

**Retry Strategy:**
- Network errors: 3 retries with exponential backoff
- Server errors: 2 retries with linear backoff
- Validation errors: No retry (user action required)
- Job not found: Single retry, then remove from active jobs

## Component Architecture

### Component Hierarchy

```typescript
// Unified Application Architecture
App/
└── AnalysisManager/             // Main container for all analysis features
    ├── JobSubmission/           // Job submission and configuration
    │   ├── FileUploadZone      // Drag-drop file interface
    │   ├── AnalysisConfigPanel // Analysis depth, parameters
    │   └── LLMProviderSelector // Provider selection + credentials
    ├── JobTracking/            // Active job monitoring
    │   ├── ActiveJobsList      // Current running jobs
    │   ├── JobProgressDisplay  // Progress bars and status
    │   └── JobControlButtons   // Cancel, retry, view details
    ├── JobHistory/             // Historical job management
    │   ├── CompletedJobsList   // Past job records
    │   └── JobResultsLinks     // Quick access to results
    ├── ResultsViewer/          // Results exploration interface
    │   ├── DecompilationResults // Assembly code and function analysis
    │   ├── LLMTranslationResults // Natural language translations
    │   └── ExportOptions       // Results export functionality
    ├── ProviderManagement/     // LLM provider configuration
    │   ├── ProviderDiscovery   // Available providers list
    │   ├── CredentialInput     // Secure API key input
    │   └── HealthMonitoring    // Provider status monitoring
    └── SystemStatus/           // System health and information
        ├── HealthIndicator     // Overall system status
        └── SystemInfo          // System capabilities and info
```

### Component Design Patterns

**AnalysisJobManager (Container Component):**
```typescript
interface AnalysisJobManagerProps {
  onJobComplete?: (jobId: string) => void;
  onViewResults?: (jobId: string) => void;
  className?: string;
  initialView?: 'submission' | 'tracking' | 'history';
}

const AnalysisJobManager: React.FC<AnalysisJobManagerProps> = ({
  onJobComplete,
  onViewResults,
  className,
  initialView = 'submission'
}) => {
  const dispatch = useAppDispatch();
  const { activeJobs, jobHistory, ui, userCredentials } = useAppSelector(
    state => state.analysis
  );

  // RTK Query hooks for job management
  const [submitJob] = useSubmitAnalysisJobMutation();
  const [cancelJob] = useCancelAnalysisJobMutation();
  
  // Smart polling for active jobs
  useEffect(() => {
    Object.keys(activeJobs).forEach(jobId => {
      const job = activeJobs[jobId];
      if (['queued', 'processing'].includes(job.status)) {
        // RTK Query will handle polling automatically based on pollingInterval
      }
    });
  }, [activeJobs]);

  const handleJobSubmission = useCallback(async (submissionData: JobSubmissionRequest) => {
    try {
      const result = await submitJob(submissionData).unwrap();
      dispatch(updateUI({ lastSubmittedJobId: result.job_id }));
    } catch (error) {
      dispatch(setSubmissionError(error.message));
    }
  }, [submitJob, dispatch]);

  return (
    <Box className={className} sx={{ p: 2 }}>
      <Tabs value={ui.currentView} onChange={(_, view) => dispatch(setCurrentView(view))}>
        <Tab label="Submit Job" value="submission" />
        <Tab label="Active Jobs" value="tracking" />
        <Tab label="Job History" value="history" />
      </Tabs>
      
      {ui.currentView === 'submission' && (
        <JobSubmissionPanel onSubmit={handleJobSubmission} />
      )}
      
      {ui.currentView === 'tracking' && (
        <JobTrackingPanel 
          activeJobs={activeJobs}
          onCancel={cancelJob}
          onViewResults={onViewResults}
        />
      )}
      
      {ui.currentView === 'history' && (
        <JobHistoryPanel 
          jobHistory={jobHistory}
          onViewResults={onViewResults}
        />
      )}
    </Box>
  );
};
```

**JobSubmissionPanel (Presentation Component):**
```typescript
interface JobSubmissionPanelProps {
  onSubmit: (data: JobSubmissionRequest) => Promise<void>;
  disabled?: boolean;
}

const JobSubmissionPanel: React.FC<JobSubmissionPanelProps> = ({
  onSubmit,
  disabled = false
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [analysisDepth, setAnalysisDepth] = useState<'basic' | 'standard' | 'detailed'>('standard');
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: providers } = useListLLMProvidersQuery();
  const [checkHealth] = useCheckProviderHealthMutation();

  const handleSubmit = useCallback(async () => {
    if (!file) return;
    
    setIsSubmitting(true);
    try {
      const submissionData: JobSubmissionRequest = {
        file,
        analysisDepth,
        llmProvider: selectedProvider || undefined,
        llmApiKey: apiKey || undefined,
      };
      
      await onSubmit(submissionData);
      
      // Reset form after successful submission
      setFile(null);
      setApiKey(''); // Clear sensitive data immediately
    } catch (error) {
      console.error('Job submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [file, analysisDepth, selectedProvider, apiKey, onSubmit]);

  return (
    <Card sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Submit Analysis Job
      </Typography>
      
      <FileUploadZone 
        onFileSelect={setFile}
        selectedFile={file}
        disabled={disabled || isSubmitting}
      />
      
      <AnalysisConfigForm
        analysisDepth={analysisDepth}
        onAnalysisDepthChange={setAnalysisDepth}
        disabled={disabled || isSubmitting}
      />
      
      <LLMProviderSelector
        providers={providers || []}
        selectedProvider={selectedProvider}
        onProviderChange={setSelectedProvider}
        apiKey={apiKey}
        onApiKeyChange={setApiKey}
        onHealthCheck={checkHealth}
        disabled={disabled || isSubmitting}
      />
      
      <Button
        variant="contained"
        size="large"
        fullWidth
        onClick={handleSubmit}
        disabled={!file || isSubmitting}
        sx={{ mt: 3 }}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Analysis Job'}
      </Button>
    </Card>
  );
};
```

### Reusability Patterns

**Custom Hooks for Job Management:**
```typescript
// Job submission with validation
export const useJobSubmission = () => {
  const dispatch = useAppDispatch();
  const [submitJob] = useSubmitAnalysisJobMutation();
  
  const submitAnalysisJob = useCallback(async (data: JobSubmissionRequest) => {
    // Pre-submission validation
    if (!data.file) throw new Error('File is required');
    if (data.file.size > 100 * 1024 * 1024) throw new Error('File too large');
    
    // Submit job
    const result = await submitJob(data).unwrap();
    
    // Store credentials securely in session
    if (data.llmApiKey && data.llmProvider) {
      dispatch(storeProviderCredential({
        providerId: data.llmProvider,
        apiKey: data.llmApiKey,
      }));
    }
    
    return result;
  }, [submitJob, dispatch]);

  return { submitAnalysisJob };
};

// Job status monitoring
export const useJobStatusMonitoring = (jobId: string) => {
  const { data: jobStatus, error, isLoading } = useGetJobStatusQuery(jobId, {
    // RTK Query will handle polling based on pollingInterval
    skip: !jobId,
  });
  
  const dispatch = useAppDispatch();
  
  // Update Redux state when job status changes
  useEffect(() => {
    if (jobStatus && jobId) {
      dispatch(updateJobStatus({ jobId, status: jobStatus }));
      
      // Move completed jobs to history
      if (['completed', 'failed', 'cancelled'].includes(jobStatus.status)) {
        dispatch(moveJobToHistory(jobId));
      }
    }
  }, [jobStatus, jobId, dispatch]);
  
  return { jobStatus, error, isLoading };
};
```

## State Management

### Redux Slice Organization

```typescript
const analysisSlice = createSlice({
  name: 'analysis',
  initialState,
  reducers: {
    // Job submission lifecycle
    addActiveJob: (state, action: PayloadAction<{
      clientJobId: string;
      status: string;
      fileName: string;
      fileSize: number;
      analysisDepth: string;
      llmProvider?: string;
    }>) => {
      const jobData = action.payload;
      state.activeJobs[jobData.clientJobId] = {
        client_job_id: jobData.clientJobId,
        job_id: '', // Will be set when server responds
        status: 'queued',
        progress: 0,
        file_name: jobData.fileName,
        file_size: jobData.fileSize,
        analysis_depth: jobData.analysisDepth,
        llm_provider: jobData.llmProvider,
        submitted_at: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        polling_active: true,
      };
    },

    updateJobWithServerResponse: (state, action: PayloadAction<{
      clientJobId: string;
      serverResponse: JobSubmissionResponse;
    }>) => {
      const { clientJobId, serverResponse } = action.payload;
      const job = state.activeJobs[clientJobId];
      if (job) {
        job.job_id = serverResponse.job_id;
        job.status = serverResponse.status;
        job.submitted_at = serverResponse.submitted_at;
        job.last_updated = new Date().toISOString();
      }
    },

    updateJobStatus: (state, action: PayloadAction<{
      jobId: string;
      status: JobStatusResponse;
    }>) => {
      const { jobId, status } = action.payload;
      const job = Object.values(state.activeJobs)
        .find(j => j.job_id === jobId || j.client_job_id === jobId);
      
      if (job) {
        job.status = status.status;
        job.progress = status.progress;
        job.completed_at = status.completed_at;
        job.error_message = status.error_message;
        job.results = status.results;
        job.last_updated = new Date().toISOString();
        
        // Stop polling for terminal states
        if (['completed', 'failed', 'cancelled'].includes(status.status)) {
          job.polling_active = false;
        }
      }
    },

    moveJobToHistory: (state, action: PayloadAction<string>) => {
      const jobId = action.payload;
      const job = Object.values(state.activeJobs)
        .find(j => j.job_id === jobId || j.client_job_id === jobId);
      
      if (job) {
        // Add to history
        state.jobHistory.unshift(job);
        
        // Remove from active jobs
        delete state.activeJobs[job.client_job_id];
        
        // Maintain history size limit
        if (state.jobHistory.length > 100) {
          state.jobHistory = state.jobHistory.slice(0, 50);
        }
      }
    },

    // UI state management
    setCurrentView: (state, action: PayloadAction<'submission' | 'tracking' | 'history' | 'results'>) => {
      state.ui.currentView = action.payload;
    },

    setSelectedJobId: (state, action: PayloadAction<string | null>) => {
      state.ui.selectedJobId = action.payload;
    },

    // Credential management (session-only)
    storeProviderCredential: (state, action: PayloadAction<{
      providerId: string;
      apiKey: string;
    }>) => {
      const { providerId, apiKey } = action.payload;
      state.userCredentials[providerId] = apiKey;
      
      // Also store in sessionStorage with encryption
      const credentials = {
        version: '1.0',
        credentials: {
          [providerId]: {
            providerId,
            apiKey: btoa(apiKey), // Simple base64 encoding
            lastUsed: new Date().toISOString(),
          }
        },
        selectedProvider: providerId,
      };
      
      sessionStorage.setItem('bin2nlp_credentials', JSON.stringify(credentials));
    },

    clearCredentials: (state) => {
      state.userCredentials = {};
      sessionStorage.removeItem('bin2nlp_credentials');
    },

    // Error handling
    setSubmissionError: (state, action: PayloadAction<string>) => {
      state.submission.error = action.payload;
    },

    setJobError: (state, action: PayloadAction<{
      clientJobId: string;
      error: string;
    }>) => {
      const { clientJobId, error } = action.payload;
      const job = state.activeJobs[clientJobId];
      if (job) {
        job.status = 'failed';
        job.error_message = error;
        job.polling_active = false;
      }
    },
  },
});
```

### Async Action Patterns

```typescript
// Thunk for job history persistence
export const persistJobHistory = createAsyncThunk(
  'analysis/persistJobHistory',
  async (_, { getState }) => {
    const state = getState() as RootState;
    const historyData: StoredJobHistory = {
      version: '1.2',
      jobs: state.analysis.jobHistory,
      settings: {
        maxEntries: 100,
        retentionDays: 30,
      },
      lastCleaned: new Date().toISOString(),
    };
    
    try {
      localStorage.setItem('bin2nlp_job_history', JSON.stringify(historyData));
    } catch (error) {
      // Handle quota exceeded - clean old entries
      if (historyData.jobs.length > 50) {
        historyData.jobs = historyData.jobs.slice(0, 25);
        localStorage.setItem('bin2nlp_job_history', JSON.stringify(historyData));
      }
    }
  }
);

// Thunk for credential restoration
export const restoreUserCredentials = createAsyncThunk(
  'analysis/restoreUserCredentials',
  async () => {
    try {
      const stored = sessionStorage.getItem('bin2nlp_credentials');
      if (stored) {
        const credentials: SessionCredentials = JSON.parse(stored);
        
        // Decrypt and restore credentials
        const decryptedCredentials: Record<string, string> = {};
        Object.entries(credentials.credentials).forEach(([id, cred]) => {
          decryptedCredentials[id] = atob(cred.apiKey); // Simple base64 decoding
        });
        
        return decryptedCredentials;
      }
    } catch (error) {
      console.warn('Failed to restore credentials:', error);
    }
    return {};
  }
);
```

### Smart Polling Implementation

```typescript
// RTK Query polling configuration with job status awareness
const createSmartPollingConfig = () => ({
  pollingInterval: (args: string, { getState }: any) => {
    const state = getState() as RootState;
    const job = Object.values(state.analysis.activeJobs)
      .find(j => j.job_id === args);
    
    if (!job || !job.polling_active) return 0;
    
    // Dynamic polling based on job status and age
    const jobAge = Date.now() - new Date(job.submitted_at).getTime();
    const ageInMinutes = jobAge / (1000 * 60);
    
    switch (job.status) {
      case 'processing':
        // Faster polling for processing jobs, with backoff for long-running jobs
        return ageInMinutes > 10 ? 3000 : 1000; // 1s for first 10 min, then 3s
      
      case 'queued':
        // Moderate polling for queued jobs
        return 2000; // 2 seconds
      
      case 'completed':
      case 'failed':
      case 'cancelled':
        // Stop polling for terminal states
        return 0;
      
      default:
        return 5000; // Default 5 second polling
    }
  },
  
  // Skip polling when tab is not visible to save resources
  skipPollingIfUnfocused: true,
  
  // Refetch on reconnect after network issues
  refetchOnReconnect: true,
  
  // Refetch when window regains focus
  refetchOnFocus: true,
});
```

## Security Considerations

### Credential Security

**Session-only Storage:**
```typescript
const encryptCredentials = (credentials: Record<string, string>): string => {
  // Simple encryption for demo - use proper encryption in production
  const encrypted = btoa(JSON.stringify(credentials));
  return encrypted;
};

const decryptCredentials = (encrypted: string): Record<string, string> => {
  try {
    return JSON.parse(atob(encrypted));
  } catch {
    return {};
  }
};

// Automatic credential cleanup
const setupCredentialCleanup = () => {
  // Clear credentials on page unload
  window.addEventListener('beforeunload', () => {
    sessionStorage.removeItem('bin2nlp_credentials');
  });
  
  // Clear credentials after 1 hour of inactivity
  let lastActivity = Date.now();
  const checkActivity = () => {
    if (Date.now() - lastActivity > 60 * 60 * 1000) {
      sessionStorage.removeItem('bin2nlp_credentials');
    }
  };
  
  setInterval(checkActivity, 5 * 60 * 1000); // Check every 5 minutes
  
  // Update activity timestamp on user interaction
  ['click', 'keypress', 'scroll'].forEach(event => {
    document.addEventListener(event, () => {
      lastActivity = Date.now();
    });
  });
};
```

**API Key Validation:**
```typescript
const validateApiKey = (providerId: string, apiKey: string): boolean => {
  const patterns = {
    openai: /^sk-[A-Za-z0-9]{48}$/,
    anthropic: /^sk-ant-api[0-9]{2}-[A-Za-z0-9_-]{95}$/,
    // Add more provider patterns
  };
  
  const pattern = patterns[providerId];
  return pattern ? pattern.test(apiKey) : apiKey.length > 0;
};
```

### Input Sanitization

**Job Configuration Sanitization:**
```typescript
const sanitizeJobConfiguration = (config: JobSubmissionRequest): JobSubmissionRequest => {
  return {
    file: config.file, // File object is immutable
    analysisDepth: ['basic', 'standard', 'detailed'].includes(config.analysisDepth) 
      ? config.analysisDepth 
      : 'standard',
    llmProvider: config.llmProvider?.replace(/[^a-zA-Z0-9_-]/g, ''),
    llmApiKey: config.llmApiKey?.trim(),
    llmModel: config.llmModel?.replace(/[^a-zA-Z0-9._-]/g, ''),
    translationDetail: ['basic', 'detailed'].includes(config.translationDetail || '') 
      ? config.translationDetail 
      : undefined,
  };
};
```

## Performance & Scalability

### Job Management Performance

**Efficient State Updates:**
- Batch job status updates to prevent excessive re-renders
- Use selective Redux subscriptions to avoid unnecessary component updates
- Implement virtual scrolling for large job history lists
- Cache job results to avoid repeated API calls

**Smart Polling Optimization:**
```typescript
// Polling manager to coordinate multiple job polling
class JobPollingManager {
  private activePolls = new Set<string>();
  private pollingInterval: NodeJS.Timeout | null = null;
  
  startPolling(jobId: string) {
    this.activePolls.add(jobId);
    if (!this.pollingInterval) {
      this.pollingInterval = setInterval(() => {
        this.batchPollJobs();
      }, 1000);
    }
  }
  
  stopPolling(jobId: string) {
    this.activePolls.delete(jobId);
    if (this.activePolls.size === 0 && this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }
  
  private async batchPollJobs() {
    // Batch multiple job status requests
    const jobIds = Array.from(this.activePolls);
    if (jobIds.length > 0) {
      // Use RTK Query batch functionality or implement custom batching
      jobIds.forEach(jobId => {
        // Individual polling managed by RTK Query
      });
    }
  }
}
```

**Memory Management:**
- Automatic cleanup of completed jobs after 24 hours
- Job history size limits with LRU eviction
- Proper cleanup of RTK Query subscriptions
- Session storage monitoring to prevent quota exceeded errors

### Scalability Considerations

**Client-Side Scaling:**
- Support for 50+ concurrent jobs without performance degradation
- Efficient handling of large job histories (1000+ jobs)
- Progressive loading of job details and results
- Background synchronization with server state

**Storage Scaling:**
- localStorage quota monitoring with automatic cleanup
- Efficient serialization for large job history datasets
- Background storage cleanup during idle time
- Graceful degradation when storage is unavailable

## Testing Strategy

### Testing Approach and Coverage

**Unit Testing Focus:**
```typescript
describe('analysisSlice', () => {
  describe('Job Management', () => {
    it('should handle addActiveJob action', () => {
      const initialState = createInitialAnalysisState();
      const jobData = {
        clientJobId: 'test-job',
        status: 'queued',
        fileName: 'test.exe',
        fileSize: 1024,
        analysisDepth: 'standard',
      };
      
      const action = addActiveJob(jobData);
      const newState = analysisSlice.reducer(initialState, action);
      
      expect(newState.activeJobs['test-job']).toBeDefined();
      expect(newState.activeJobs['test-job'].file_name).toBe('test.exe');
      expect(newState.activeJobs['test-job'].status).toBe('queued');
    });
    
    it('should move completed job to history', () => {
      const initialState = createInitialAnalysisState({
        activeJobs: {
          'test-job': createMockJobStatus({ status: 'completed' })
        }
      });
      
      const action = moveJobToHistory('test-job');
      const newState = analysisSlice.reducer(initialState, action);
      
      expect(newState.activeJobs['test-job']).toBeUndefined();
      expect(newState.jobHistory).toHaveLength(1);
      expect(newState.jobHistory[0].status).toBe('completed');
    });
  });
});
```

**Integration Testing:**
```typescript
describe('Job Submission Integration', () => {
  it('should submit job and update state correctly', async () => {
    const store = createTestStore();
    const mockFile = createMockFile('test.exe');
    
    const jobData: JobSubmissionRequest = {
      file: mockFile,
      analysisDepth: 'standard',
      llmProvider: 'openai',
      llmApiKey: 'test-key',
    };
    
    // Mock API response
    server.use(
      rest.post('/api/v1/decompile', (req, res, ctx) => {
        return res(ctx.json({
          job_id: 'server-job-123',
          status: 'queued',
          submitted_at: new Date().toISOString(),
          estimated_completion_minutes: 5,
        }));
      })
    );
    
    // Submit job
    await store.dispatch(analysisApi.endpoints.submitAnalysisJob.initiate(jobData));
    
    const state = store.getState();
    const activeJobs = Object.values(state.analysis.activeJobs);
    
    expect(activeJobs).toHaveLength(1);
    expect(activeJobs[0].job_id).toBe('server-job-123');
    expect(activeJobs[0].status).toBe('queued');
  });
});
```

**Component Testing:**
```typescript
describe('JobSubmissionPanel', () => {
  it('should submit job with correct data', async () => {
    const mockOnSubmit = jest.fn();
    const mockFile = createMockFile('test.exe');
    
    render(<JobSubmissionPanel onSubmit={mockOnSubmit} />);
    
    // Upload file
    const fileInput = screen.getByLabelText(/upload file/i);
    fireEvent.change(fileInput, { target: { files: [mockFile] } });
    
    // Select analysis depth
    const depthSelect = screen.getByLabelText(/analysis depth/i);
    fireEvent.change(depthSelect, { target: { value: 'detailed' } });
    
    // Submit
    const submitButton = screen.getByText(/submit analysis job/i);
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        file: mockFile,
        analysisDepth: 'detailed',
        llmProvider: undefined,
        llmApiKey: undefined,
      });
    });
  });
});
```

## Development Phases

### Phase 1: Core Job Management (Week 1-2)

**Objectives:**
- Implement job submission with FormData handling
- Establish Redux state management for job tracking
- Create basic Material-UI component structure
- Set up RTK Query with smart polling

**Deliverables:**
- AnalysisJobManager, JobSubmissionPanel, JobTrackingPanel components
- analysisSlice with job management actions
- RTK Query API integration with polling
- Unit tests for core job management functionality

### Phase 2: Advanced Features (Week 2-3)

**Objectives:**
- Implement job history with browser storage
- Add LLM provider integration and credential management
- Create comprehensive error handling and retry logic
- Integrate smart polling with dynamic intervals

**Deliverables:**
- JobHistoryPanel with search and filtering
- LLM provider discovery and health checking
- Session-based credential management
- Job status monitoring with automatic updates

### Phase 3: Performance & Polish (Week 3-4)

**Objectives:**
- Optimize performance for multiple concurrent jobs
- Implement efficient storage management
- Add comprehensive monitoring and error tracking
- Complete testing and documentation

**Deliverables:**
- Performance optimizations for job polling
- Virtual scrolling for large job lists
- Comprehensive error handling and recovery
- Complete test suite with high coverage

### Phase 4: Integration & Deployment (Week 4-5)

**Objectives:**
- Complete integration with results platform
- Finalize security measures and validation
- Prepare for production deployment
- User acceptance testing and feedback incorporation

**Deliverables:**
- Results platform integration
- Security audit completion
- Production deployment configuration
- User documentation and training materials

---

**Document Version:** 1.0  
**Last Updated:** 2025-08-31  
**Next Phase:** Technical Implementation Document (TID)  
**Related Documents:** 001_FPRD|file-management-system.md, 000_PADR|bin2nlp-frontend.md