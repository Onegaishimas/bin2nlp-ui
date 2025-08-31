# Technical Implementation Document: Analysis Job Management System

**Date:** 2025-08-31  
**Project:** bin2nlp-frontend  
**Feature:** Analysis Job Management System  
**Document ID:** 001_FTID|file-management-system  
**Related PRD:** 001_FPRD|file-management-system.md  
**Related TDD:** 001_FTDD|file-management-system.md

## Implementation Overview

This Technical Implementation Document (TID) provides specific, actionable implementation details for the Analysis Job Management System based on the established PRD requirements and TDD architecture. The implementation follows a domain-driven structure with co-located components, hybrid state management using Redux Toolkit + RTK Query, and intelligent polling for job status updates.

**Key Implementation Principles:**
- Domain-driven file organization with `/src/analysis/`, `/src/providers/`, `/src/shared/` structure
- Co-located components keeping related code (components, hooks, tests, types) together
- Hybrid state management: RTK Query for API state, Redux slice for UI state and coordination
- Dynamic polling intervals based on job status for optimal resource usage
- Multi-layer error handling with boundaries, local states, and notifications
- Balanced testing approach covering unit, integration, and end-to-end scenarios

**Integration Strategy:**
The Analysis Job Management System serves as the foundation for all other features, providing job submission, tracking, and history management that will be consumed by the Results Exploration Platform and coordinated with the Multi-Provider LLM Integration system.

## File Structure and Organization

### Directory Organization and Naming Patterns

```
/src/
├── analysis/                           # Analysis job management domain
│   ├── components/                     # Analysis-specific components
│   │   ├── AnalysisJobManager/        # Main container component
│   │   │   ├── AnalysisJobManager.tsx
│   │   │   ├── AnalysisJobManager.test.tsx
│   │   │   ├── useJobManager.ts       # Custom hook for job coordination
│   │   │   ├── AnalysisJobManager.types.ts
│   │   │   └── index.ts
│   │   ├── JobSubmissionPanel/        # Job submission interface
│   │   │   ├── JobSubmissionPanel.tsx
│   │   │   ├── JobSubmissionPanel.test.tsx
│   │   │   ├── useJobSubmission.ts    # Submission logic hook
│   │   │   ├── JobSubmissionPanel.types.ts
│   │   │   ├── components/            # Sub-components
│   │   │   │   ├── FileUploadZone/
│   │   │   │   │   ├── FileUploadZone.tsx
│   │   │   │   │   ├── FileUploadZone.test.tsx
│   │   │   │   │   ├── useFileUpload.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── AnalysisConfigForm/
│   │   │   │   │   ├── AnalysisConfigForm.tsx
│   │   │   │   │   ├── AnalysisConfigForm.test.tsx
│   │   │   │   │   ├── useAnalysisConfig.ts
│   │   │   │   │   └── index.ts
│   │   │   │   └── CostEstimator/
│   │   │   │       ├── CostEstimator.tsx
│   │   │   │       ├── CostEstimator.test.tsx
│   │   │   │       ├── useCostCalculation.ts
│   │   │   │       └── index.ts
│   │   │   └── index.ts
│   │   ├── JobTrackingPanel/          # Active job monitoring
│   │   │   ├── JobTrackingPanel.tsx
│   │   │   ├── JobTrackingPanel.test.tsx
│   │   │   ├── useJobTracking.ts      # Polling coordination hook
│   │   │   ├── JobTrackingPanel.types.ts
│   │   │   ├── components/
│   │   │   │   ├── ActiveJobsList/
│   │   │   │   │   ├── ActiveJobsList.tsx
│   │   │   │   │   ├── ActiveJobsList.test.tsx
│   │   │   │   │   ├── useActiveJobs.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── JobProgressDisplay/
│   │   │   │   │   ├── JobProgressDisplay.tsx
│   │   │   │   │   ├── JobProgressDisplay.test.tsx
│   │   │   │   │   ├── useJobProgress.ts
│   │   │   │   │   └── index.ts
│   │   │   │   └── JobControlButtons/
│   │   │   │       ├── JobControlButtons.tsx
│   │   │   │       ├── JobControlButtons.test.tsx
│   │   │   │       ├── useJobControl.ts
│   │   │   │       └── index.ts
│   │   │   └── index.ts
│   │   ├── JobHistoryPanel/           # Historical job management
│   │   │   ├── JobHistoryPanel.tsx
│   │   │   ├── JobHistoryPanel.test.tsx
│   │   │   ├── useJobHistory.ts       # History management hook
│   │   │   ├── JobHistoryPanel.types.ts
│   │   │   ├── components/
│   │   │   │   ├── CompletedJobsList/
│   │   │   │   │   ├── CompletedJobsList.tsx
│   │   │   │   │   ├── CompletedJobsList.test.tsx
│   │   │   │   │   ├── useJobHistoryList.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── JobHistoryFilters/
│   │   │   │   │   ├── JobHistoryFilters.tsx
│   │   │   │   │   ├── JobHistoryFilters.test.tsx
│   │   │   │   │   ├── useHistoryFilters.ts
│   │   │   │   │   └── index.ts
│   │   │   │   └── JobRetryOptions/
│   │   │   │       ├── JobRetryOptions.tsx
│   │   │   │       ├── JobRetryOptions.test.tsx
│   │   │   │       ├── useJobRetry.ts
│   │   │   │       └── index.ts
│   │   │   └── index.ts
│   │   └── index.ts                   # Domain exports
│   ├── services/                      # Analysis domain services
│   │   ├── api/                       # RTK Query API definitions
│   │   │   ├── analysisApi.ts         # Main analysis API slice
│   │   │   ├── analysisApi.test.ts
│   │   │   ├── jobSubmissionApi.ts    # Job submission endpoints
│   │   │   ├── jobStatusApi.ts        # Job status polling endpoints
│   │   │   ├── jobControlApi.ts       # Job cancellation/retry endpoints
│   │   │   └── index.ts
│   │   ├── polling/                   # Smart polling services
│   │   │   ├── JobPollingManager.ts   # Centralized polling coordination
│   │   │   ├── JobPollingManager.test.ts
│   │   │   ├── pollingStrategies.ts   # Dynamic interval strategies
│   │   │   ├── pollingMiddleware.ts   # RTK Query polling middleware
│   │   │   └── index.ts
│   │   ├── storage/                   # Browser storage services
│   │   │   ├── JobHistoryStorage.ts   # localStorage job history management
│   │   │   ├── JobHistoryStorage.test.ts
│   │   │   ├── credentialStorage.ts   # sessionStorage credential management
│   │   │   ├── credentialStorage.test.ts
│   │   │   ├── storageUtils.ts        # Common storage utilities
│   │   │   └── index.ts
│   │   ├── validation/                # Job data validation
│   │   │   ├── jobValidation.ts       # Job submission validation
│   │   │   ├── jobValidation.test.ts
│   │   │   ├── fileValidation.ts      # File upload validation
│   │   │   ├── fileValidation.test.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── hooks/                         # Analysis domain custom hooks
│   │   ├── useJobSubmission.ts        # Job submission hook
│   │   ├── useJobSubmission.test.ts
│   │   ├── useJobTracking.ts          # Job status tracking hook
│   │   ├── useJobTracking.test.ts
│   │   ├── useJobHistory.ts           # Job history management hook
│   │   ├── useJobHistory.test.ts
│   │   ├── useJobPolling.ts           # Smart polling hook
│   │   ├── useJobPolling.test.ts
│   │   └── index.ts
│   ├── store/                         # Analysis domain Redux slice
│   │   ├── analysisSlice.ts           # Main analysis Redux slice
│   │   ├── analysisSlice.test.ts
│   │   ├── analysisSelectors.ts       # Reselect selectors
│   │   ├── analysisSelectors.test.ts
│   │   ├── analysisThunks.ts          # Async thunks
│   │   ├── analysisThunks.test.ts
│   │   └── index.ts
│   ├── types/                         # Analysis domain TypeScript interfaces
│   │   ├── JobTypes.ts                # Core job interfaces
│   │   ├── APITypes.ts                # API request/response types
│   │   ├── UITypes.ts                 # UI state interfaces
│   │   ├── StorageTypes.ts            # Storage schema types
│   │   └── index.ts
│   ├── utils/                         # Analysis domain utilities
│   │   ├── jobUtils.ts                # Job data manipulation utilities
│   │   ├── jobUtils.test.ts
│   │   ├── timeUtils.ts               # Job timing calculations
│   │   ├── timeUtils.test.ts
│   │   ├── statusUtils.ts             # Job status helpers
│   │   ├── statusUtils.test.ts
│   │   └── index.ts
│   └── index.ts                       # Analysis domain barrel export
├── providers/                         # LLM provider management domain
│   ├── components/                    # Provider-specific components
│   │   ├── LLMProviderSelector/       # Provider selection component
│   │   │   ├── LLMProviderSelector.tsx
│   │   │   ├── LLMProviderSelector.test.tsx
│   │   │   ├── useProviderSelection.ts
│   │   │   └── index.ts
│   │   ├── CredentialInput/           # API key input component
│   │   │   ├── CredentialInput.tsx
│   │   │   ├── CredentialInput.test.tsx
│   │   │   ├── useCredentialInput.ts
│   │   │   └── index.ts
│   │   └── ProviderHealthStatus/      # Health monitoring component
│   │       ├── ProviderHealthStatus.tsx
│   │       ├── ProviderHealthStatus.test.tsx
│   │       ├── useProviderHealth.ts
│   │       └── index.ts
│   ├── services/                      # Provider domain services
│   │   ├── api/                       # Provider API integration
│   │   │   ├── providersApi.ts        # Provider discovery API
│   │   │   ├── providersApi.test.ts
│   │   │   ├── healthCheckApi.ts      # Provider health check API
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── hooks/                         # Provider domain hooks
│   │   ├── useProviderDiscovery.ts    # Provider discovery hook
│   │   ├── useProviderHealth.ts       # Health monitoring hook
│   │   └── index.ts
│   ├── types/                         # Provider domain types
│   │   ├── ProviderTypes.ts           # Provider interfaces
│   │   └── index.ts
│   └── index.ts                       # Provider domain barrel export
├── shared/                            # Cross-domain shared code
│   ├── components/                    # Reusable UI components
│   │   ├── LoadingSpinner/            # Generic loading component
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── LoadingSpinner.test.tsx
│   │   │   └── index.ts
│   │   ├── ErrorBoundary/             # Error boundary component
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── ErrorBoundary.test.tsx
│   │   │   ├── useErrorBoundary.ts
│   │   │   └── index.ts
│   │   ├── NotificationSystem/        # Toast notifications
│   │   │   ├── NotificationSystem.tsx
│   │   │   ├── NotificationSystem.test.tsx
│   │   │   ├── useNotifications.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── services/                      # Cross-domain services
│   │   ├── api/                       # Common API utilities
│   │   │   ├── baseApi.ts             # RTK Query base API
│   │   │   ├── apiUtils.ts            # API utilities
│   │   │   ├── errorHandling.ts       # API error handling
│   │   │   └── index.ts
│   │   ├── storage/                   # Common storage utilities
│   │   │   ├── browserStorage.ts      # localStorage/sessionStorage abstractions
│   │   │   ├── storageSchema.ts       # Storage schema management
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── store/                         # Redux store configuration
│   │   ├── store.ts                   # Main store configuration
│   │   ├── rootReducer.ts             # Root reducer combining all slices
│   │   ├── middleware.ts              # Custom middleware
│   │   └── index.ts
│   ├── hooks/                         # Cross-domain hooks
│   │   ├── useAppDispatch.ts          # Typed dispatch hook
│   │   ├── useAppSelector.ts          # Typed selector hook
│   │   ├── useLocalStorage.ts         # localStorage hook
│   │   ├── useSessionStorage.ts       # sessionStorage hook
│   │   └── index.ts
│   ├── types/                         # Cross-domain types
│   │   ├── CommonTypes.ts             # Common interfaces
│   │   ├── APITypes.ts                # Base API types
│   │   ├── StorageTypes.ts            # Storage types
│   │   └── index.ts
│   ├── utils/                         # Cross-domain utilities
│   │   ├── dateUtils.ts               # Date formatting utilities
│   │   ├── fileUtils.ts               # File handling utilities
│   │   ├── validationUtils.ts         # Common validation
│   │   └── index.ts
│   └── index.ts                       # Shared barrel export
└── App.tsx                            # Main application component
```

### File Naming Conventions and Patterns

**Component Files:**
- Components: `PascalCase.tsx` (e.g., `AnalysisJobManager.tsx`)
- Component tests: `PascalCase.test.tsx` (e.g., `AnalysisJobManager.test.tsx`)
- Component types: `PascalCase.types.ts` (e.g., `AnalysisJobManager.types.ts`)
- Custom hooks: `useCamelCase.ts` (e.g., `useJobSubmission.ts`)
- Hook tests: `useCamelCase.test.ts` (e.g., `useJobSubmission.test.ts`)

**Service Files:**
- Services: `camelCase.ts` (e.g., `analysisApi.ts`)
- Service tests: `camelCase.test.ts` (e.g., `analysisApi.test.ts`)
- Utilities: `camelCase.ts` (e.g., `jobUtils.ts`)
- Types: `PascalCase.ts` (e.g., `JobTypes.ts`)

**Index Files:**
- Each directory contains an `index.ts` file for clean barrel exports
- Index files export all public interfaces from the directory
- Private implementation details are not exported

### Dependency Organization and Import Patterns

