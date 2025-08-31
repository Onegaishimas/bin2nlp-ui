import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { config } from '../../utils/config';

// Types for API requests and responses
export interface JobSubmissionRequest {
  file: File;
  config: {
    analysisDepth: 'basic' | 'detailed' | 'comprehensive';
    includeComments: boolean;
    decompilerOptions: Record<string, any>;
    llmProvider?: string;
    llmApiKey?: string;
  };
}

export interface JobSubmissionResponse {
  jobId: string;
  status: string;
  estimatedTime?: number;
  message?: string;
}

export interface JobStatusResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  phase: 'queued' | 'decompiling' | 'translating' | 'completed' | 'failed';
  fileName: string;
  fileSize: number;
  fileType: string;
  submittedAt: string;
  completedAt?: string;
  error?: string;
  results?: {
    decompilation?: any;
    translation?: any;
  };
}

export interface LLMProvider {
  provider_id: string;
  name: string;
  description: string;
  status: 'healthy' | 'error' | 'unknown';
  models: string[];
  require_auth: boolean;
  error_message?: string;
}

// RTK Query API definition
export const analysisApi = createApi({
  reducerPath: 'analysisApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${config.apiBaseUrl}/api/v1`,
    prepareHeaders: (headers, { getState: _getState }) => {
      // Add any required headers
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Job', 'LLMProvider'],
  endpoints: builder => ({
    // Submit a new analysis job
    submitJob: builder.mutation<JobSubmissionResponse, JobSubmissionRequest>({
      query: ({ file, config }) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('config', JSON.stringify(config));

        return {
          url: '/decompile',
          method: 'POST',
          body: formData,
          formData: true,
        };
      },
      invalidatesTags: ['Job'],
    }),

    // Get job status and results
    getJobStatus: builder.query<JobStatusResponse, string>({
      query: jobId => `/decompile/${jobId}`,
      providesTags: (_result, _error, jobId) => [{ type: 'Job', id: jobId }],
    }),

    // Cancel a job
    cancelJob: builder.mutation<{ message: string }, string>({
      query: jobId => ({
        url: `/decompile/${jobId}/cancel`,
        method: 'POST',
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
      { providerId: string; apiKey: string }
    >({
      query: ({ providerId, apiKey }) => ({
        url: `/llm-providers/${providerId}/test`,
        method: 'POST',
        body: { apiKey },
      }),
    }),

    // Get system health status
    getSystemHealth: builder.query<
      {
        status: 'healthy' | 'degraded' | 'down';
        timestamp: string;
        version: string;
        environment: string;
        services: Record<string, any>;
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
