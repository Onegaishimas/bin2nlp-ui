import { createApi, fetchBaseQuery, retry } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { config } from '../../utils/config';

// Types for API requests and responses
export interface JobSubmissionRequest {
  file: File;
  analysis_depth?: 'basic' | 'standard' | 'comprehensive';
  llm_provider?: string;
  llm_model?: string;
  llm_endpoint_url?: string;
  llm_api_key?: string;
  translation_detail?: 'basic' | 'standard' | 'detailed';
}

export interface JobSubmissionResponse {
  success: boolean;
  job_id: string;
  status: string;
  message: string;
  file_info: {
    filename: string;
    size_bytes: number;
    content_type: string;
  };
  config: {
    analysis_depth: string;
    llm_provider: string | null;
    translation_detail: string;
  };
  estimated_completion: string;
  check_status_url: string;
}

export interface JobStatusResponse {
  job_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress_percentage: number;
  current_stage: string;
  worker_id: string;
  updated_at: string;
  results?: {
    success: boolean;
    function_count: number;
    import_count: number;
    string_count: number;
    duration_seconds: number;
    decompilation_id: string;
  };
  message: string;
  // Computed fields added by transformResponse
  isActive?: boolean;
  isCompleted?: boolean;
  duration?: number;
}

export interface LLMProvider {
  provider_id: string;
  name: string;
  status: 'healthy' | 'unhealthy' | 'error' | 'unknown';
  available_models: string[];
  cost_per_1k_tokens: number;
  capabilities: string[];
  health_score: number | null;
}

// Enhanced error handling types
export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, any>;
  timestamp?: string;
}

// Enhanced base query with retry logic and error handling
const baseQueryWithRetry = retry(
  fetchBaseQuery({
    baseUrl: `${config.apiBaseUrl}/api/v1`,
    timeout: 30000, // 30 seconds timeout
    prepareHeaders: (headers, { getState, endpoint }) => {
      // Remove default Content-Type for FormData requests
      if (endpoint !== 'submitJob') {
        headers.set('Content-Type', 'application/json');
      }
      
      // Add request ID for tracking
      headers.set('X-Request-ID', crypto.randomUUID());
      
      // Add timestamp
      headers.set('X-Request-Timestamp', new Date().toISOString());
      
      return headers;
    },
    // Custom response handler
    responseHandler: async (response) => {
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        
        // Handle API error responses
        if (!response.ok) {
          throw {
            status: response.status,
            data: {
              message: data.message || data.error || 'Request failed',
              code: data.code || `HTTP_${response.status}`,
              details: data.details || {},
              timestamp: data.timestamp || new Date().toISOString(),
            } as ApiError,
          };
        }
        
        return data;
      }
      
      // Handle non-JSON responses
      if (!response.ok) {
        throw {
          status: response.status,
          data: {
            message: `HTTP ${response.status}: ${response.statusText}`,
            code: `HTTP_${response.status}`,
            timestamp: new Date().toISOString(),
          } as ApiError,
        };
      }
      
      return response.text();
    },
  }) as BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError>,
  {
    maxRetries: 3,
    backoff: async (attempt, maxRetries) => {
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    },
  }
);