**Import Order Standards:**
```typescript
// 1. External libraries (React, Redux, MUI, etc.)
import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Card, Typography, Button } from '@mui/material';

// 2. Internal services and APIs
import { useSubmitAnalysisJobMutation, useListLLMProvidersQuery } from '../services/api';
import { JobHistoryStorage } from '../services/storage';

// 3. Shared utilities and components
import { LoadingSpinner, ErrorBoundary } from '../../shared/components';
import { validateJobSubmission } from '../../shared/utils';

// 4. Domain-specific imports
import { useJobSubmission } from '../hooks';
import { JobSubmissionRequest } from '../types';

// 5. Component-specific imports (relative)
import { FileUploadZone } from './components/FileUploadZone';
import { AnalysisConfigForm } from './components/AnalysisConfigForm';

// 6. Types (with type-only imports when possible)
import type { AnalysisJobManagerProps } from './AnalysisJobManager.types';
```

### Configuration Integration Hints

**Environment Configuration Pattern:**
```typescript
// src/shared/config/environment.ts
export const config = {
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || '/api/v1',
    timeout: import.meta.env.VITE_API_TIMEOUT || 30000,
  },
  polling: {
    defaultInterval: import.meta.env.VITE_POLLING_INTERVAL || 2000,
    maxRetries: import.meta.env.VITE_MAX_RETRIES || 3,
  },
  storage: {
    maxHistoryEntries: import.meta.env.VITE_MAX_HISTORY_ENTRIES || 100,
    sessionTimeout: import.meta.env.VITE_SESSION_TIMEOUT || 3600000, // 1 hour
  },
} as const;
```

**Build Integration:**
- Vite configuration for TypeScript path mapping
- ESLint configuration for import order enforcement
- Jest configuration for domain-based test organization
- Bundle analyzer integration for performance monitoring

## Component Implementation Hints

### Component Design Patterns and Abstraction Levels

**Container/Presentational Pattern Implementation:**

```typescript
// Container Component Pattern (AnalysisJobManager.tsx)
interface AnalysisJobManagerProps {
  className?: string;
  onJobComplete?: (jobId: string) => void;
  onViewResults?: (jobId: string) => void;
}

export const AnalysisJobManager: React.FC<AnalysisJobManagerProps> = ({
  className,
  onJobComplete,
  onViewResults
}) => {
  // Container logic: state management, API calls, business logic
  const dispatch = useAppDispatch();
  const { activeJobs, jobHistory, ui } = useAppSelector(state => state.analysis);
  
  // Business logic hooks
  const { submitJob, isSubmitting } = useJobSubmission();
  const { cancelJob } = useJobControl();
  const { jobPolling } = useJobPolling();
  
  // Event handlers
  const handleJobSubmission = useCallback(async (data: JobSubmissionRequest) => {
    try {
      const result = await submitJob(data);
      onJobComplete?.(result.job_id);
    } catch (error) {
      // Error handling
    }
  }, [submitJob, onJobComplete]);
  
  // Render presentational components
  return (
    <Box className={className}>
      <JobSubmissionPanel 
        onSubmit={handleJobSubmission}
        isSubmitting={isSubmitting}
      />
      <JobTrackingPanel
        activeJobs={activeJobs}
        onCancel={cancelJob}
        onViewResults={onViewResults}
      />
      <JobHistoryPanel
        jobHistory={jobHistory}
        onViewResults={onViewResults}
      />
    </Box>
  );
};
```

```typescript
// Presentational Component Pattern (JobSubmissionPanel.tsx)
interface JobSubmissionPanelProps {
  onSubmit: (data: JobSubmissionRequest) => Promise<void>;
  isSubmitting: boolean;
  disabled?: boolean;
}

export const JobSubmissionPanel: React.FC<JobSubmissionPanelProps> = ({
  onSubmit,
  isSubmitting,
  disabled = false
}) => {
  // Local form state only - no business logic
  const [formData, setFormData] = useState<JobSubmissionFormData>(initialFormData);
  const [errors, setErrors] = useState<ValidationErrors>({});
  
  // Form validation
  const validateForm = useCallback(() => {
    return validateJobSubmission(formData);
  }, [formData]);
  
  // Form submission
  const handleSubmit = useCallback(async () => {
    const validation = validateForm();
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    
    await onSubmit(formData);
    setFormData(initialFormData); // Reset form on success
  }, [formData, onSubmit, validateForm]);
  
  return (
    <Card sx={{ p: 3 }}>
      <FileUploadZone
        file={formData.file}
        onFileChange={(file) => setFormData(prev => ({ ...prev, file }))}
        error={errors.file}
        disabled={disabled || isSubmitting}
      />
      <AnalysisConfigForm
        config={formData.config}
        onChange={(config) => setFormData(prev => ({ ...prev, config }))}
        errors={errors.config}
        disabled={disabled || isSubmitting}
      />
      <Button
        variant="contained"
        onClick={handleSubmit}
        disabled={disabled || isSubmitting}
        fullWidth
      >
        {isSubmitting ? 'Submitting Job...' : 'Submit Analysis Job'}
      </Button>
    </Card>
  );
};
```

### Interface Design Principles and Consistency

**Component Interface Standards:**
```typescript
// Standard component prop interface pattern
interface BaseComponentProps {
  className?: string;        // For styling flexibility
  disabled?: boolean;        // For state management
  'data-testid'?: string;   // For testing
}

// Event handler interface pattern
interface ComponentEventHandlers {
  onSubmit?: (data: FormData) => Promise<void>;
  onChange?: (value: any) => void;
  onError?: (error: Error) => void;
  onCancel?: () => void;
}

// Complete component props interface
interface JobSubmissionPanelProps extends BaseComponentProps, ComponentEventHandlers {
  // Component-specific props
  initialData?: JobSubmissionFormData;
  isSubmitting?: boolean;
  validationErrors?: ValidationErrors;
}
```

**Consistent Error Handling Interface:**
```typescript
// Error handling prop pattern
interface ErrorHandlingProps {
  error?: string | Error | null;
  onError?: (error: Error) => void;
  onRetry?: () => void;
  showErrorBoundary?: boolean;
}

// Error display component interface
interface ErrorDisplayProps {
  error: Error | string;
  title?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  severity?: 'error' | 'warning' | 'info';
}
```

### Lifecycle Management and State Handling Hints

**React Lifecycle with Job Management:**
```typescript
export const useJobLifecycle = (jobId: string) => {
  const dispatch = useAppDispatch();
  
  // Job status polling lifecycle
  useEffect(() => {
    if (jobId) {
      dispatch(startJobPolling(jobId));
      
      return () => {
        dispatch(stopJobPolling(jobId));
      };
    }
  }, [jobId, dispatch]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up any pending API calls
      dispatch(cleanupJobData(jobId));
    };
  }, [jobId, dispatch]);
  
  // Handle job completion
  const handleJobComplete = useCallback((completedJobId: string) => {
    if (completedJobId === jobId) {
      dispatch(moveJobToHistory(jobId));
      dispatch(persistJobHistory());
    }
  }, [jobId, dispatch]);
  
  return { handleJobComplete };
};
```

**State Synchronization Pattern:**
```typescript
// Cross-component state synchronization
export const useJobStateSynchronization = () => {
  const dispatch = useAppDispatch();
  const { activeJobs } = useAppSelector(state => state.analysis);
  
  // Synchronize with localStorage
  useEffect(() => {
    const syncInterval = setInterval(() => {
      dispatch(persistJobHistory());
    }, 30000); // Sync every 30 seconds
    
    return () => clearInterval(syncInterval);
  }, [dispatch]);
  
  // Synchronize across tabs
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'bin2nlp_job_history' && event.newValue) {
        dispatch(loadJobHistoryFromStorage());
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [dispatch]);
};
```

### Composition Patterns and Reusability Approach

**Compound Component Pattern:**
```typescript
// Compound component for flexible job management
export const JobManager = {
  Root: AnalysisJobManager,
  Submission: JobSubmissionPanel,
  Tracking: JobTrackingPanel,
  History: JobHistoryPanel,
  Controls: JobControlButtons,
};

// Usage example:
<JobManager.Root>
  <JobManager.Submission onSubmit={handleSubmit} />
  <JobManager.Tracking jobs={activeJobs} />
  <JobManager.History jobs={history} />
</JobManager.Root>
```

**Higher-Order Component for Job Context:**
```typescript
// HOC for providing job context to child components
export const withJobContext = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return React.forwardRef<any, P>((props, ref) => {
    const jobContext = useJobContext();
    
    return (
      <JobContextProvider value={jobContext}>
        <Component {...props} ref={ref} />
      </JobContextProvider>
    );
  });
};

// Usage:
export const EnhancedJobSubmissionPanel = withJobContext(JobSubmissionPanel);
```

**Render Props Pattern for Flexible Rendering:**
```typescript
interface JobStatusRendererProps {
  jobId: string;
  children: (data: {
    job: JobStatus | null;
    isLoading: boolean;
    error: Error | null;
    retry: () => void;
  }) => React.ReactNode;
}

export const JobStatusRenderer: React.FC<JobStatusRendererProps> = ({
  jobId,
  children
}) => {
  const { data: job, isLoading, error, refetch } = useGetJobStatusQuery(jobId);
  
  return (
    <>
      {children({
        job: job || null,
        isLoading,
        error: error || null,
        retry: refetch,
      })}
    </>
  );
};

// Usage:
<JobStatusRenderer jobId="123">
  {({ job, isLoading, error, retry }) => (
    <div>
      {isLoading && <LoadingSpinner />}
      {error && <ErrorDisplay error={error} onRetry={retry} />}
      {job && <JobStatusDisplay job={job} />}
    </div>
  )}
</JobStatusRenderer>
```

## Database Implementation Approach

### Schema Design Patterns and Field Organization

**Browser Storage Schema Design:**

```typescript
// localStorage schema for job history
interface JobHistorySchema {
  version: string;                    // Schema version for migrations
  lastUpdated: string;               // ISO timestamp
  settings: {
    maxEntries: number;              // Maximum history entries (default: 100)
    retentionDays: number;           // Days to retain history (default: 30)
    autoCleanup: boolean;            // Automatic cleanup enabled (default: true)
  };
  jobs: {
    [jobId: string]: StoredJobRecord;
  };
  statistics: {
    totalJobs: number;
    successfulJobs: number;
    failedJobs: number;
    averageProcessingTime: number;   // in milliseconds
  };
}

interface StoredJobRecord {
  // Core job data
  job_id: string;
  client_job_id: string;             // Client-generated UUID
  status: JobStatus;
  
  // Timestamps
  submitted_at: string;              // ISO timestamp
  completed_at?: string;             // ISO timestamp
  last_updated: string;              // ISO timestamp
  
  // File information
  file_info: {
    name: string;
    size: number;
    type: string;
    hash?: string;                   // File hash for duplicate detection
  };
  
  // Configuration
  configuration: {
    analysis_depth: AnalysisDepth;
    llm_provider?: string;
    llm_model?: string;
    translation_detail?: TranslationDetail;
  };
  
  // Results summary (not full results)
  results_summary?: {
    function_count: number;
    import_count: number;
    string_count: number;
    has_llm_translations: boolean;
    processing_time_ms: number;
  };
  
  // Error information
  error_info?: {
    error_type: string;
    error_message: string;
    error_code?: string;
    retry_count: number;
  };
  
  // Client-side metadata
  metadata: {
    tags: string[];                  // User-defined tags
    notes?: string;                  // User notes
    starred: boolean;                // User favorited
    archived: boolean;               // User archived
  };
}
```

```typescript
// sessionStorage schema for credentials
interface CredentialSchema {
  version: string;
  created_at: string;               // ISO timestamp
  expires_at: string;               // ISO timestamp (1 hour from creation)
  credentials: {
    [providerId: string]: {
      provider_id: string;
      encrypted_key: string;        // Base64 encrypted API key
      model_preferences?: string[]; // Preferred models for provider
      last_used: string;           // ISO timestamp
      usage_count: number;         // Times this credential was used
    };
  };
  settings: {
    selected_provider?: string;     // Currently selected provider
    remember_selection: boolean;    // Remember provider choice
  };
}
```

### Migration Strategy and Rollback Considerations

**Schema Migration Implementation:**
```typescript
// Migration manager for localStorage schema evolution
class SchemaManager {
  private static readonly CURRENT_VERSION = '1.2.0';
  private static readonly STORAGE_KEY = 'bin2nlp_job_history';
  
  static migrate(data: any): JobHistorySchema {
    const version = data.version || '1.0.0';
    
    if (version === this.CURRENT_VERSION) {
      return data as JobHistorySchema;
    }
    
    return this.applyMigrations(data, version);
  }
  
  private static applyMigrations(data: any, fromVersion: string): JobHistorySchema {
    const migrations = {
      '1.0.0': this.migrateFrom1_0_0,
      '1.1.0': this.migrateFrom1_1_0,
    };
    
    let current = data;
    for (const [version, migrationFn] of Object.entries(migrations)) {
      if (this.isVersionGreater(version, fromVersion)) {
        current = migrationFn(current);
      }
    }
    
    return current;
  }
  
  private static migrateFrom1_0_0(data: any): any {
    // Migration from 1.0.0 to 1.1.0
    return {
      ...data,
      version: '1.1.0',
      statistics: {
        totalJobs: Object.keys(data.jobs || {}).length,
        successfulJobs: 0,
        failedJobs: 0,
        averageProcessingTime: 0,
      },
    };
  }
  
  private static migrateFrom1_1_0(data: any): any {
    // Migration from 1.1.0 to 1.2.0
    const jobs = Object.entries(data.jobs || {}).reduce((acc, [id, job]: [string, any]) => {
      acc[id] = {
        ...job,
        metadata: {
          tags: [],
          starred: false,
          archived: false,
          ...job.metadata,
        },
      };
      return acc;
    }, {} as Record<string, any>);
    
    return {
      ...data,
      version: '1.2.0',
      jobs,
    };
  }
  
  private static isVersionGreater(version1: string, version2: string): boolean {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;
      
      if (v1Part > v2Part) return true;
      if (v1Part < v2Part) return false;
    }
    
    return false;
  }
}
```

