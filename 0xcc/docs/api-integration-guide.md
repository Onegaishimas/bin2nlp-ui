# Master API Integration Guide

**Date:** 2025-08-31  
**Project:** bin2nlp-frontend  
**Document Type:** Technical Documentation  
**Priority:** CRITICAL  

## Overview

This guide provides comprehensive documentation for integrating with the bin2nlp API in the frontend application. All API interactions follow a job-based architecture with REST polling for status updates and results retrieval.

**Core Architecture Principles:**
- **Job-Based Workflow:** All analysis operations use unified job submission and tracking
- **REST Polling:** Real-time updates via 1-2 second polling intervals (no WebSocket)
- **User-Managed Credentials:** Session-only storage of user-provided LLM API keys
- **Zero Backend Modifications:** Frontend works with existing API endpoints only

## Complete Endpoint Reference

### Core Analysis Endpoints

#### Submit Analysis Job
```http
POST /api/v1/decompile
Content-Type: multipart/form-data

FormData Parameters:
- file: File                           # Binary file for analysis (required)
- analysis_depth: string               # 'basic' | 'standard' | 'detailed' (required)
- llm_provider: string                 # Provider ID (optional)
- llm_api_key: string                  # User-provided API key (optional)
- llm_model: string                    # Model selection (optional)
- translation_detail: string           # 'basic' | 'detailed' (optional)
```

**Response:**
```typescript
interface JobSubmissionResponse {
  job_id: string;
  status: 'queued';
  created_at: string; // ISO timestamp
  estimated_completion_time?: string; // ISO timestamp
}
```

#### Get Job Status/Results
```http
GET /api/v1/decompile/{job_id}
```

**Response:**
```typescript
interface JobStatusResponse {
  job_id: string;
  status: 'queued' | 'decompiling' | 'translating' | 'completed' | 'failed' | 'cancelled';
  progress_percentage: number;   // 0-100
  created_at: string;           // ISO timestamp
  updated_at: string;           // ISO timestamp
  estimated_completion_time?: string; // ISO timestamp
  
  file_info: {
    name: string;
    size: number;
    format: string;
  };
  
  configuration: {
    analysis_depth: string;
    llm_provider?: string;
    llm_model?: string;
    translation_detail?: string;
  };
  
  // Results are only present when status is 'completed'
  results?: {
    function_count: number;
    import_count: number;
    string_count: number;
    decompilation_data: {
      assembly_code: string;
      functions: DecompiledFunction[];
      imports: ImportInfo[];
      strings: StringInfo[];
    };
    llm_translations?: {
      functions: TranslatedFunction[];
      summary: string;
      confidence_score: number;
    };
  };
  
  error_message?: string; // Present when status is 'failed'
}
```

#### Cancel Job
```http
DELETE /api/v1/decompile/{job_id}
```

**Response:**
```typescript
interface JobCancellationResponse {
  job_id: string;
  status: 'cancelled';
  cancelled_at: string; // ISO timestamp
}
```

### LLM Provider Management

#### List Available Providers
```http
GET /api/v1/llm-providers
```

**Response:**
```typescript
interface ProviderListResponse {
  providers: ProviderInfo[];
  total_count: number;
}

interface ProviderInfo {
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
```

#### Get Provider Details
```http
GET /api/v1/llm-providers/{provider_id}
```

**Response:** Single `ProviderInfo` object with detailed capabilities

#### Test Provider Health
```http
POST /api/v1/llm-providers/{provider_id}/health-check
```

**Response:**
```typescript
interface ProviderHealthResponse {
  provider_id: string;
  status: 'healthy' | 'degraded' | 'unavailable';
  response_time_ms: number;
  success_rate_percent: number;
  last_checked: string; // ISO timestamp
  error_message?: string;
}
```

### System Information

#### System Health Check
```http
GET /api/v1/health
```

**Response:**
```typescript
interface SystemHealthResponse {
  status: 'healthy' | 'degraded' | 'down';
  timestamp: string;
  services: {
    decompilation: 'healthy' | 'degraded' | 'down';
    llm_providers: 'healthy' | 'degraded' | 'down';
  };
}
```

#### System Capabilities
```http
GET /api/v1/system/info
```

**Response:**
```typescript
interface SystemInfoResponse {
  version: string;
  supported_file_formats: string[];
  max_file_size_mb: number;
  available_analysis_depths: string[];
  supported_llm_providers: string[];
}
```