// RTK Query API definition
export const analysisApi = createApi({
  reducerPath: 'analysisApi',
  baseQuery: baseQueryWithRetry,
  tagTypes: ['Job', 'LLMProvider'],
  endpoints: builder => ({
    // Submit a new analysis job
    submitJob: builder.mutation<JobSubmissionResponse, JobSubmissionRequest>({
      query: ({ 
        file, 
        analysis_depth = 'standard',
        llm_provider,
        llm_model,
        llm_endpoint_url,
        llm_api_key,
        translation_detail = 'standard'
      }) => {
        // Validate file before upload
        const maxSize = 100 * 1024 * 1024; // 100MB
        
        if (file.size > maxSize) {
          throw new Error(`File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds maximum of 100MB`);
        }
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('analysis_depth', analysis_depth);
        formData.append('translation_detail', translation_detail);
        
        // Add optional LLM parameters
        if (llm_provider) {
          formData.append('llm_provider', llm_provider);
        }
        if (llm_model) {
          formData.append('llm_model', llm_model);
        }
        if (llm_endpoint_url) {
          formData.append('llm_endpoint_url', llm_endpoint_url);
        }
        if (llm_api_key) {
          formData.append('llm_api_key', llm_api_key);
        }

        return {
          url: '/decompile',
          method: 'POST',
          body: formData,
          // Don't set Content-Type - let browser set it for multipart/form-data
        };
      },
      invalidatesTags: ['Job'],
      // Transform error response for better user experience
      transformErrorResponse: (response) => {
        if (typeof response.data === 'object' && response.data !== null) {
          const error = response.data as ApiError;
          return {
            message: error.message || 'Job submission failed',
            code: error.code || 'SUBMISSION_ERROR',
            details: error.details || {},
          };
        }
        return {
          message: 'Job submission failed',
          code: 'NETWORK_ERROR',
        };
      },
    }),

    // Get job status and results (optimized for polling)
    getJobStatus: builder.query<JobStatusResponse, string>({
      query: jobId => `/decompile/${jobId}`,
      providesTags: (_result, _error, jobId) => [{ type: 'Job', id: jobId }],
      // Cache for 30 seconds by default (adjust based on job status in component)
      keepUnusedDataFor: 30,
      // Transform response to ensure consistency
      transformResponse: (response: JobStatusResponse) => ({
        ...response,
        // Ensure progress is always a number between 0-100
        progress_percentage: Math.min(100, Math.max(0, response.progress_percentage || 0)),
        // Add derived fields for UI
        isActive: ['queued', 'processing'].includes(response.status),
        isCompleted: ['completed', 'failed', 'cancelled'].includes(response.status),
        duration: response.results?.duration_seconds ? response.results.duration_seconds * 1000 : undefined,
      }),
    }),

    // Cancel a job
    cancelJob: builder.mutation<{ message: string }, string>({
      query: jobId => ({
        url: `/decompile/${jobId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, jobId) => [{ type: 'Job', id: jobId }],
    }),

    // Get job results (when completed)
    getJobResults: builder.query<JobStatusResponse['results'], string>({
      query: jobId => `/decompile/${jobId}/results`,
      providesTags: (_result, _error, jobId) => [{ type: 'Job', id: jobId }],
    }),

    // Get list of available LLM providers
    getLLMProviders: builder.query<
      {
        providers: LLMProvider[];
        recommended_provider: string | null;
        total_healthy: number;
        last_updated: string;
      },
      void
    >({
      query: () => '/llm-providers',
      providesTags: ['LLMProvider'],
    }),

    // Test LLM provider connection
    testLLMProvider: builder.mutation<
      { status: 'success' | 'error'; message: string },
      { providerId: string }
    >({
      query: ({ providerId }) => ({
        url: `/llm-providers/${providerId}/health-check`,
        method: 'POST',
      }),
    }),

    // Get system health status
    getSystemHealth: builder.query<
      {
        status: 'healthy' | 'degraded' | 'down';
        timestamp: string;
        version: string;
        environment: string;
        services: {
          database: {
            status: string;
            type: string;
            response_time_ms: number;
          };
          storage: {
            status: string;
            type: string;
            response_time_ms: number;
          };
          llm_providers: {
            status: string;
            message: string;
            supported_providers: string[];
            mode: string;
            note: string;
          };
        };
      },
      void
    >({
      query: () => '/health',
    }),
  }),
});

// Export hooks for usage in components
export const {
  useSubmitJobMutation,
  useGetJobStatusQuery,
  useLazyGetJobStatusQuery,
  useCancelJobMutation,
  useGetJobResultsQuery,
  useLazyGetJobResultsQuery,
  useGetLLMProvidersQuery,
  useTestLLMProviderMutation,
  useGetSystemHealthQuery,
} = analysisApi;

// Export the reducer to be included in store
export const { reducer: analysisApiReducer } = analysisApi;