**Rollback Strategy:**
```typescript
// Backup and rollback utilities
class BackupManager {
  private static readonly BACKUP_KEY_PREFIX = 'bin2nlp_backup_';
  
  static createBackup(key: string, data: any): void {
    try {
      const backupKey = `${this.BACKUP_KEY_PREFIX}${key}_${Date.now()}`;
      localStorage.setItem(backupKey, JSON.stringify({
        original_key: key,
        created_at: new Date().toISOString(),
        data,
      }));
      
      // Keep only the 3 most recent backups
      this.cleanupOldBackups(key);
    } catch (error) {
      console.warn('Failed to create backup:', error);
    }
  }
  
  static rollback(key: string, backupTimestamp?: number): boolean {
    try {
      const backups = this.getBackups(key);
      const targetBackup = backupTimestamp 
        ? backups.find(b => b.timestamp === backupTimestamp)
        : backups[0]; // Most recent
      
      if (targetBackup) {
        localStorage.setItem(key, JSON.stringify(targetBackup.data));
        return true;
      }
    } catch (error) {
      console.error('Rollback failed:', error);
    }
    
    return false;
  }
  
  private static getBackups(key: string): Array<{ key: string; timestamp: number; data: any }> {
    const backups: Array<{ key: string; timestamp: number; data: any }> = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const storageKey = localStorage.key(i);
      if (storageKey?.startsWith(`${this.BACKUP_KEY_PREFIX}${key}_`)) {
        try {
          const backup = JSON.parse(localStorage.getItem(storageKey) || '{}');
          const timestamp = parseInt(storageKey.split('_').pop() || '0');
          backups.push({ key: storageKey, timestamp, data: backup.data });
        } catch (error) {
          console.warn('Invalid backup found:', storageKey);
        }
      }
    }
    
    return backups.sort((a, b) => b.timestamp - a.timestamp);
  }
  
  private static cleanupOldBackups(key: string): void {
    const backups = this.getBackups(key);
    if (backups.length > 3) {
      backups.slice(3).forEach(backup => {
        localStorage.removeItem(backup.key);
      });
    }
  }
}
```

### Query Optimization Patterns and Indexing Hints

**Efficient Data Retrieval Patterns:**
```typescript
// Optimized job history querying
class JobHistoryQueryEngine {
  private indexCache = new Map<string, any>();
  
  constructor(private storage: JobHistoryStorage) {}
  
  // Build indexes for efficient querying
  buildIndexes(jobs: StoredJobRecord[]): void {
    // Status index
    const statusIndex = jobs.reduce((acc, job) => {
      if (!acc[job.status]) acc[job.status] = [];
      acc[job.status].push(job.job_id);
      return acc;
    }, {} as Record<string, string[]>);
    
    // Date index (by month for efficient range queries)
    const dateIndex = jobs.reduce((acc, job) => {
      const monthKey = job.submitted_at.slice(0, 7); // YYYY-MM
      if (!acc[monthKey]) acc[monthKey] = [];
      acc[monthKey].push(job.job_id);
      return acc;
    }, {} as Record<string, string[]>);
    
    // Provider index
    const providerIndex = jobs.reduce((acc, job) => {
      const provider = job.configuration.llm_provider || 'none';
      if (!acc[provider]) acc[provider] = [];
      acc[provider].push(job.job_id);
      return acc;
    }, {} as Record<string, string[]>);
    
    this.indexCache.set('status', statusIndex);
    this.indexCache.set('date', dateIndex);
    this.indexCache.set('provider', providerIndex);
  }
  
  // Efficient filtering using indexes
  query(filters: {
    status?: JobStatus[];
    dateRange?: { from: string; to: string };
    provider?: string[];
    limit?: number;
    offset?: number;
  }): string[] {
    let candidateIds: Set<string> = new Set();
    
    // Apply status filter
    if (filters.status) {
      const statusIndex = this.indexCache.get('status');
      const statusIds = filters.status.flatMap(status => statusIndex[status] || []);
      candidateIds = new Set(statusIds);
    }
    
    // Apply date range filter
    if (filters.dateRange) {
      const dateIndex = this.indexCache.get('date');
      const { from, to } = filters.dateRange;
      
      const dateIds = Object.keys(dateIndex)
        .filter(monthKey => monthKey >= from.slice(0, 7) && monthKey <= to.slice(0, 7))
        .flatMap(monthKey => dateIndex[monthKey]);
      
      if (candidateIds.size === 0) {
        candidateIds = new Set(dateIds);
      } else {
        candidateIds = new Set([...candidateIds].filter(id => dateIds.includes(id)));
      }
    }
    
    // Apply provider filter
    if (filters.provider) {
      const providerIndex = this.indexCache.get('provider');
      const providerIds = filters.provider.flatMap(provider => providerIndex[provider] || []);
      
      if (candidateIds.size === 0) {
        candidateIds = new Set(providerIds);
      } else {
        candidateIds = new Set([...candidateIds].filter(id => providerIds.includes(id)));
      }
    }
    
    // Apply pagination
    const result = Array.from(candidateIds);
    const start = filters.offset || 0;
    const end = filters.limit ? start + filters.limit : result.length;
    
    return result.slice(start, end);
  }
}
```

### Data Integrity and Constraint Strategies

**Data Validation and Integrity:**
```typescript
// Comprehensive data validation for job records
class JobDataValidator {
  static validateJobRecord(job: StoredJobRecord): ValidationResult {
    const errors: string[] = [];
    
    // Required field validation
    if (!job.job_id) errors.push('job_id is required');
    if (!job.client_job_id) errors.push('client_job_id is required');
    if (!job.status) errors.push('status is required');
    if (!job.submitted_at) errors.push('submitted_at is required');
    
    // Data type validation
    if (job.submitted_at && !this.isValidISODate(job.submitted_at)) {
      errors.push('submitted_at must be valid ISO date');
    }
    
    if (job.completed_at && !this.isValidISODate(job.completed_at)) {
      errors.push('completed_at must be valid ISO date');
    }
    
    // Status validation
    const validStatuses = ['queued', 'processing', 'completed', 'failed', 'cancelled'];
    if (!validStatuses.includes(job.status)) {
      errors.push(`Invalid status: ${job.status}`);
    }
    
    // File information validation
    if (!job.file_info?.name) errors.push('file_info.name is required');
    if (!job.file_info?.size || job.file_info.size <= 0) {
      errors.push('file_info.size must be positive number');
    }
    
    // Configuration validation
    const validDepths = ['basic', 'standard', 'detailed'];
    if (!validDepths.includes(job.configuration.analysis_depth)) {
      errors.push(`Invalid analysis_depth: ${job.configuration.analysis_depth}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
  
  static validateJobHistorySchema(schema: JobHistorySchema): ValidationResult {
    const errors: string[] = [];
    
    // Schema validation
    if (!schema.version) errors.push('version is required');
    if (!schema.lastUpdated) errors.push('lastUpdated is required');
    
    // Settings validation
    if (!schema.settings) {
      errors.push('settings object is required');
    } else {
      if (schema.settings.maxEntries < 1) {
        errors.push('settings.maxEntries must be positive');
      }
      if (schema.settings.retentionDays < 1) {
        errors.push('settings.retentionDays must be positive');
      }
    }
    
    // Validate each job record
    Object.entries(schema.jobs).forEach(([jobId, job]) => {
      const jobValidation = this.validateJobRecord(job);
      if (!jobValidation.isValid) {
        errors.push(`Job ${jobId}: ${jobValidation.errors.join(', ')}`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
  
  private static isValidISODate(dateString: string): boolean {
    try {
      const date = new Date(dateString);
      return date.toISOString() === dateString;
    } catch {
      return false;
    }
  }
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}
```

## API Implementation Strategy

### Endpoint Organization and RESTful Design Hints

**RTK Query API Structure:**
```typescript
// Base API configuration with shared settings
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/v1',
    timeout: 30000,
    prepareHeaders: (headers, { getState }) => {
      // Add common headers
      headers.set('Content-Type', 'application/json');
      headers.set('Accept', 'application/json');
      
      // Add authentication headers if needed
      const state = getState() as RootState;
      const credentials = state.providers.userCredentials;
      
      return headers;
    },
  }),
  tagTypes: ['Job', 'JobStatus', 'Provider', 'ProviderHealth'],
  endpoints: () => ({}),
});

// Analysis API slice with job management endpoints
export const analysisApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Job submission endpoint
    submitAnalysisJob: builder.mutation<JobSubmissionResponse, JobSubmissionRequest>({
      query: (jobData) => {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('file', jobData.file);
        formData.append('analysis_depth', jobData.analysisDepth);
        
        // Add optional LLM parameters
        if (jobData.llmProvider) {
          formData.append('llm_provider', jobData.llmProvider);
          formData.append('llm_api_key', jobData.llmApiKey || '');
          formData.append('llm_model', jobData.llmModel || '');
          formData.append('translation_detail', jobData.translationDetail || 'basic');
        }
        
        return {
          url: '/decompile',
          method: 'POST',
          body: formData,
          formData: true, // Tell RTK Query this is form data
        };
      },
      // Tag invalidation for cache management
      invalidatesTags: ['Job'],
      // Transform response to match internal types
      transformResponse: (response: any): JobSubmissionResponse => ({
        job_id: response.job_id,
        status: response.status,
        submitted_at: response.submitted_at,
        estimated_completion_minutes: response.estimated_completion_minutes || 0,
      }),
    }),
    
    // Job status polling endpoint with smart intervals
    getJobStatus: builder.query<JobStatusResponse, string>({
      query: (jobId) => `/decompile/${jobId}`,
      // Provide tags for cache invalidation
      providesTags: (result, error, jobId) => [
        { type: 'JobStatus', id: jobId },
        { type: 'Job', id: jobId },
      ],
      // Dynamic polling configuration
      keepUnusedDataFor: 30, // Keep in cache for 30 seconds after last use
      // Transform response for consistent typing
      transformResponse: (response: any): JobStatusResponse => ({
        job_id: response.job_id,
        status: response.status,
        progress: response.progress || 0,
        submitted_at: response.submitted_at,
        completed_at: response.completed_at,
        updated_at: response.updated_at || new Date().toISOString(),
        error_message: response.error_message,
        file_info: {
          name: response.file_info?.name || '',
          size: response.file_info?.size || 0,
          format: response.file_info?.format || '',
        },
        configuration: {
          analysis_depth: response.configuration?.analysis_depth || 'standard',
          llm_provider: response.configuration?.llm_provider,
          translation_detail: response.configuration?.translation_detail,
        },
        results: response.results ? {
          function_count: response.results.function_count || 0,
          import_count: response.results.import_count || 0,
          string_count: response.results.string_count || 0,
          llm_translations: response.results.llm_translations || [],
        } : undefined,
      }),
    }),
    
    // Job cancellation endpoint
    cancelAnalysisJob: builder.mutation<void, string>({
      query: (jobId) => ({
        url: `/decompile/${jobId}`,
        method: 'DELETE',
      }),
      // Invalidate job status cache when cancelled
      invalidatesTags: (result, error, jobId) => [
        { type: 'JobStatus', id: jobId },
        { type: 'Job', id: jobId },
      ],
    }),
    
    // Bulk job status query for efficiency
    getMultipleJobStatuses: builder.query<Record<string, JobStatusResponse>, string[]>({
      query: (jobIds) => ({
        url: '/decompile/batch-status',
        method: 'POST',
        body: { job_ids: jobIds },
      }),
      // Transform to map structure
      transformResponse: (response: { jobs: JobStatusResponse[] }): Record<string, JobStatusResponse> => {
        return response.jobs.reduce((acc, job) => {
          acc[job.job_id] = job;
          return acc;
        }, {} as Record<string, JobStatusResponse>);
      },
      providesTags: (result, error, jobIds) => 
        jobIds.map(id => ({ type: 'JobStatus' as const, id })),
    }),
  }),
});

// LLM Provider API slice
export const providersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Provider discovery
    listLLMProviders: builder.query<LLMProviderInfo[], void>({
      query: () => '/llm-providers',
      providesTags: ['Provider'],
      // Keep provider list cached for 5 minutes
      keepUnusedDataFor: 300,
      transformResponse: (response: any[]): LLMProviderInfo[] => 
        response.map(provider => ({
          id: provider.id,
          name: provider.name,
          description: provider.description || '',
          supported_models: provider.supported_models || [],
          pricing_info: {
            input_cost_per_token: provider.pricing_info?.input_cost_per_token || 0,
            output_cost_per_token: provider.pricing_info?.output_cost_per_token || 0,
            currency: provider.pricing_info?.currency || 'USD',
          },
          capabilities: {
            supports_code_analysis: provider.capabilities?.supports_code_analysis ?? true,
            max_context_length: provider.capabilities?.max_context_length || 4000,
            average_response_time_ms: provider.capabilities?.average_response_time_ms || 5000,
          },
        })),
    }),
    
    // Provider health check
    checkProviderHealth: builder.mutation<ProviderHealthResponse, { providerId: string; apiKey: string }>({
      query: ({ providerId, apiKey }) => ({
        url: `/llm-providers/${providerId}/health-check`,
        method: 'POST',
        body: { api_key: apiKey },
      }),
      // Update provider health tags
      invalidatesTags: (result, error, { providerId }) => [
        { type: 'ProviderHealth', id: providerId },
      ],
    }),
  }),
});
```

### Request/Response Handling Patterns

**Request Interceptors and Transformation:**
```typescript
// Request preprocessing middleware
const requestPreprocessor: Middleware = (store) => (next) => (action) => {
  if (action.type?.endsWith('/pending') && action.meta?.arg) {
    const { endpointName, originalArgs } = action.meta.arg;
    
    // Add request correlation ID for tracking
    const correlationId = generateCorrelationId();
    
    // Log request for debugging
    console.log(`[API Request] ${endpointName}:`, {
      correlationId,
      args: originalArgs,
      timestamp: new Date().toISOString(),
    });
    
    // Add correlation ID to request headers
    if (action.meta.baseQueryMeta) {
      action.meta.baseQueryMeta.request.headers.set(
        'X-Correlation-ID', 
        correlationId
      );
    }
  }
  
  return next(action);
};