## RTK Query Integration Examples

### Complete API Service Definition

```typescript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Base API configuration
export const analysisApi = createApi({
  reducerPath: 'analysisApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/v1',
  }),
  tagTypes: ['Job', 'Provider', 'Health'],
  endpoints: (builder) => ({
    
    // Job Management
    submitJob: builder.mutation<JobSubmissionResponse, FormData>({
      query: (formData) => ({
        url: '/decompile',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Job'],
    }),
    
    getJobStatus: builder.query<JobStatusResponse, string>({
      query: (jobId) => `/decompile/${jobId}`,
      providesTags: (result, error, jobId) => [{ type: 'Job', id: jobId }],
      // Enable polling for active jobs
      pollingInterval: 2000,
    }),
    
    cancelJob: builder.mutation<JobCancellationResponse, string>({
      query: (jobId) => ({
        url: `/decompile/${jobId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, jobId) => [{ type: 'Job', id: jobId }],
    }),
    
    // Provider Management
    listProviders: builder.query<ProviderListResponse, void>({
      query: () => '/llm-providers',
      providesTags: ['Provider'],
    }),
    
    getProviderDetails: builder.query<ProviderInfo, string>({
      query: (providerId) => `/llm-providers/${providerId}`,
      providesTags: (result, error, providerId) => [{ type: 'Provider', id: providerId }],
    }),
    
    checkProviderHealth: builder.mutation<ProviderHealthResponse, string>({
      query: (providerId) => ({
        url: `/llm-providers/${providerId}/health-check`,
        method: 'POST',
      }),
      invalidatesTags: ['Health'],
    }),
    
    // System Information
    getSystemHealth: builder.query<SystemHealthResponse, void>({
      query: () => '/health',
      providesTags: ['Health'],
    }),
    
    getSystemInfo: builder.query<SystemInfoResponse, void>({
      query: () => '/system/info',
    }),
    
  }),
});

// Export hooks for components
export const {
  useSubmitJobMutation,
  useGetJobStatusQuery,
  useCancelJobMutation,
  useListProvidersQuery,
  useGetProviderDetailsQuery,
  useCheckProviderHealthMutation,
  useGetSystemHealthQuery,
  useGetSystemInfoQuery,
} = analysisApi;
```

### Smart Polling Implementation

```typescript
// Custom hook for smart job status polling
export const useJobStatusWithSmartPolling = (jobId: string | null) => {
  const [pollingInterval, setPollingInterval] = useState<number | undefined>(undefined);
  
  const {
    data: jobStatus,
    error,
    isLoading,
  } = useGetJobStatusQuery(jobId!, {
    pollingInterval,
    skip: !jobId,
  });
  
  useEffect(() => {
    if (!jobStatus) return;
    
    // Smart polling based on job status
    const activeStatuses = ['queued', 'decompiling', 'translating'];
    const completedStatuses = ['completed', 'failed', 'cancelled'];
    
    if (activeStatuses.includes(jobStatus.status)) {
      setPollingInterval(2000); // Poll every 2 seconds for active jobs
    } else if (completedStatuses.includes(jobStatus.status)) {
      setPollingInterval(undefined); // Stop polling for completed jobs
    }
  }, [jobStatus?.status]);
  
  return {
    jobStatus,
    error,
    isLoading,
    isPolling: pollingInterval !== undefined,
  };
};
```

## Error Handling Patterns

### Comprehensive Error Handling

```typescript
// Error handling wrapper for RTK Query
const withErrorHandling = <T extends any>(
  useQueryHook: (arg: any) => any,
  errorMessages: Record<number, string> = {}
) => {
  return (arg: any) => {
    const result = useQueryHook(arg);
    
    const getErrorMessage = (error: any): string => {
      if (!error) return '';
      
      // Handle RTK Query errors
      if ('status' in error) {
        // HTTP status codes
        const statusCode = typeof error.status === 'number' ? error.status : 500;
        if (errorMessages[statusCode]) {
          return errorMessages[statusCode];
        }
        
        switch (statusCode) {
          case 400:
            return 'Invalid request. Please check your input and try again.';
          case 401:
            return 'Authentication required. Please check your API credentials.';
          case 404:
            return 'Resource not found. The job may have expired.';
          case 429:
            return 'Rate limit exceeded. Please wait before making more requests.';
          case 500:
            return 'Server error. Please try again later.';
          default:
            return `Request failed with status ${statusCode}`;
        }
      }
      
      // Handle network errors
      if ('message' in error) {
        return error.message;
      }
      
      return 'An unexpected error occurred';
    };
    
    return {
      ...result,
      errorMessage: getErrorMessage(result.error),
    };
  };
};