// Response transformation utilities
export const transformApiResponse = {
  // Standard error response transformation
  transformError: (error: any): APIError => ({
    type: 'api_error',
    message: error.data?.message || error.message || 'Unknown API error',
    code: error.data?.code || error.status || 'UNKNOWN',
    details: error.data?.details || {},
    timestamp: new Date().toISOString(),
    correlationId: error.response?.headers?.get('X-Correlation-ID'),
  }),
  
  // Job response transformation with validation
  transformJobResponse: (response: any): JobStatusResponse => {
    // Validate response structure
    if (!response.job_id) {
      throw new Error('Invalid job response: missing job_id');
    }
    
    return {
      job_id: response.job_id,
      status: response.status || 'unknown',
      progress: Math.max(0, Math.min(100, response.progress || 0)),
      submitted_at: response.submitted_at || new Date().toISOString(),
      completed_at: response.completed_at,
      updated_at: response.updated_at || new Date().toISOString(),
      error_message: response.error_message,
      file_info: {
        name: response.file_info?.name || 'unknown',
        size: Math.max(0, response.file_info?.size || 0),
        format: response.file_info?.format || 'unknown',
      },
      configuration: {
        analysis_depth: response.configuration?.analysis_depth || 'standard',
        llm_provider: response.configuration?.llm_provider,
        translation_detail: response.configuration?.translation_detail,
      },
      results: response.results ? {
        function_count: Math.max(0, response.results.function_count || 0),
        import_count: Math.max(0, response.results.import_count || 0),
        string_count: Math.max(0, response.results.string_count || 0),
        llm_translations: Array.isArray(response.results.llm_translations) 
          ? response.results.llm_translations 
          : [],
      } : undefined,
    };
  },
};
```

### Validation Layer Organization and Error Patterns

**API Request Validation:**
```typescript
// Request validation schemas using Zod or similar
import { z } from 'zod';

export const JobSubmissionSchema = z.object({
  file: z.instanceof(File)
    .refine(file => file.size <= 100 * 1024 * 1024, 'File must be less than 100MB')
    .refine(file => {
      const validTypes = ['application/x-executable', 'application/java-archive', 'application/octet-stream'];
      return validTypes.some(type => file.type.includes(type)) || 
             /\.(exe|elf|jar|so|dll|dylib)$/i.test(file.name);
    }, 'Invalid file type'),
  analysisDepth: z.enum(['basic', 'standard', 'detailed']),
  llmProvider: z.string().optional(),
  llmApiKey: z.string().min(1).optional(),
  llmModel: z.string().optional(),
  translationDetail: z.enum(['basic', 'detailed']).optional(),
});

export const JobStatusQuerySchema = z.object({
  jobId: z.string().uuid('Invalid job ID format'),
});

// Validation middleware for API calls
export const validationMiddleware: Middleware = (store) => (next) => (action) => {
  if (action.type?.includes('submitAnalysisJob/pending')) {
    const validationResult = JobSubmissionSchema.safeParse(action.meta.arg.originalArgs);
    
    if (!validationResult.success) {
      // Dispatch validation error
      store.dispatch(setSubmissionError(
        `Validation failed: ${validationResult.error.errors.map(e => e.message).join(', ')}`
      ));
      
      // Prevent API call
      return next({
        ...action,
        type: action.type.replace('/pending', '/rejected'),
        error: { message: 'Validation failed', validationErrors: validationResult.error.errors },
      });
    }
  }
  
  return next(action);
};
```

**Error Classification and Handling:**
```typescript
// Comprehensive error handling system
export enum APIErrorType {
  VALIDATION_ERROR = 'validation_error',
  NETWORK_ERROR = 'network_error',
  SERVER_ERROR = 'server_error',
  TIMEOUT_ERROR = 'timeout_error',
  AUTHENTICATION_ERROR = 'authentication_error',
  AUTHORIZATION_ERROR = 'authorization_error',
  RATE_LIMIT_ERROR = 'rate_limit_error',
  JOB_NOT_FOUND = 'job_not_found',
  PROVIDER_ERROR = 'provider_error',
  FILE_ERROR = 'file_error',
}

export class APIErrorHandler {
  static classifyError(error: any): APIErrorType {
    // Network connectivity errors
    if (!navigator.onLine) return APIErrorType.NETWORK_ERROR;
    if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
      return APIErrorType.TIMEOUT_ERROR;
    }
    
    // HTTP status code classification
    const status = error.status || error.response?.status;
    switch (status) {
      case 400: return APIErrorType.VALIDATION_ERROR;
      case 401: return APIErrorType.AUTHENTICATION_ERROR;
      case 403: return APIErrorType.AUTHORIZATION_ERROR;
      case 404: return APIErrorType.JOB_NOT_FOUND;
      case 429: return APIErrorType.RATE_LIMIT_ERROR;
      case 413: return APIErrorType.FILE_ERROR;
      case 500:
      case 502:
      case 503:
      case 504: return APIErrorType.SERVER_ERROR;
      default: return APIErrorType.NETWORK_ERROR;
    }
  }
  
  static getRetryStrategy(errorType: APIErrorType): RetryStrategy {
    switch (errorType) {
      case APIErrorType.NETWORK_ERROR:
      case APIErrorType.TIMEOUT_ERROR:
        return { shouldRetry: true, maxRetries: 3, backoffMs: 1000 };
      
      case APIErrorType.SERVER_ERROR:
        return { shouldRetry: true, maxRetries: 2, backoffMs: 2000 };
      
      case APIErrorType.RATE_LIMIT_ERROR:
        return { shouldRetry: true, maxRetries: 1, backoffMs: 5000 };
      
      case APIErrorType.VALIDATION_ERROR:
      case APIErrorType.AUTHENTICATION_ERROR:
      case APIErrorType.AUTHORIZATION_ERROR:
      case APIErrorType.JOB_NOT_FOUND:
        return { shouldRetry: false, maxRetries: 0, backoffMs: 0 };
      
      default:
        return { shouldRetry: false, maxRetries: 0, backoffMs: 0 };
    }
  }
  
  static getUserMessage(errorType: APIErrorType, originalMessage: string): string {
    const userMessages = {
      [APIErrorType.VALIDATION_ERROR]: 'Please check your input and try again.',
      [APIErrorType.NETWORK_ERROR]: 'Network connection error. Please check your internet connection.',
      [APIErrorType.SERVER_ERROR]: 'Server temporarily unavailable. Please try again in a moment.',
      [APIErrorType.TIMEOUT_ERROR]: 'Request timed out. Please try again.',
      [APIErrorType.AUTHENTICATION_ERROR]: 'Authentication failed. Please check your API key.',
      [APIErrorType.AUTHORIZATION_ERROR]: 'You don\'t have permission to perform this action.',
      [APIErrorType.RATE_LIMIT_ERROR]: 'Too many requests. Please wait a moment before trying again.',
      [APIErrorType.JOB_NOT_FOUND]: 'Job not found. It may have been deleted or completed.',
      [APIErrorType.PROVIDER_ERROR]: 'LLM provider error. Please check your configuration.',
      [APIErrorType.FILE_ERROR]: 'File upload error. Please check file size and format.',
    };
    
    return userMessages[errorType] || originalMessage || 'An unexpected error occurred.';
  }
}

interface RetryStrategy {
  shouldRetry: boolean;
  maxRetries: number;
  backoffMs: number;
}
```

### Authentication Integration and Middleware Approach

**Session-based Credential Management:**
```typescript
// Credential management middleware
export const credentialMiddleware: Middleware = (store) => (next) => (action) => {
  // Inject credentials into requests that need them
  if (action.type?.includes('submitAnalysisJob/pending') || 
      action.type?.includes('checkProviderHealth/pending')) {
    
    const state = store.getState() as RootState;
    const { userCredentials, selected } = state.providers;
    
    // Add credentials to request if available
    if (action.meta?.arg?.originalArgs?.llmProvider && selected) {
      const apiKey = userCredentials[selected];
      if (apiKey) {
        // Add to request args (will be processed by query function)
        action.meta.arg.originalArgs.llmApiKey = apiKey;
      }
    }
  }
  
  // Handle credential-related responses
  if (action.type?.includes('/fulfilled')) {
    // Update credential usage timestamp
    const providerId = action.meta?.arg?.originalArgs?.llmProvider;
    if (providerId) {
      store.dispatch(updateCredentialUsage(providerId));
    }
  }
  
  if (action.type?.includes('/rejected')) {
    const error = action.payload;
    if (error?.status === 401 || error?.status === 403) {
      // Clear invalid credentials
      const providerId = action.meta?.arg?.originalArgs?.llmProvider;
      if (providerId) {
        store.dispatch(clearProviderCredential(providerId));
      }
    }
  }
  
  return next(action);
};

// Secure credential storage service
export class CredentialStorage {
  private static readonly STORAGE_KEY = 'bin2nlp_credentials';
  private static readonly ENCRYPTION_KEY = 'bin2nlp_session_key';
  
  static store(providerId: string, apiKey: string): void {
    try {
      const existing = this.load();
      const updated = {
        ...existing,
        credentials: {
          ...existing.credentials,
          [providerId]: {
            provider_id: providerId,
            encrypted_key: this.encrypt(apiKey),
            last_used: new Date().toISOString(),
            usage_count: (existing.credentials[providerId]?.usage_count || 0) + 1,
          },
        },
        settings: {
          ...existing.settings,
          selected_provider: providerId,
        },
      };
      
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to store credentials:', error);
    }
  }
  
  static load(): CredentialSchema {
    try {
      const stored = sessionStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored) as CredentialSchema;
        
        // Check expiration
        if (new Date(data.expires_at) > new Date()) {
          return data;
        } else {
          // Expired - clear storage
          this.clear();
        }
      }
    } catch (error) {
      console.error('Failed to load credentials:', error);
    }
    
    return this.createEmpty();
  }
  
  static get(providerId: string): string | null {
    const data = this.load();
    const credential = data.credentials[providerId];
    
    if (credential) {
      try {
        return this.decrypt(credential.encrypted_key);
      } catch (error) {
        console.error('Failed to decrypt credential:', error);
        this.remove(providerId);
      }
    }
    
    return null;
  }
  
  static remove(providerId: string): void {
    const data = this.load();
    delete data.credentials[providerId];
    
    if (data.settings.selected_provider === providerId) {
      data.settings.selected_provider = undefined;
    }
    
    sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }
  
  static clear(): void {
    sessionStorage.removeItem(this.STORAGE_KEY);
  }
  
  private static encrypt(value: string): string {
    // Simple base64 encoding for demo - use proper encryption in production
    return btoa(value);
  }
  
  private static decrypt(encryptedValue: string): string {
    // Simple base64 decoding for demo - use proper decryption in production
    return atob(encryptedValue);
  }
  
  private static createEmpty(): CredentialSchema {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour
    
    return {
      version: '1.0',
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      credentials: {},
      settings: {
        remember_selection: true,
      },
    };
  }
}
```

## Frontend Implementation Approach

### Component Composition and Hierarchy Hints

**Main Application Architecture:**
```typescript
// App.tsx - Root application component
export const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ErrorBoundary>
          <NotificationProvider>
            <AppRouter />
          </NotificationProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </Provider>
  );
};

// Main routing structure
const AppRouter: React.FC = () => {
  return (
    <Router>
      <AppLayout>
        <Routes>
          <Route path="/" element={<AnalysisJobManager />} />
          <Route path="/results/:jobId" element={<ResultsViewer />} />
          <Route path="/providers" element={<ProviderManagement />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </Router>
  );
};
```

**Component Composition Patterns:**
```typescript
// Composition-based architecture for flexible layouts
interface AppLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ 
  children, 
  sidebar, 
  header 
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            bin2nlp Analysis Platform
          </Typography>
          <SystemStatusIndicator />
        </Toolbar>
      </AppBar>
      
      {/* Sidebar */}
      <Drawer
        variant="persistent"
        open={sidebarOpen}
        sx={{ width: 280, flexShrink: 0 }}
      >
        <Toolbar /> {/* Spacer for app bar */}
        <NavigationSidebar />
      </Drawer>
      
      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          ml: sidebarOpen ? '280px' : 0,
          transition: (theme) => theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar /> {/* Spacer for app bar */}
        {children}
      </Box>
    </Box>
  );
};
```

### State Management Integration Patterns

**Redux Integration with Components:**
```typescript
// Custom hooks for typed Redux integration
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Selector patterns for efficient re-renders
export const analysisSelectors = {
  selectActiveJobs: createSelector(
    [(state: RootState) => state.analysis.activeJobs],
    (activeJobs) => Object.values(activeJobs).sort((a, b) => 
      new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
    )
  ),
  
  selectJobHistory: createSelector(
    [(state: RootState) => state.analysis.jobHistory],
    (jobHistory) => jobHistory.slice(0, 50) // Limit for performance
  ),
  
  selectJobById: (jobId: string) => createSelector(
    [(state: RootState) => state.analysis.activeJobs, (state: RootState) => state.analysis.jobHistory],
    (activeJobs, jobHistory) => 
      activeJobs[jobId] || jobHistory.find(job => job.job_id === jobId)
  ),
  
  selectJobsByStatus: (status: JobStatus) => createSelector(
    [analysisSelectors.selectActiveJobs, analysisSelectors.selectJobHistory],
    (activeJobs, jobHistory) => 
      [...activeJobs, ...jobHistory].filter(job => job.status === status)
  ),
};

// Component integration with optimized selectors
export const JobTrackingPanel: React.FC<JobTrackingPanelProps> = () => {
  // Use memoized selectors to prevent unnecessary re-renders
  const activeJobs = useAppSelector(analysisSelectors.selectActiveJobs);
  const selectedJobId = useAppSelector(state => state.ui.selectedJobId);
  const pollingActive = useAppSelector(state => state.analysis.ui.isPollingActive);
  
  const dispatch = useAppDispatch();
  
  // Memoized handlers to prevent child re-renders
  const handleJobCancel = useCallback((jobId: string) => {
    dispatch(cancelAnalysisJob(jobId));
  }, [dispatch]);
  
  const handleJobSelect = useCallback((jobId: string) => {
    dispatch(setSelectedJobId(jobId));
  }, [dispatch]);
  
  return (
    <Card>
      <CardHeader 
        title="Active Jobs"
        action={
          <Chip 
            label={`${activeJobs.length} active`}
            color={pollingActive ? "success" : "default"}
            size="small"
          />
        }
      />
      <CardContent>
        {activeJobs.map(job => (
          <JobProgressCard
            key={job.job_id}
            job={job}
            selected={job.job_id === selectedJobId}
            onCancel={handleJobCancel}
            onSelect={handleJobSelect}
          />
        ))}
        {activeJobs.length === 0 && (
          <EmptyStateDisplay 
            message="No active jobs"
            action="Submit a new analysis job to get started"
          />
        )}
      </CardContent>
    </Card>
  );
};
```

### Event Handling and User Interaction Strategies

**Form Handling Patterns:**
```typescript
// Custom form hook with validation
export const useJobSubmissionForm = () => {
  const [formData, setFormData] = useState<JobSubmissionFormData>({
    file: null,
    analysisDepth: 'standard',
    llmProvider: '',
    llmApiKey: '',
    llmModel: '',
    translationDetail: 'basic',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Debounced validation
  const debouncedValidate = useMemo(
    () => debounce((data: JobSubmissionFormData) => {
      const validationResult = validateJobSubmission(data);
      setErrors(validationResult.errors);
    }, 300),
    []
  );
  
  // Update form data with validation
  const updateFormData = useCallback((updates: Partial<JobSubmissionFormData>) => {
    setFormData(prev => {
      const updated = { ...prev, ...updates };
      debouncedValidate(updated);
      return updated;
    });
  }, [debouncedValidate]);
  
  // File upload handling
  const handleFileUpload = useCallback((file: File | null) => {
    if (file) {
      // Validate file immediately
      const fileValidation = validateFile(file);
      if (!fileValidation.isValid) {
        setErrors(prev => ({ ...prev, file: fileValidation.error }));
        return;
      }
      
      // Clear file error and update
      setErrors(prev => ({ ...prev, file: '' }));
      updateFormData({ file });
    } else {
      updateFormData({ file: null });
    }
  }, [updateFormData]);
  
  // Form submission
  const submitForm = useCallback(async (
    onSubmit: (data: JobSubmissionRequest) => Promise<void>
  ) => {
    setIsSubmitting(true);
    
    try {
      // Final validation
      const validationResult = validateJobSubmission(formData);
      if (!validationResult.isValid) {
        setErrors(validationResult.errors);
        return;
      }
      
      // Submit form
      await onSubmit(formData);
      
      // Reset form on success
      setFormData({
        file: null,
        analysisDepth: 'standard',
        llmProvider: '',
        llmApiKey: '',
        llmModel: '',
        translationDetail: 'basic',
      });
      setErrors({});
      
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData]);
  
  return {
    formData,
    errors,
    isSubmitting,
    updateFormData,
    handleFileUpload,
    submitForm,
  };
};
```

**Event Handler Optimization:**
```typescript
// Optimized event handlers to prevent excessive re-renders
export const JobControlButtons: React.FC<JobControlButtonsProps> = ({ 
  job, 
  onCancel, 
  onRetry, 
  onViewResults 
}) => {
  // Memoized handlers with stable references
  const handleCancel = useCallback(() => {
    onCancel(job.job_id);
  }, [job.job_id, onCancel]);
  
  const handleRetry = useCallback(() => {
    onRetry(job.job_id);
  }, [job.job_id, onRetry]);
  
  const handleViewResults = useCallback(() => {
    onViewResults(job.job_id);
  }, [job.job_id, onViewResults]);
  
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'cancel' | 'retry' | null;
  }>({ open: false, action: null });
  
  const handleConfirmAction = useCallback(() => {
    switch (confirmDialog.action) {
      case 'cancel':
        handleCancel();
        break;
      case 'retry':
        handleRetry();
        break;
    }
    setConfirmDialog({ open: false, action: null });
  }, [confirmDialog.action, handleCancel, handleRetry]);
  
  return (
    <>
      <ButtonGroup size="small" variant="outlined">
        {job.status === 'processing' || job.status === 'queued' ? (
          <Button
            color="error"
            startIcon={<CancelIcon />}
            onClick={() => setConfirmDialog({ open: true, action: 'cancel' })}
          >
            Cancel
          </Button>
        ) : job.status === 'failed' ? (
          <Button
            color="primary"
            startIcon={<RetryIcon />}
            onClick={() => setConfirmDialog({ open: true, action: 'retry' })}
          >
            Retry
          </Button>
        ) : job.status === 'completed' ? (
          <Button
            color="primary"
            startIcon={<ViewIcon />}
            onClick={handleViewResults}
          >
            View Results
          </Button>
        ) : null}
      </ButtonGroup>
      
      <ConfirmationDialog
        open={confirmDialog.open}
        title={`${confirmDialog.action === 'cancel' ? 'Cancel' : 'Retry'} Job?`}
        message={
          confirmDialog.action === 'cancel'
            ? 'Are you sure you want to cancel this job? This action cannot be undone.'
            : 'Are you sure you want to retry this job? This will create a new job with the same configuration.'
        }
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmDialog({ open: false, action: null })}
        confirmButtonText={confirmDialog.action === 'cancel' ? 'Cancel Job' : 'Retry Job'}
        confirmButtonColor={confirmDialog.action === 'cancel' ? 'error' : 'primary'}
      />
    </>
  );
};
```

### Styling Organization and Responsive Design Approach

**Material-UI Theme Configuration:**
```typescript
// Custom theme extending Material-UI
export const theme = createTheme({
  palette: {
    mode: 'light', // Could be dynamic based on user preference
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
    },
    success: {
      main: '#2e7d32',
      light: '#4caf50',
      dark: '#1b5e20',
    },
    warning: {
      main: '#ed6c02',
      light: '#ff9800',
      dark: '#e65100',
    },
    error: {
      main: '#d32f2f',
      light: '#ef5350',
      dark: '#c62828',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h6: {
      fontWeight: 600,
    },
    body1: {
      fontSize: '0.875rem',
    },
    body2: {
      fontSize: '0.75rem',
    },
  },
  spacing: 8,
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          transition: 'box-shadow 0.3s ease',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
  },
});
```

**Responsive Design Patterns:**
```typescript
// Responsive component layout utility
export const useResponsiveLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    columns: isMobile ? 1 : isTablet ? 2 : 3,
    spacing: isMobile ? 2 : 3,
    cardHeight: isMobile ? 'auto' : 240,
  };
};

// Responsive job grid layout
export const JobGrid: React.FC<JobGridProps> = ({ jobs, renderJob }) => {
  const { columns, spacing } = useResponsiveLayout();
  
  return (
    <Grid container spacing={spacing}>
      {jobs.map((job, index) => (
        <Grid key={job.job_id} item xs={12} md={6} lg={4}>
          {renderJob(job, index)}
        </Grid>
      ))}
    </Grid>
  );
};