// Usage example
export const useJobStatusWithErrorHandling = withErrorHandling(
  useGetJobStatusQuery,
  {
    404: 'Job not found. It may have been deleted or expired.',
    410: 'Job results are no longer available.',
  }
);
```

### Job Submission Error Handling

```typescript
// Job submission with comprehensive error handling
export const useJobSubmissionWithHandling = () => {
  const [submitJob, { isLoading, error }] = useSubmitJobMutation();
  
  const submitJobWithHandling = async (formData: FormData) => {
    try {
      const result = await submitJob(formData).unwrap();
      return { success: true, data: result };
    } catch (error: any) {
      let errorMessage = 'Failed to submit job';
      
      if ('data' in error && error.data?.error_message) {
        errorMessage = error.data.error_message;
      } else if ('status' in error) {
        switch (error.status) {
          case 400:
            errorMessage = 'Invalid file or configuration. Please check your inputs.';
            break;
          case 413:
            errorMessage = 'File too large. Please select a smaller file.';
            break;
          case 422:
            errorMessage = 'Invalid file format. Please upload a supported binary file.';
            break;
          case 503:
            errorMessage = 'Service temporarily unavailable. Please try again later.';
            break;
        }
      }
      
      return { success: false, error: errorMessage };
    }
  };
  
  return {
    submitJobWithHandling,
    isLoading,
    error,
  };
};
```

## Polling Configuration

### Optimized Polling Strategy

```typescript
// Polling configuration based on application state
export const useAdaptivePolling = () => {
  const [isDocumentVisible, setIsDocumentVisible] = useState(!document.hidden);
  const [activeJobCount, setActiveJobCount] = useState(0);
  
  // Monitor document visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsDocumentVisible(!document.hidden);
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  // Calculate optimal polling interval
  const getPollingInterval = (jobStatus: string): number | undefined => {
    const activeStatuses = ['queued', 'decompiling', 'translating'];
    
    if (!activeStatuses.includes(jobStatus)) {
      return undefined; // Stop polling for completed/failed jobs
    }
    
    if (!isDocumentVisible) {
      return 10000; // Slower polling when tab is not visible
    }
    
    if (activeJobCount > 5) {
      return 5000; // Slower polling when many active jobs
    }
    
    return 2000; // Standard polling interval
  };
  
  return { getPollingInterval };
};
```

## TypeScript Type Definitions

### Complete Type Definitions

```typescript
// Job Management Types
export interface JobSubmissionRequest {
  file: File;
  analysisDepth: 'basic' | 'standard' | 'detailed';
  llmProvider?: string;
  llmApiKey?: string;
  llmModel?: string;
  translationDetail?: 'basic' | 'detailed';
}

export interface JobStatusResponse {
  job_id: string;
  status: JobStatus;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
  estimated_completion_time?: string;
  file_info: FileInfo;
  configuration: JobConfiguration;
  results?: AnalysisResults;
  error_message?: string;
}

export type JobStatus = 'queued' | 'decompiling' | 'translating' | 'completed' | 'failed' | 'cancelled';

export interface FileInfo {
  name: string;
  size: number;
  format: string;
}

export interface JobConfiguration {
  analysis_depth: string;
  llm_provider?: string;
  llm_model?: string;
  translation_detail?: string;
}

export interface AnalysisResults {
  function_count: number;
  import_count: number;
  string_count: number;
  decompilation_data: DecompilationData;
  llm_translations?: LLMTranslations;
}

export interface DecompilationData {
  assembly_code: string;
  functions: DecompiledFunction[];
  imports: ImportInfo[];
  strings: StringInfo[];
}

export interface LLMTranslations {
  functions: TranslatedFunction[];
  summary: string;
  confidence_score: number;
}

// Provider Management Types
export interface ProviderInfo {
  id: string;
  name: string;
  description: string;
  supported_models: string[];
  pricing_info: PricingInfo;
  capabilities: ProviderCapabilities;
}