// Responsive table/card switching
export const JobHistoryDisplay: React.FC<JobHistoryDisplayProps> = ({ jobs }) => {
  const { isMobile } = useResponsiveLayout();
  
  if (isMobile) {
    // Card layout for mobile
    return (
      <Stack spacing={2}>
        {jobs.map(job => (
          <JobHistoryCard key={job.job_id} job={job} />
        ))}
      </Stack>
    );
  }
  
  // Table layout for desktop
  return (
    <TableContainer component={Paper}>
      <Table>
        <JobHistoryTableHeader />
        <TableBody>
          {jobs.map(job => (
            <JobHistoryTableRow key={job.job_id} job={job} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
```

## Business Logic Implementation Hints

### Core Algorithm Approach and Processing Patterns

**Smart Polling Algorithm:**
```typescript
// Intelligent polling service with adaptive intervals
export class SmartPollingService {
  private pollingIntervals = new Map<string, NodeJS.Timeout>();
  private pollingStrategies = {
    queued: { interval: 2000, maxRetries: 30 },      // 2s for 1 minute
    processing: { interval: 1000, maxRetries: 300 }, // 1s for 5 minutes
    completed: { interval: 0, maxRetries: 0 },       // Stop polling
    failed: { interval: 0, maxRetries: 0 },          // Stop polling
    cancelled: { interval: 0, maxRetries: 0 },       // Stop polling
  };
  
  constructor(
    private dispatch: AppDispatch,
    private getJobStatus: (jobId: string) => Promise<JobStatusResponse>
  ) {}
  
  startPolling(jobId: string, initialStatus: JobStatus = 'queued'): void {
    // Clear any existing polling for this job
    this.stopPolling(jobId);
    
    const strategy = this.pollingStrategies[initialStatus];
    if (strategy.interval === 0) return; // No polling needed
    
    let retryCount = 0;
    let currentInterval = strategy.interval;
    
    const poll = async () => {
      try {
        const jobStatus = await this.getJobStatus(jobId);
        
        // Update Redux state
        this.dispatch(updateJobStatus({ jobId, status: jobStatus }));
        
        // Determine next polling action
        const nextStrategy = this.pollingStrategies[jobStatus.status];
        
        if (nextStrategy.interval === 0) {
          // Terminal state reached - stop polling
          this.stopPolling(jobId);
          
          if (jobStatus.status === 'completed') {
            // Move to history and persist
            this.dispatch(moveJobToHistory(jobId));
            this.dispatch(persistJobHistory());
          }
          return;
        }
        
        // Update interval if status changed
        if (nextStrategy.interval !== currentInterval) {
          currentInterval = nextStrategy.interval;
          this.stopPolling(jobId);
          this.scheduleNextPoll(jobId, currentInterval, poll);
          return;
        }
        
        // Reset retry count on successful poll
        retryCount = 0;
        
      } catch (error) {
        retryCount++;
        
        // Exponential backoff on errors
        const backoffInterval = Math.min(
          currentInterval * Math.pow(2, retryCount - 1),
          30000 // Max 30 seconds
        );
        
        if (retryCount >= strategy.maxRetries) {
          // Max retries reached - mark job as failed
          this.dispatch(setJobError({
            clientJobId: jobId,
            error: `Polling failed after ${retryCount} attempts: ${error.message}`,
          }));
          this.stopPolling(jobId);
          return;
        }
        
        // Use backoff interval for next attempt
        currentInterval = backoffInterval;
      }
      
      // Schedule next poll
      this.scheduleNextPoll(jobId, currentInterval, poll);
    };
    
    // Start immediate poll
    poll();
  }
  
  private scheduleNextPoll(
    jobId: string, 
    interval: number, 
    pollFn: () => Promise<void>
  ): void {
    const timeoutId = setTimeout(pollFn, interval);
    this.pollingIntervals.set(jobId, timeoutId);
  }
  
  stopPolling(jobId: string): void {
    const timeoutId = this.pollingIntervals.get(jobId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.pollingIntervals.delete(jobId);
    }
  }
  
  stopAllPolling(): void {
    for (const [jobId] of this.pollingIntervals) {
      this.stopPolling(jobId);
    }
  }
  
  // Pause polling when page is not visible to save resources
  pauseAllPolling(): void {
    // Store current intervals
    const currentPolling = new Map(this.pollingIntervals);
    this.stopAllPolling();
    
    // Store for resume
    this.pausedPolling = currentPolling;
  }
  
  resumeAllPolling(): void {
    // Restart polling for all jobs that were paused
    for (const [jobId] of this.pausedPolling || new Map()) {
      // Get current job status to determine appropriate polling
      const job = store.getState().analysis.activeJobs[jobId];
      if (job) {
        this.startPolling(jobId, job.status);
      }
    }
    
    this.pausedPolling = null;
  }
  
  private pausedPolling: Map<string, NodeJS.Timeout> | null = null;
}
```

### Data Transformation Strategies and Validation Patterns

**Job Data Transformation Pipeline:**
```typescript
// Data transformation utilities for consistent job handling
export class JobDataTransformer {
  // Transform API response to internal job format
  static transformApiJobToInternal(apiJob: any): JobStatus {
    return {
      job_id: apiJob.job_id,
      client_job_id: apiJob.client_job_id || generateUUID(),
      status: this.normalizeJobStatus(apiJob.status),
      progress: this.normalizeProgress(apiJob.progress),
      submitted_at: this.normalizeTimestamp(apiJob.submitted_at),
      completed_at: apiJob.completed_at ? this.normalizeTimestamp(apiJob.completed_at) : undefined,
      last_updated: this.normalizeTimestamp(apiJob.updated_at || new Date().toISOString()),
      polling_active: this.shouldPollStatus(apiJob.status),
      
      file_name: apiJob.file_info?.name || 'unknown',
      file_size: Math.max(0, apiJob.file_info?.size || 0),
      
      analysis_depth: this.normalizeAnalysisDepth(apiJob.configuration?.analysis_depth),
      llm_provider: apiJob.configuration?.llm_provider || undefined,
      llm_model: apiJob.configuration?.llm_model || undefined,
      translation_detail: this.normalizeTranslationDetail(apiJob.configuration?.translation_detail),
      
      results: apiJob.results ? this.transformJobResults(apiJob.results) : undefined,
      error_message: apiJob.error_message || undefined,
    };
  }
  
  // Transform internal job format for storage
  static transformInternalJobForStorage(job: JobStatus): StoredJobRecord {
    return {
      job_id: job.job_id,
      client_job_id: job.client_job_id,
      status: job.status,
      submitted_at: job.submitted_at,
      completed_at: job.completed_at,
      last_updated: job.last_updated,
      
      file_info: {
        name: job.file_name,
        size: job.file_size,
        type: this.inferFileType(job.file_name),
        hash: undefined, // Could be added for duplicate detection
      },
      
      configuration: {
        analysis_depth: job.analysis_depth,
        llm_provider: job.llm_provider,
        llm_model: job.llm_model,
        translation_detail: job.translation_detail,
      },
      
      results_summary: job.results ? {
        function_count: job.results.function_count,
        import_count: job.results.import_count,
        string_count: job.results.string_count,
        has_llm_translations: Boolean(job.results.llm_translations?.length),
        processing_time_ms: this.calculateProcessingTime(job.submitted_at, job.completed_at),
      } : undefined,
      
      error_info: job.error_message ? {
        error_type: this.classifyErrorType(job.error_message),
        error_message: job.error_message,
        retry_count: 0, // This would be tracked separately
      } : undefined,
      
      metadata: {
        tags: [],
        starred: false,
        archived: false,
      },
    };
  }
  
  // Normalize job status to ensure consistency
  private static normalizeJobStatus(status: string): JobStatus {
    const statusMap: Record<string, JobStatus> = {
      'queued': 'queued',
      'pending': 'queued',
      'waiting': 'queued',
      'processing': 'processing',
      'running': 'processing',
      'in_progress': 'processing',
      'completed': 'completed',
      'finished': 'completed',
      'done': 'completed',
      'failed': 'failed',
      'error': 'failed',
      'cancelled': 'cancelled',
      'canceled': 'cancelled',
      'aborted': 'cancelled',
    };
    
    return statusMap[status?.toLowerCase()] || 'queued';
  }
  
  // Normalize progress to 0-100 range
  private static normalizeProgress(progress: any): number {
    const numProgress = Number(progress);
    if (isNaN(numProgress)) return 0;
    return Math.max(0, Math.min(100, numProgress));
  }
  
  // Normalize timestamp to ISO format
  private static normalizeTimestamp(timestamp: any): string {
    if (!timestamp) return new Date().toISOString();
    
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return new Date().toISOString();
      }
      return date.toISOString();
    } catch {
      return new Date().toISOString();
    }
  }
  
  // Determine if status should trigger polling
  private static shouldPollStatus(status: string): boolean {
    const normalizedStatus = this.normalizeJobStatus(status);
    return ['queued', 'processing'].includes(normalizedStatus);
  }
  
  // Other normalization methods...
  private static normalizeAnalysisDepth(depth: any): AnalysisDepth {
    const validDepths = ['basic', 'standard', 'detailed'];
    return validDepths.includes(depth) ? depth : 'standard';
  }
  
  private static normalizeTranslationDetail(detail: any): TranslationDetail {
    const validDetails = ['basic', 'detailed'];
    return validDetails.includes(detail) ? detail : 'basic';
  }
  
  private static transformJobResults(results: any): JobResults {
    return {
      function_count: Math.max(0, results.function_count || 0),
      import_count: Math.max(0, results.import_count || 0),
      string_count: Math.max(0, results.string_count || 0),
      llm_translations: Array.isArray(results.llm_translations) 
        ? results.llm_translations.map(this.transformLLMTranslation)
        : [],
    };
  }
  
  private static transformLLMTranslation(translation: any): LLMTranslation {
    return {
      function_name: translation.function_name || 'unknown',
      original_code: translation.original_code || '',
      translated_code: translation.translated_code || '',
      confidence: Math.max(0, Math.min(1, translation.confidence || 0)),
    };
  }
  
  private static calculateProcessingTime(submitted: string, completed?: string): number {
    if (!completed) return 0;
    
    const submittedTime = new Date(submitted).getTime();
    const completedTime = new Date(completed).getTime();
    
    return Math.max(0, completedTime - submittedTime);
  }
  
  private static inferFileType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    const typeMap: Record<string, string> = {
      'exe': 'executable',
      'dll': 'library',
      'so': 'library',
      'dylib': 'library',
      'elf': 'executable',
      'jar': 'java-archive',
      'war': 'java-archive',
      'class': 'java-class',
    };
    
    return typeMap[extension || ''] || 'unknown';
  }
  
  private static classifyErrorType(errorMessage: string): string {
    const message = errorMessage.toLowerCase();
    
    if (message.includes('network') || message.includes('connection')) {
      return 'network_error';
    }
    if (message.includes('timeout')) {
      return 'timeout_error';
    }
    if (message.includes('file') || message.includes('upload')) {
      return 'file_error';
    }
    if (message.includes('provider') || message.includes('llm')) {
      return 'provider_error';
    }
    if (message.includes('validation')) {
      return 'validation_error';
    }
    
    return 'unknown_error';
  }
}
```

### External Service Integration Patterns

**LLM Provider Integration:**
```typescript
// Provider integration service
export class ProviderIntegrationService {
  private healthCheckCache = new Map<string, {
    status: ProviderHealthStatus;
    timestamp: number;
    ttl: number;
  }>();
  
  constructor(private apiClient: typeof providersApi) {}
  
  // Provider discovery with caching
  async discoverProviders(): Promise<LLMProviderInfo[]> {
    try {
      const response = await this.apiClient.endpoints.listLLMProviders.initiate().unwrap();
      
      // Transform and validate provider data
      return response.map(this.transformProviderInfo).filter(this.validateProviderInfo);
    } catch (error) {
      console.error('Provider discovery failed:', error);
      return this.getFallbackProviders();
    }
  }
  
  // Health check with intelligent caching
  async checkProviderHealth(
    providerId: string, 
    apiKey: string,
    forceRefresh = false
  ): Promise<ProviderHealthStatus> {
    const cacheKey = `${providerId}:${this.hashApiKey(apiKey)}`;
    const cached = this.healthCheckCache.get(cacheKey);
    
    // Use cache if available and not expired
    if (!forceRefresh && cached && (Date.now() - cached.timestamp) < cached.ttl) {
      return cached.status;
    }
    
    try {
      const response = await this.apiClient.endpoints.checkProviderHealth
        .initiate({ providerId, apiKey })
        .unwrap();
      
      const healthStatus: ProviderHealthStatus = {
        provider_id: providerId,
        is_healthy: response.is_healthy || false,
        response_time_ms: response.response_time_ms || 0,
        error_message: response.error_message,
        last_checked: new Date().toISOString(),
        capabilities: response.capabilities || {},
      };
      
      // Cache result with appropriate TTL
      const ttl = healthStatus.is_healthy ? 5 * 60 * 1000 : 30 * 1000; // 5 min success, 30s failure
      this.healthCheckCache.set(cacheKey, {
        status: healthStatus,
        timestamp: Date.now(),
        ttl,
      });
      
      return healthStatus;
      
    } catch (error) {
      const errorStatus: ProviderHealthStatus = {
        provider_id: providerId,
        is_healthy: false,
        response_time_ms: 0,
        error_message: error.message || 'Health check failed',
        last_checked: new Date().toISOString(),
        capabilities: {},
      };
      
      // Cache error with short TTL
      this.healthCheckCache.set(cacheKey, {
        status: errorStatus,
        timestamp: Date.now(),
        ttl: 30 * 1000, // 30 seconds
      });
      
      return errorStatus;
    }
  }
  
  // Cost estimation for provider usage
  calculateEstimatedCost(
    provider: LLMProviderInfo,
    fileSize: number,
    analysisDepth: AnalysisDepth,
    translationDetail: TranslationDetail
  ): CostEstimation {
    // Base token estimation based on file size and analysis depth
    const baseTokens = this.estimateTokensFromFileSize(fileSize);
    const depthMultiplier = {
      basic: 1.0,
      standard: 1.5,
      detailed: 2.5,
    }[analysisDepth];
    
    const detailMultiplier = {
      basic: 1.0,
      detailed: 2.0,
    }[translationDetail];
    
    const estimatedInputTokens = Math.ceil(baseTokens * depthMultiplier);
    const estimatedOutputTokens = Math.ceil(baseTokens * detailMultiplier * 0.3); // Assume 30% output ratio
    
    const inputCost = estimatedInputTokens * provider.pricing_info.input_cost_per_token;
    const outputCost = estimatedOutputTokens * provider.pricing_info.output_cost_per_token;
    const totalCost = inputCost + outputCost;
    
    return {
      provider_id: provider.id,
      estimated_input_tokens: estimatedInputTokens,
      estimated_output_tokens: estimatedOutputTokens,
      estimated_input_cost: inputCost,
      estimated_output_cost: outputCost,
      estimated_total_cost: totalCost,
      currency: provider.pricing_info.currency,
      estimation_accuracy: 'approximate', // Could be 'accurate', 'approximate', 'rough'
    };
  }
  
  private transformProviderInfo(rawProvider: any): LLMProviderInfo {
    return {
      id: rawProvider.id,
      name: rawProvider.name || 'Unknown Provider',
      description: rawProvider.description || '',
      supported_models: Array.isArray(rawProvider.supported_models) 
        ? rawProvider.supported_models 
        : [],
      pricing_info: {
        input_cost_per_token: rawProvider.pricing_info?.input_cost_per_token || 0,
        output_cost_per_token: rawProvider.pricing_info?.output_cost_per_token || 0,
        currency: rawProvider.pricing_info?.currency || 'USD',
      },
      capabilities: {
        supports_code_analysis: rawProvider.capabilities?.supports_code_analysis ?? true,
        max_context_length: rawProvider.capabilities?.max_context_length || 4000,
        average_response_time_ms: rawProvider.capabilities?.average_response_time_ms || 5000,
      },
    };
  }
  
  private validateProviderInfo(provider: LLMProviderInfo): boolean {
    return Boolean(
      provider.id &&
      provider.name &&
      provider.supported_models.length > 0 &&
      provider.pricing_info.input_cost_per_token >= 0 &&
      provider.pricing_info.output_cost_per_token >= 0
    );
  }
  
  private getFallbackProviders(): LLMProviderInfo[] {
    // Return hardcoded fallback providers if API fails
    return [
      {
        id: 'openai',
        name: 'OpenAI',
        description: 'OpenAI GPT models for code analysis',
        supported_models: ['gpt-4', 'gpt-3.5-turbo'],
        pricing_info: {
          input_cost_per_token: 0.00003,
          output_cost_per_token: 0.00006,
          currency: 'USD',
        },
        capabilities: {
          supports_code_analysis: true,
          max_context_length: 8192,
          average_response_time_ms: 3000,
        },
      },
    ];
  }
  
  private estimateTokensFromFileSize(fileSizeBytes: number): number {
    // Rough estimation: 1 token ≈ 4 characters, binary analysis might expand content
    const expansionFactor = 3; // Binary → text expansion
    const avgCharsPerToken = 4;
    
    return Math.ceil((fileSizeBytes * expansionFactor) / avgCharsPerToken);
  }
  
  private hashApiKey(apiKey: string): string {
    // Simple hash for cache key (not cryptographically secure)
    let hash = 0;
    for (let i = 0; i < apiKey.length; i++) {
      const char = apiKey.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }
}

interface CostEstimation {
  provider_id: string;
  estimated_input_tokens: number;
  estimated_output_tokens: number;
  estimated_input_cost: number;
  estimated_output_cost: number;
  estimated_total_cost: number;
  currency: string;
  estimation_accuracy: 'accurate' | 'approximate' | 'rough';
}

interface ProviderHealthStatus {
  provider_id: string;
  is_healthy: boolean;
  response_time_ms: number;
  error_message?: string;
  last_checked: string;
  capabilities: Record<string, any>;
}
```

### Caching and Performance Optimization Strategies

**Intelligent Caching Layer:**
```typescript
// Multi-level caching system for performance optimization
export class AnalysisJobCache {
  private memoryCache = new Map<string, CacheEntry>();
  private readonly maxMemoryEntries = 100;
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes
  
  // Cache job status responses
  cacheJobStatus(jobId: string, status: JobStatusResponse, ttl = this.defaultTTL): void {
    // Evict oldest entries if cache is full
    if (this.memoryCache.size >= this.maxMemoryEntries) {
      this.evictOldestEntries(10);
    }
    
    this.memoryCache.set(jobId, {
      data: status,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
      lastAccessed: Date.now(),
    });
  }
  
  // Get cached job status
  getCachedJobStatus(jobId: string): JobStatusResponse | null {
    const entry = this.memoryCache.get(jobId);
    
    if (!entry) return null;
    
    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.memoryCache.delete(jobId);
      return null;
    }
    
    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    
    return entry.data as JobStatusResponse;
  }
  
  // Invalidate cache entry
  invalidateJobStatus(jobId: string): void {
    this.memoryCache.delete(jobId);
  }
  
  // Batch invalidate multiple jobs
  invalidateMultipleJobs(jobIds: string[]): void {
    jobIds.forEach(jobId => this.invalidateJobStatus(jobId));
  }
  
  // Smart cache warming for frequently accessed jobs
  warmCache(jobIds: string[]): void {
    // Prioritize jobs that are likely to be accessed soon
    const sortedJobIds = jobIds.sort((a, b) => {
      const aEntry = this.memoryCache.get(a);
      const bEntry = this.memoryCache.get(b);
      
      if (!aEntry && !bEntry) return 0;
      if (!aEntry) return 1;
      if (!bEntry) return -1;
      
      return bEntry.accessCount - aEntry.accessCount;
    });
    
    // Warm cache for top jobs
    sortedJobIds.slice(0, 20).forEach(async (jobId) => {
      if (!this.getCachedJobStatus(jobId)) {
        try {
          // Fetch and cache job status
          const status = await analysisApi.endpoints.getJobStatus.initiate(jobId).unwrap();
          this.cacheJobStatus(jobId, status);
        } catch (error) {
          console.warn(`Cache warming failed for job ${jobId}:`, error);
        }
      }
    });
  }
  
  // Clean expired entries
  cleanExpiredEntries(): number {
    const now = Date.now();
    let removedCount = 0;
    
    for (const [key, entry] of this.memoryCache) {
      if (now - entry.timestamp > entry.ttl) {
        this.memoryCache.delete(key);
        removedCount++;
      }
    }
    
    return removedCount;
  }
  
  // Evict oldest entries based on LRU policy
  private evictOldestEntries(count: number): void {
    const entries = Array.from(this.memoryCache.entries());
    
    // Sort by last accessed time (oldest first)
    entries.sort(([,a], [,b]) => a.lastAccessed - b.lastAccessed);
    
    // Remove oldest entries
    for (let i = 0; i < count && i < entries.length; i++) {
      this.memoryCache.delete(entries[i][0]);
    }
  }
  
  // Get cache statistics
  getCacheStats(): CacheStats {
    const now = Date.now();
    let expiredCount = 0;
    let totalAccessCount = 0;
    
    for (const entry of this.memoryCache.values()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredCount++;
      }
      totalAccessCount += entry.accessCount;
    }
    
    return {
      totalEntries: this.memoryCache.size,
      expiredEntries: expiredCount,
      hitRate: totalAccessCount > 0 ? totalAccessCount / this.memoryCache.size : 0,
      memoryUsage: this.estimateMemoryUsage(),
    };
  }
  
  private estimateMemoryUsage(): number {
    // Rough estimate of memory usage in bytes
    let totalSize = 0;
    
    for (const [key, entry] of this.memoryCache) {
      totalSize += key.length * 2; // String character size
      totalSize += JSON.stringify(entry.data).length * 2;
      totalSize += 64; // Overhead for timestamps, counts, etc.
    }
    
    return totalSize;
  }
}

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheStats {
  totalEntries: number;
  expiredEntries: number;
  hitRate: number;
  memoryUsage: number;
}

// Background cache maintenance service
export class CacheMaintenanceService {
  private maintenanceInterval: NodeJS.Timeout | null = null;
  
  constructor(private cache: AnalysisJobCache) {}
  
  startMaintenance(intervalMs = 60000): void { // 1 minute default
    if (this.maintenanceInterval) {
      clearInterval(this.maintenanceInterval);
    }
    
    this.maintenanceInterval = setInterval(() => {
      this.performMaintenance();
    }, intervalMs);
  }
  
  stopMaintenance(): void {
    if (this.maintenanceInterval) {
      clearInterval(this.maintenanceInterval);
      this.maintenanceInterval = null;
    }
  }
  
  private performMaintenance(): void {
    // Clean expired entries
    const removedCount = this.cache.cleanExpiredEntries();
    
    // Get cache statistics
    const stats = this.cache.getCacheStats();
    
    // Log maintenance info (in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('Cache maintenance completed:', {
        removedExpired: removedCount,
        stats,
      });
    }
    
    // Warm cache for active jobs
    const activeJobIds = store.getState().analysis.activeJobs;
    this.cache.warmCache(Object.keys(activeJobIds));
  }
}
```

## Testing Implementation Approach

### Test Organization Patterns and Coverage Strategy

**Testing Architecture:**
```typescript
// Jest configuration for domain-based testing
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@analysis/(.*)$': '<rootDir>/src/analysis/$1',
    '^@providers/(.*)$': '<rootDir>/src/providers/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/test/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/analysis/services/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './src/analysis/hooks/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{ts,tsx}',
  ],
};

// Test setup file
// src/test/setup.ts
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { server } from './msw/server';

// Configure Testing Library
configure({ testIdAttribute: 'data-testid' });

// Mock Service Worker setup
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock Web APIs
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
```

**Unit Testing Patterns:**
```typescript
// Redux slice testing
// src/analysis/store/analysisSlice.test.ts
describe('analysisSlice', () => {
  let store: EnhancedStore;
  
  beforeEach(() => {
    store = createTestStore();
  });
  
  describe('Job Management Actions', () => {
    it('should add active job with correct initial state', () => {
      const jobData = createMockJobSubmission();
      
      store.dispatch(addActiveJob(jobData));
      const state = store.getState().analysis;
      
      expect(state.activeJobs[jobData.clientJobId]).toEqual(
        expect.objectContaining({
          client_job_id: jobData.clientJobId,
          status: 'queued',
          progress: 0,
          polling_active: true,
          file_name: jobData.fileName,
          file_size: jobData.fileSize,
        })
      );
    });
    
    it('should update job status correctly', () => {
      const initialJob = createMockJobStatus({ status: 'queued', progress: 0 });
      const updatedStatus = createMockJobStatus({ status: 'processing', progress: 25 });
      
      store.dispatch(addActiveJob(initialJob));
      store.dispatch(updateJobStatus({ jobId: initialJob.job_id, status: updatedStatus }));
      
      const state = store.getState().analysis;
      const job = Object.values(state.activeJobs)[0];
      
      expect(job.status).toBe('processing');
      expect(job.progress).toBe(25);
      expect(job.polling_active).toBe(true);
    });
    
    it('should move completed job to history', () => {
      const completedJob = createMockJobStatus({ status: 'completed', progress: 100 });
      
      store.dispatch(addActiveJob(completedJob));
      store.dispatch(moveJobToHistory(completedJob.job_id));
      
      const state = store.getState().analysis;
      
      expect(state.activeJobs[completedJob.client_job_id]).toBeUndefined();
      expect(state.jobHistory).toHaveLength(1);
      expect(state.jobHistory[0].job_id).toBe(completedJob.job_id);
      expect(state.jobHistory[0].polling_active).toBe(false);
    });
    
    it('should handle job history size limit', () => {
      const jobs = Array.from({ length: 105 }, (_, i) => 
        createMockJobStatus({ job_id: `job-${i}` })
      );
      
      jobs.forEach(job => {
        store.dispatch(addActiveJob(job));
        store.dispatch(moveJobToHistory(job.job_id));
      });
      
      const state = store.getState().analysis;
      
      expect(state.jobHistory).toHaveLength(50); // Should be trimmed to 50
      expect(state.jobHistory[0].job_id).toBe('job-104'); // Most recent first
    });
  });
  
  describe('Credential Management', () => {
    beforeEach(() => {
      // Clear session storage before each test
      sessionStorage.clear();
    });
    
    it('should store provider credential securely', () => {
      const credentialData = {
        providerId: 'openai',
        apiKey: 'test-api-key',
      };
      
      store.dispatch(storeProviderCredential(credentialData));
      
      const state = store.getState().analysis;
      expect(state.userCredentials['openai']).toBe('test-api-key');
      
      // Check session storage
      const stored = JSON.parse(sessionStorage.getItem('bin2nlp_credentials') || '{}');
      expect(stored.credentials['openai']).toBeDefined();
      expect(stored.credentials['openai'].provider_id).toBe('openai');
    });
    
    it('should clear all credentials', () => {
      const credentialData = {
        providerId: 'openai',
        apiKey: 'test-api-key',
      };
      
      store.dispatch(storeProviderCredential(credentialData));
      store.dispatch(clearCredentials());
      
      const state = store.getState().analysis;
      expect(state.userCredentials).toEqual({});
      expect(sessionStorage.getItem('bin2nlp_credentials')).toBeNull();
    });
  });
});

// Test utilities
// src/test/utils/mockData.ts
export const createMockJobSubmission = (overrides: Partial<JobSubmissionRequest> = {}): JobSubmissionRequest => ({
  clientJobId: generateUUID(),
  fileName: 'test.exe',
  fileSize: 1024 * 1024, // 1MB
  analysisDepth: 'standard',
  llmProvider: 'openai',
  ...overrides,
});

export const createMockJobStatus = (overrides: Partial<JobStatus> = {}): JobStatus => ({
  job_id: generateUUID(),
  client_job_id: generateUUID(),
  status: 'queued',
  progress: 0,
  submitted_at: new Date().toISOString(),
  last_updated: new Date().toISOString(),
  polling_active: true,
  file_name: 'test.exe',
  file_size: 1024 * 1024,
  analysis_depth: 'standard',
  ...overrides,
});

export const createTestStore = (preloadedState?: Partial<RootState>) => {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
      }),
  });
};
```

### Test Data Management and Isolation Patterns

**Mock Service Worker Integration:**
```typescript
// MSW server setup for API mocking
// src/test/msw/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);

// API handlers for job management
// src/test/msw/handlers.ts
import { rest } from 'msw';
import { JobStatusResponse, JobSubmissionResponse } from '@analysis/types';

// In-memory job storage for testing
const jobsStore = new Map<string, JobStatusResponse>();
let jobIdCounter = 1;

export const handlers = [
  // Job submission endpoint
  rest.post('/api/v1/decompile', async (req, res, ctx) => {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const analysisDepth = formData.get('analysis_depth') as string;
    const llmProvider = formData.get('llm_provider') as string;
    
    // Validation
    if (!file) {
      return res(
        ctx.status(400),
        ctx.json({ error: 'File is required' })
      );
    }
    
    if (file.size > 100 * 1024 * 1024) {
      return res(
        ctx.status(413),
        ctx.json({ error: 'File too large' })
      );
    }
    
    // Create job
    const jobId = `job-${jobIdCounter++}`;
    const job: JobStatusResponse = {
      job_id: jobId,
      status: 'queued',
      progress: 0,
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      file_info: {
        name: file.name,
        size: file.size,
        format: 'executable',
      },
      configuration: {
        analysis_depth: analysisDepth as AnalysisDepth,
        llm_provider: llmProvider || undefined,
      },
    };
    
    jobsStore.set(jobId, job);
    
    // Simulate job processing
    setTimeout(() => {
      const storedJob = jobsStore.get(jobId);
      if (storedJob) {
        storedJob.status = 'processing';
        storedJob.progress = 10;
        storedJob.updated_at = new Date().toISOString();
        
        // Complete job after another delay
        setTimeout(() => {
          storedJob.status = 'completed';
          storedJob.progress = 100;
          storedJob.completed_at = new Date().toISOString();
          storedJob.updated_at = new Date().toISOString();
          storedJob.results = {
            function_count: 42,
            import_count: 15,
            string_count: 128,
            llm_translations: [],
          };
        }, 2000);
      }
    }, 1000);
    
    const response: JobSubmissionResponse = {
      job_id: jobId,
      status: 'queued',
      submitted_at: job.submitted_at,
      estimated_completion_minutes: 5,
    };
    
    return res(ctx.json(response));
  }),
  
  // Job status endpoint
  rest.get('/api/v1/decompile/:jobId', (req, res, ctx) => {
    const { jobId } = req.params;
    const job = jobsStore.get(jobId as string);
    
    if (!job) {
      return res(
        ctx.status(404),
        ctx.json({ error: 'Job not found' })
      );
    }
    
    return res(ctx.json(job));
  }),
  
  // Job cancellation endpoint
  rest.delete('/api/v1/decompile/:jobId', (req, res, ctx) => {
    const { jobId } = req.params;
    const job = jobsStore.get(jobId as string);
    
    if (!job) {
      return res(
        ctx.status(404),
        ctx.json({ error: 'Job not found' })
      );
    }
    
    // Update job status to cancelled
    job.status = 'cancelled';
    job.updated_at = new Date().toISOString();
    
    return res(ctx.status(204));
  }),
  
  // Provider endpoints
  rest.get('/api/v1/llm-providers', (req, res, ctx) => {
    const providers: LLMProviderInfo[] = [
      {
        id: 'openai',
        name: 'OpenAI',
        description: 'OpenAI GPT models',
        supported_models: ['gpt-4', 'gpt-3.5-turbo'],
        pricing_info: {
          input_cost_per_token: 0.00003,
          output_cost_per_token: 0.00006,
          currency: 'USD',
        },
        capabilities: {
          supports_code_analysis: true,
          max_context_length: 8192,
          average_response_time_ms: 3000,
        },
      },
    ];
    
    return res(ctx.json(providers));
  }),
  
  // Error simulation handlers
  rest.post('/api/v1/decompile-error', (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json({ error: 'Internal server error' })
    );
  }),
  
  // Slow response handler for timeout testing
  rest.post('/api/v1/decompile-slow', (req, res, ctx) => {
    return res(
      ctx.delay(35000), // 35 second delay
      ctx.json({ job_id: 'timeout-job' })
    );
  }),
];

// Test-specific handler overrides
export const createJobErrorHandler = (errorCode: number, errorMessage: string) =>
  rest.post('/api/v1/decompile', (req, res, ctx) =>
    res(ctx.status(errorCode), ctx.json({ error: errorMessage }))
  );

export const createJobWithStatusHandler = (jobId: string, status: JobStatus) =>
  rest.get(`/api/v1/decompile/${jobId}`, (req, res, ctx) =>
    res(ctx.json(createMockJobStatus({ job_id: jobId, status })))
  );