export interface PricingInfo {
  input_cost_per_token: number;
  output_cost_per_token: number;
  currency: string;
}

export interface ProviderCapabilities {
  supports_code_analysis: boolean;
  max_context_length: number;
  average_response_time_ms: number;
}

export interface ProviderHealthResponse {
  provider_id: string;
  status: 'healthy' | 'degraded' | 'unavailable';
  response_time_ms: number;
  success_rate_percent: number;
  last_checked: string;
  error_message?: string;
}

// System Types
export interface SystemHealthResponse {
  status: 'healthy' | 'degraded' | 'down';
  timestamp: string;
  services: Record<string, 'healthy' | 'degraded' | 'down'>;
}

export interface SystemInfoResponse {
  version: string;
  supported_file_formats: string[];
  max_file_size_mb: number;
  available_analysis_depths: string[];
  supported_llm_providers: string[];
}

// Error Types
export interface APIError {
  error_code: string;
  error_message: string;
  details?: Record<string, any>;
}
```

## Integration Testing Patterns

### API Integration Test Examples

```typescript
// Test utilities for API integration
export const createMockJobResponse = (overrides: Partial<JobStatusResponse> = {}): JobStatusResponse => ({
  job_id: 'test-job-123',
  status: 'completed',
  progress_percentage: 100,
  created_at: '2025-08-31T12:00:00Z',
  updated_at: '2025-08-31T12:05:00Z',
  file_info: {
    name: 'test.exe',
    size: 1024000,
    format: 'PE',
  },
  configuration: {
    analysis_depth: 'standard',
    llm_provider: 'openai',
    llm_model: 'gpt-4',
  },
  results: {
    function_count: 42,
    import_count: 15,
    string_count: 128,
    decompilation_data: {
      assembly_code: 'MOV EAX, 1\nRET',
      functions: [],
      imports: [],
      strings: [],
    },
    llm_translations: {
      functions: [],
      summary: 'Simple test program',
      confidence_score: 0.95,
    },
  },
  ...overrides,
});

// Mock API responses for testing
export const mockApiHandlers = [
  rest.post('/api/v1/decompile', (req, res, ctx) => {
    return res(ctx.json({
      job_id: 'test-job-123',
      status: 'queued',
      created_at: new Date().toISOString(),
    }));
  }),
  
  rest.get('/api/v1/decompile/:jobId', (req, res, ctx) => {
    const { jobId } = req.params;
    return res(ctx.json(createMockJobResponse({ job_id: jobId as string })));
  }),
  
  rest.get('/api/v1/llm-providers', (req, res, ctx) => {
    return res(ctx.json({
      providers: [
        {
          id: 'openai',
          name: 'OpenAI',
          description: 'GPT models for code analysis',
          supported_models: ['gpt-4', 'gpt-3.5-turbo'],
          pricing_info: {
            input_cost_per_token: 0.00003,
            output_cost_per_token: 0.00006,
            currency: 'USD',
          },
          capabilities: {
            supports_code_analysis: true,
            max_context_length: 8192,
            average_response_time_ms: 2000,
          },
        },
      ],
      total_count: 1,
    }));
  }),
];
```

## Best Practices

### Performance Optimization

1. **Smart Polling:**
   - Use adaptive polling intervals based on job status
   - Pause polling when document is hidden
   - Reduce polling frequency for multiple active jobs

2. **Request Deduplication:**
   - Use RTK Query caching to avoid duplicate requests
   - Implement proper cache invalidation strategies
   - Use polling intervals that align with backend processing cycles

3. **Error Recovery:**
   - Implement exponential backoff for failed requests
   - Provide clear user feedback for different error scenarios
   - Allow manual retry for transient failures

### Security Considerations

1. **Credential Management:**
   - Store LLM API keys only in session storage
   - Clear credentials on browser close or session end
   - Never log or persist sensitive credentials

2. **Input Validation:**
   - Validate file formats and sizes on the client side
   - Sanitize all user inputs before API submission
   - Implement proper error handling for malformed responses

3. **API Security:**
   - Use HTTPS for all API communications
   - Implement proper CORS handling
   - Handle authentication errors gracefully

---

**Document Version:** 1.0  
**Last Updated:** 2025-08-31  
**Next Review:** After API changes or major feature updates  
**Related Documents:** All PRDs, TDDs, and implementation guides