```

### Mock and Stub Strategies and Dependency Injection

**Component Testing with Mocks:**
```typescript
// Component testing example
// src/analysis/components/JobSubmissionPanel/JobSubmissionPanel.test.tsx
describe('JobSubmissionPanel', () => {
  const mockOnSubmit = jest.fn();
  const mockOnError = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  const renderJobSubmissionPanel = (props: Partial<JobSubmissionPanelProps> = {}) => {
    const defaultProps: JobSubmissionPanelProps = {
      onSubmit: mockOnSubmit,
      onError: mockOnError,
      isSubmitting: false,
      ...props,
    };
    
    return render(
      <Provider store={createTestStore()}>
        <ThemeProvider theme={theme}>
          <JobSubmissionPanel {...defaultProps} />
        </ThemeProvider>
      </Provider>
    );
  };
  
  describe('File Upload', () => {
    it('should accept valid file upload', async () => {
      const validFile = createMockFile('test.exe', 1024 * 1024); // 1MB
      
      renderJobSubmissionPanel();
      
      const fileInput = screen.getByLabelText(/upload file/i);
      fireEvent.change(fileInput, { target: { files: [validFile] } });
      
      await waitFor(() => {
        expect(screen.getByText('test.exe')).toBeInTheDocument();
      });
      
      // Should not show error
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    });
    
    it('should reject oversized file', async () => {
      const oversizedFile = createMockFile('huge.exe', 200 * 1024 * 1024); // 200MB
      
      renderJobSubmissionPanel();
      
      const fileInput = screen.getByLabelText(/upload file/i);
      fireEvent.change(fileInput, { target: { files: [oversizedFile] } });
      
      await waitFor(() => {
        expect(screen.getByText(/file too large/i)).toBeInTheDocument();
      });
      
      // Submit button should be disabled
      const submitButton = screen.getByRole('button', { name: /submit/i });
      expect(submitButton).toBeDisabled();
    });
    
    it('should handle drag and drop', async () => {
      const validFile = createMockFile('dropped.exe', 1024);
      
      renderJobSubmissionPanel();
      
      const dropZone = screen.getByTestId('file-drop-zone');
      
      fireEvent.dragOver(dropZone);
      fireEvent.drop(dropZone, {
        dataTransfer: { files: [validFile] },
      });
      
      await waitFor(() => {
        expect(screen.getByText('dropped.exe')).toBeInTheDocument();
      });
    });
  });
  
  describe('Form Submission', () => {
    it('should submit form with correct data', async () => {
      const validFile = createMockFile('test.exe', 1024);
      
      renderJobSubmissionPanel();
      
      // Upload file
      const fileInput = screen.getByLabelText(/upload file/i);
      fireEvent.change(fileInput, { target: { files: [validFile] } });
      
      // Select analysis depth
      const depthSelect = screen.getByLabelText(/analysis depth/i);
      fireEvent.change(depthSelect, { target: { value: 'detailed' } });
      
      // Select LLM provider
      const providerSelect = screen.getByLabelText(/llm provider/i);
      fireEvent.change(providerSelect, { target: { value: 'openai' } });
      
      // Enter API key
      const apiKeyInput = screen.getByLabelText(/api key/i);
      fireEvent.change(apiKeyInput, { target: { value: 'test-key' } });
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          file: validFile,
          analysisDepth: 'detailed',
          llmProvider: 'openai',
          llmApiKey: 'test-key',
          llmModel: '',
          translationDetail: 'basic',
        });
      });
    });
    
    it('should show loading state during submission', async () => {
      renderJobSubmissionPanel({ isSubmitting: true });
      
      const submitButton = screen.getByRole('button', { name: /submitting/i });
      expect(submitButton).toBeDisabled();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
    
    it('should handle submission error', async () => {
      const errorMessage = 'Network error';
      mockOnSubmit.mockRejectedValueOnce(new Error(errorMessage));
      
      const validFile = createMockFile('test.exe', 1024);
      
      renderJobSubmissionPanel();
      
      // Upload file and submit
      const fileInput = screen.getByLabelText(/upload file/i);
      fireEvent.change(fileInput, { target: { files: [validFile] } });
      
      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });
  });
  
  describe('Provider Integration', () => {
    it('should load and display available providers', async () => {
      // Mock provider API response
      server.use(
        rest.get('/api/v1/llm-providers', (req, res, ctx) =>
          res(ctx.json([
            { id: 'openai', name: 'OpenAI' },
            { id: 'anthropic', name: 'Anthropic' },
          ]))
        )
      );
      
      renderJobSubmissionPanel();
      
      await waitFor(() => {
        expect(screen.getByText('OpenAI')).toBeInTheDocument();
        expect(screen.getByText('Anthropic')).toBeInTheDocument();
      });
    });
    
    it('should handle provider loading error', async () => {
      // Mock provider API error
      server.use(
        rest.get('/api/v1/llm-providers', (req, res, ctx) =>
          res(ctx.status(500), ctx.json({ error: 'Server error' }))
        )
      );
      
      renderJobSubmissionPanel();
      
      await waitFor(() => {
        expect(screen.getByText(/failed to load providers/i)).toBeInTheDocument();
      });
    });
  });
});

// Mock file creation utility
const createMockFile = (name: string, size: number, type = 'application/octet-stream'): File => {
  const file = new File([''], name, { type });
  
  // Mock the size property
  Object.defineProperty(file, 'size', {
    value: size,
    writable: false,
  });
  
  return file;
};
```

### Assertion Patterns and Verification Approaches

**Integration Testing Patterns:**
```typescript
// Integration test for complete job workflow
// src/analysis/integration/jobWorkflow.test.ts
describe('Job Workflow Integration', () => {
  let store: EnhancedStore;
  
  beforeEach(() => {
    store = createTestStore();
    server.resetHandlers();
  });
  
  it('should complete full job submission to completion workflow', async () => {
    const mockFile = createMockFile('integration-test.exe', 2048);
    
    // Render the complete job management system
    render(
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <AnalysisJobManager />
        </ThemeProvider>
      </Provider>
    );
    
    // Step 1: Submit job
    const fileInput = screen.getByLabelText(/upload file/i);
    fireEvent.change(fileInput, { target: { files: [mockFile] } });
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);
    
    // Verify job submission
    await waitFor(() => {
      expect(screen.getByText(/job submitted/i)).toBeInTheDocument();
    });
    
    // Step 2: Verify job appears in active jobs
    await waitFor(() => {
      expect(screen.getByText('integration-test.exe')).toBeInTheDocument();
      expect(screen.getByText('queued', { exact: false })).toBeInTheDocument();
    });
    
    // Step 3: Wait for job to start processing
    await waitFor(() => {
      expect(screen.getByText('processing', { exact: false })).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Step 4: Wait for job completion
    await waitFor(() => {
      expect(screen.getByText('completed', { exact: false })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /view results/i })).toBeInTheDocument();
    }, { timeout: 5000 });
    
    // Step 5: Verify job moved to history
    const historyTab = screen.getByRole('tab', { name: /history/i });
    fireEvent.click(historyTab);
    
    await waitFor(() => {
      expect(screen.getByText('integration-test.exe')).toBeInTheDocument();
    });
    
    // Step 6: Verify Redux state
    const finalState = store.getState();
    expect(Object.keys(finalState.analysis.activeJobs)).toHaveLength(0);
    expect(finalState.analysis.jobHistory).toHaveLength(1);
    expect(finalState.analysis.jobHistory[0].status).toBe('completed');
  });
  
  it('should handle job cancellation workflow', async () => {
    const mockFile = createMockFile('cancel-test.exe', 1024);
    
    // Mock long-running job
    server.use(
      rest.post('/api/v1/decompile', (req, res, ctx) => {
        const jobId = 'long-running-job';
        jobsStore.set(jobId, {
          job_id: jobId,
          status: 'processing',
          progress: 25,
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          file_info: { name: 'cancel-test.exe', size: 1024, format: 'executable' },
          configuration: { analysis_depth: 'standard' },
        });
        
        return res(ctx.json({ job_id: jobId, status: 'queued' }));
      })
    );
    
    render(
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <AnalysisJobManager />
        </ThemeProvider>
      </Provider>
    );
    
    // Submit job
    const fileInput = screen.getByLabelText(/upload file/i);
    fireEvent.change(fileInput, { target: { files: [mockFile] } });
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);
    
    // Wait for job to appear as processing
    await waitFor(() => {
      expect(screen.getByText('processing', { exact: false })).toBeInTheDocument();
    });
    
    // Cancel the job
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    
    // Confirm cancellation
    const confirmButton = screen.getByRole('button', { name: /cancel job/i });
    fireEvent.click(confirmButton);
    
    // Verify job is cancelled
    await waitFor(() => {
      expect(screen.getByText('cancelled', { exact: false })).toBeInTheDocument();
    });
    
    // Verify job moved to history
    const historyTab = screen.getByRole('tab', { name: /history/i });
    fireEvent.click(historyTab);
    
    await waitFor(() => {
      const historyJobs = screen.getAllByText('cancel-test.exe');
      expect(historyJobs.length).toBeGreaterThan(0);
    });
  });
  
  it('should handle API error scenarios gracefully', async () => {
    // Mock API error
    server.use(
      rest.post('/api/v1/decompile', (req, res, ctx) =>
        res(ctx.status(500), ctx.json({ error: 'Internal server error' }))
      )
    );
    
    render(
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <ErrorBoundary>
            <AnalysisJobManager />
          </ErrorBoundary>
        </ThemeProvider>
      </Provider>
    );
    
    const mockFile = createMockFile('error-test.exe', 1024);
    
    // Attempt job submission
    const fileInput = screen.getByLabelText(/upload file/i);
    fireEvent.change(fileInput, { target: { files: [mockFile] } });
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);
    
    // Verify error handling
    await waitFor(() => {
      expect(screen.getByText(/server temporarily unavailable/i)).toBeInTheDocument();
    });
    
    // Verify application didn't crash
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    
    // Verify Redux state shows error
    const state = store.getState();
    expect(state.analysis.submission.error).toBeTruthy();
  });
});
```

**End-to-End Testing with Playwright:**
```typescript
// E2E test for complete user journey
// tests/e2e/jobManagement.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Job Management E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');
    
    // Wait for app to load
    await page.waitForSelector('[data-testid="analysis-job-manager"]');
  });
  
  test('should complete full job workflow', async ({ page }) => {
    // Upload a test file
    await page.setInputFiles(
      'input[type="file"]',
      'tests/fixtures/test-binary.exe'
    );
    
    // Verify file is loaded
    await expect(page.getByText('test-binary.exe')).toBeVisible();
    
    // Configure analysis
    await page.selectOption('select[name="analysisDepth"]', 'standard');
    
    // Submit job
    await page.click('button:has-text("Submit Analysis Job")');
    
    // Verify success notification
    await expect(page.getByText('Job submitted successfully')).toBeVisible();
    
    // Switch to tracking tab
    await page.click('tab:has-text("Active Jobs")');
    
    // Verify job appears in active list
    await expect(page.getByText('test-binary.exe')).toBeVisible();
    await expect(page.getByText('queued')).toBeVisible();
    
    // Wait for job to start processing (with longer timeout for E2E)
    await expect(page.getByText('processing')).toBeVisible({ timeout: 10000 });
    
    // Wait for job completion
    await expect(page.getByText('completed')).toBeVisible({ timeout: 30000 });
    
    // Click view results
    await page.click('button:has-text("View Results")');
    
    // Verify navigation to results page
    await expect(page).toHaveURL(/\/results\//);
    await expect(page.getByText('Analysis Results')).toBeVisible();
  });
  
  test('should handle job cancellation', async ({ page }) => {
    // Upload and submit job
    await page.setInputFiles('input[type="file"]', 'tests/fixtures/large-binary.exe');
    await page.click('button:has-text("Submit Analysis Job")');
    
    // Switch to active jobs
    await page.click('tab:has-text("Active Jobs")');
    
    // Wait for job to appear
    await expect(page.getByText('large-binary.exe')).toBeVisible();
    
    // Cancel job
    await page.click('button:has-text("Cancel")');
    
    // Confirm cancellation
    await page.click('button:has-text("Cancel Job")');
    
    // Verify job is cancelled
    await expect(page.getByText('cancelled')).toBeVisible();
    
    // Check job history
    await page.click('tab:has-text("Job History")');
    await expect(page.getByText('large-binary.exe')).toBeVisible();
    await expect(page.getByText('cancelled')).toBeVisible();
  });
  
  test('should handle multiple concurrent jobs', async ({ page }) => {
    const testFiles = [
      'tests/fixtures/test1.exe',
      'tests/fixtures/test2.exe',
      'tests/fixtures/test3.exe',
    ];
    
    // Submit multiple jobs
    for (const file of testFiles) {
      await page.setInputFiles('input[type="file"]', file);
      await page.click('button:has-text("Submit Analysis Job")');
      await expect(page.getByText('Job submitted successfully')).toBeVisible();
      
      // Clear file input for next upload
      await page.evaluate(() => {
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      });
    }
    
    // Switch to active jobs
    await page.click('tab:has-text("Active Jobs")');
    
    // Verify all jobs are listed
    await expect(page.getByText('test1.exe')).toBeVisible();
    await expect(page.getByText('test2.exe')).toBeVisible();
    await expect(page.getByText('test3.exe')).toBeVisible();
    
    // Verify job count indicator
    await expect(page.getByText('3 active')).toBeVisible();
  });
  
  test('should persist job history across browser sessions', async ({ page, context }) => {
    // Submit and complete a job
    await page.setInputFiles('input[type="file"]', 'tests/fixtures/persist-test.exe');
    await page.click('button:has-text("Submit Analysis Job")');
    
    // Wait for completion
    await page.click('tab:has-text("Active Jobs")');
    await expect(page.getByText('completed')).toBeVisible({ timeout: 30000 });
    
    // Close and reopen page
    await page.close();
    const newPage = await context.newPage();
    await newPage.goto('http://localhost:3000');
    
    // Check job history persists
    await newPage.click('tab:has-text("Job History")');
    await expect(newPage.getByText('persist-test.exe')).toBeVisible();
    await expect(newPage.getByText('completed')).toBeVisible();
  });
});
```

This completes the comprehensive Technical Implementation Document for the Analysis Job Management System. The TID now provides detailed guidance for all aspects of implementation including file organization, component patterns, API integration, state management, business logic, and comprehensive testing strategies.

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "Create TID for Analysis Job Management System (001_FTID|file-management-system.md)", "status": "completed", "activeForm": "Creating TID for Analysis Job Management System"}, {"content": "Create TID for Analysis Configuration Interface (002_FTID|two-phase-pipeline-interface.md)", "status": "in_progress", "activeForm": "Creating TID for Analysis Configuration Interface"}, {"content": "Create TID for Results Exploration Platform (003_FTID|results-exploration-platform.md)", "status": "pending", "activeForm": "Creating TID for Results Exploration Platform"}, {"content": "Create TID for Multi-Provider LLM Integration (004_FTID|multi-provider-llm-integration.md)", "status": "pending", "activeForm": "Creating TID for Multi-Provider LLM Integration"}]