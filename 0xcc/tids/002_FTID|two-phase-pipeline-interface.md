# Technical Implementation Document: Analysis Configuration Interface

**Date:** 2025-08-31  
**Project:** bin2nlp-frontend  
**Feature:** Analysis Configuration Interface  
**Document ID:** 002_FTID|two-phase-pipeline-interface  
**Related PRD:** 002_FPRD|two-phase-pipeline-interface.md  
**Related TDD:** 002_FTDD|two-phase-pipeline-interface.md

## Implementation Overview

The Analysis Configuration Interface implements a sophisticated form-based configuration system that integrates React Hook Form for local form state management with Redux Toolkit for shared application state. The implementation follows the established architectural patterns from the ADR, emphasizing feature-based organization, RTK Query for API integration, and Material-UI components with consistent theming.

**Key Implementation Principles:**
- Feature-based directory structure with co-located components, hooks, and utilities
- Hybrid state management: React Hook Form for ephemeral form state, Redux for persistent provider data
- RTK Query integration for provider discovery, health checking, and cost estimation
- Secure session-based credential management with automatic cleanup
- Progressive component composition from generic to configuration-specific
- State-driven coordination with job management system through shared Redux state

**Integration Points:**
- Provider discovery and health monitoring via RTK Query endpoints
- Cost estimation with debounced API calls and intelligent caching
- Job submission coordination through shared Redux state patterns
- Credential security with session storage and automatic disposal
- Form validation with real-time feedback and comprehensive error handling

## File Structure and Organization

### Directory Organization Pattern

```
src/
├── features/
│   └── analysis-configuration/           # Feature root directory
│       ├── components/                   # Configuration-specific components
│       │   ├── AnalysisConfigurationInterface.tsx    # Main container component
│       │   ├── ConfigurationForm.tsx                 # Form orchestration component
│       │   ├── sections/                             # Form sections
│       │   │   ├── AnalysisDepthSection.tsx
│       │   │   ├── ProviderSelectionSection.tsx
│       │   │   ├── CredentialInputSection.tsx
│       │   │   └── ModelSelectionSection.tsx
│       │   ├── panels/                               # Information panels
│       │   │   ├── CostEstimationPanel.tsx
│       │   │   ├── ProviderHealthPanel.tsx
│       │   │   └── ConfigurationSummaryPanel.tsx
│       │   └── shared/                               # Reusable components
│       │       ├── ProviderSelector.tsx
│       │       ├── SecureInput.tsx
│       │       └── ValidationMessage.tsx
│       ├── hooks/                        # Feature-specific hooks
│       │   ├── useConfigurationForm.ts
│       │   ├── useCredentialManagement.ts
│       │   ├── useCostEstimation.ts
│       │   └── useProviderHealth.ts
│       ├── services/                     # Business logic services
│       │   ├── configurationApi.ts      # RTK Query API definitions
│       │   ├── credentialSecurity.ts    # Credential handling utilities
│       │   └── costCalculation.ts       # Cost estimation logic
│       ├── types/                        # Feature-specific types
│       │   ├── Configuration.types.ts
│       │   ├── Provider.types.ts
│       │   └── CostEstimation.types.ts
│       ├── utils/                        # Feature utilities
│       │   ├── formValidation.ts
│       │   ├── providerHelpers.ts
│       │   └── configurationHelpers.ts
│       └── index.ts                      # Feature exports
├── store/
│   └── slices/
│       ├── analysisSlice.ts              # Extended for configuration coordination
│       └── providersSlice.ts             # New slice for provider management
├── components/                           # Shared application components
│   └── common/
│       ├── FormField.tsx                 # Generic form field wrapper
│       ├── LoadingIndicator.tsx         # Loading states
│       └── ErrorBoundary.tsx            # Error handling
└── services/
    └── api/
        └── configurationApi.ts           # Global API configuration
```

### File Naming Conventions

**Component Files:**
- Container components: `AnalysisConfigurationInterface.tsx`
- Form components: `ConfigurationForm.tsx`, `CredentialInputSection.tsx`
- Panel components: `CostEstimationPanel.tsx`, `ProviderHealthPanel.tsx`
- Shared components: `ProviderSelector.tsx`, `SecureInput.tsx`

**Service Files:**
- API services: `configurationApi.ts`, `providerApi.ts`
- Utility services: `credentialSecurity.ts`, `costCalculation.ts`
- Business logic: `formValidation.ts`, `providerHelpers.ts`

**Type Files:**
- Domain types: `Configuration.types.ts`, `Provider.types.ts`
- API types: `ConfigurationAPI.types.ts`, `ProviderAPI.types.ts`
- Form types: `ConfigurationForm.types.ts`

**Hook Files:**
- Feature hooks: `useConfigurationForm.ts`, `useCredentialManagement.ts`
- API hooks: `useProviderDiscovery.ts`, `useCostEstimation.ts`
- Utility hooks: `useFormValidation.ts`, `useSecureStorage.ts`

### Import Organization Standards

```typescript
// External libraries
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Card, CardContent, Typography, Box, Stack,
  FormControl, FormLabel, RadioGroup, FormControlLabel, Radio
} from '@mui/material';
import { debounce } from 'lodash';

// Internal services
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { configurationApi } from '../services/configurationApi';
import { credentialSecurity } from '../services/credentialSecurity';

// Components
import { LoadingIndicator } from '../../../components/common/LoadingIndicator';
import { ErrorBoundary } from '../../../components/common/ErrorBoundary';
import { ConfigurationForm } from './ConfigurationForm';
import { CostEstimationPanel } from './panels/CostEstimationPanel';

// Types
import type {
  ConfigurationData,
  ProviderInfo,
  CostEstimation
} from '../types/Configuration.types';

// Relative imports
import './AnalysisConfigurationInterface.styles.css';
```

## Component Implementation Hints

### Container Component Pattern

**AnalysisConfigurationInterface.tsx - Main Container:**
```typescript
interface AnalysisConfigurationInterfaceProps {
  file: File;
  onJobSubmit: (jobId: string) => void;
  onCancel?: () => void;
  initialConfiguration?: Partial<ConfigurationData>;
}

const AnalysisConfigurationInterface: React.FC<AnalysisConfigurationInterfaceProps> = ({
  file,
  onJobSubmit,
  onCancel,
  initialConfiguration
}) => {
  // Primary responsibilities:
  // - Form provider setup and validation schema
  // - State coordination between form and Redux
  // - API hook management and error handling
  // - Job submission orchestration
  
  const dispatch = useAppDispatch();
  const { providers, credentials, costEstimation } = useAppSelector(selectConfigurationState);
  
  // React Hook Form setup with validation
  const form = useForm<ConfigurationData>({
    resolver: yupResolver(configurationValidationSchema),
    defaultValues: {
      analysisDepth: 'standard',
      translationDetail: 'basic',
      ...initialConfiguration,
    },
    mode: 'onChange', // Real-time validation
  });
  
  // RTK Query hooks for API interactions
  const { data: availableProviders, isLoading: providersLoading } = useListProvidersQuery();
  const [submitJob, { isLoading: isSubmitting, error: submitError }] = useSubmitJobMutation();
  const [estimateCost] = useCostEstimationLazyQuery();
  
  // Custom hooks for complex logic
  const { validateCredentials, storeCredential } = useCredentialManagement();
  const { debouncedCostEstimation, costLoading } = useCostEstimation(file, form.watch());
  
  // Job submission handler
  const handleJobSubmission = useCallback(async (formData: ConfigurationData) => {
    try {
      // Validate credentials if provider selected
      if (formData.selectedProvider && !await validateCredentials(formData.selectedProvider, credentials[formData.selectedProvider])) {
        throw new Error('Invalid provider credentials');
      }
      
      // Submit job with complete configuration
      const jobResponse = await submitJob({
        file,
        ...formData,
        apiKey: formData.selectedProvider ? credentials[formData.selectedProvider] : undefined,
      }).unwrap();
      
      // Coordinate with job management
      dispatch(addActiveJob(jobResponse));
      onJobSubmit(jobResponse.job_id);
      
    } catch (error) {
      // Handle submission errors with user-friendly messages
      form.setError('root', {
        type: 'submission',
        message: getConfigurationErrorMessage(error),
      });
    }
  }, [file, credentials, submitJob, validateCredentials, dispatch, onJobSubmit, form]);
  
  return (
    <ErrorBoundary fallback={<ConfigurationErrorFallback />}>
      <Card sx={{ maxWidth: 900, mx: 'auto', p: 3 }}>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(handleJobSubmission)}>
            <ConfigurationForm
              file={file}
              availableProviders={availableProviders || []}
              isLoadingProviders={providersLoading}
            />
            
            <CostEstimationPanel
              estimation={costEstimation}
              isCalculating={costLoading}
              fileSize={file.size}
            />
            
            <ConfigurationSubmissionPanel
              isSubmitting={isSubmitting}
              isFormValid={form.formState.isValid}
              submitError={submitError}
              onCancel={onCancel}
            />
          </form>
        </FormProvider>
      </Card>
    </ErrorBoundary>
  );
};
```

### Form Section Components

**AnalysisDepthSection.tsx - Basic Form Section:**
```typescript
export const AnalysisDepthSection: React.FC = () => {
  const { control } = useFormContext<ConfigurationData>();
  
  return (
    <FormSection title="Analysis Depth" description="Choose the level of detail for binary analysis">
      <Controller
        name="analysisDepth"
        control={control}
        render={({ field, fieldState }) => (
          <FormControl component="fieldset" error={!!fieldState.error} fullWidth>
            <RadioGroup {...field} row>
              <FormControlLabel
                value="basic"
                control={<Radio />}
                label={
                  <OptionLabel
                    title="Basic"
                    description="Fast analysis with core functionality identification"
                    estimatedTime="1-2 minutes"
                  />
                }
              />
              <FormControlLabel
                value="standard"
                control={<Radio />}
                label={
                  <OptionLabel
                    title="Standard"
                    description="Balanced analysis with function relationships"
                    estimatedTime="3-5 minutes"
                  />
                }
              />
              <FormControlLabel
                value="detailed"
                control={<Radio />}
                label={
                  <OptionLabel
                    title="Detailed"
                    description="Comprehensive analysis with data flow tracking"
                    estimatedTime="10-15 minutes"
                  />
                }
              />
            </RadioGroup>
            {fieldState.error && (
              <FormHelperText>{fieldState.error.message}</FormHelperText>
            )}
          </FormControl>
        )}
      />
    </FormSection>
  );
};
```

**ProviderSelectionSection.tsx - Complex Form Section:**
```typescript
interface ProviderSelectionSectionProps {
  availableProviders: ProviderInfo[];
  isLoadingProviders: boolean;
}

export const ProviderSelectionSection: React.FC<ProviderSelectionSectionProps> = ({
  availableProviders,
  isLoadingProviders
}) => {
  const { control, watch, setValue } = useFormContext<ConfigurationData>();
  const selectedProvider = watch('selectedProvider');
  
  // Provider health monitoring
  const [checkHealth, { isLoading: healthChecking }] = useProviderHealthMutation();
  const { data: providerHealth } = useProviderHealthQuery(selectedProvider, {
    skip: !selectedProvider,
    pollingInterval: 60000, // Check every minute
  });
  
  // Available models for selected provider
  const availableModels = useMemo(() => {
    const provider = availableProviders.find(p => p.id === selectedProvider);
    return provider?.supported_models || [];
  }, [availableProviders, selectedProvider]);
  
  // Auto-select first available model when provider changes
  useEffect(() => {
    if (selectedProvider && availableModels.length > 0 && !watch('selectedModel')) {
      setValue('selectedModel', availableModels[0]);
    }
  }, [selectedProvider, availableModels, setValue, watch]);
  
  return (
    <FormSection
      title="LLM Provider Selection"
      description="Optional: Select an LLM provider for natural language translation"
      expandable
      defaultExpanded={false}
    >
      <Stack spacing={3}>
        {/* Provider Selection */}
        <Controller
          name="selectedProvider"
          control={control}
          render={({ field, fieldState }) => (
            <FormControl fullWidth error={!!fieldState.error}>
              <ProviderSelector
                {...field}
                providers={availableProviders}
                loading={isLoadingProviders}
                healthStatus={providerHealth}
                onHealthCheck={(providerId) => checkHealth({ providerId })}
                healthChecking={healthChecking}
              />
              {fieldState.error && (
                <FormHelperText>{fieldState.error.message}</FormHelperText>
              )}
            </FormControl>
          )}
        />
        
        {/* Model Selection - appears when provider is selected */}
        {selectedProvider && (
          <Controller
            name="selectedModel"
            control={control}
            render={({ field, fieldState }) => (
              <FormControl fullWidth error={!!fieldState.error}>
                <ModelSelector
                  {...field}
                  models={availableModels}
                  providerId={selectedProvider}
                />
                {fieldState.error && (
                  <FormHelperText>{fieldState.error.message}</FormHelperText>
                )}
              </FormControl>
            )}
          />
        )}
        
        {/* Credential Input - appears when provider is selected */}
        {selectedProvider && (
          <CredentialInputSection providerId={selectedProvider} />
        )}
        
        {/* Translation Detail Level */}
        {selectedProvider && (
          <Controller
            name="translationDetail"
            control={control}
            render={({ field }) => (
              <FormControl component="fieldset">
                <FormLabel component="legend">Translation Detail Level</FormLabel>
                <RadioGroup {...field} row>
                  <FormControlLabel value="basic" control={<Radio />} label="Basic Translation" />
                  <FormControlLabel value="detailed" control={<Radio />} label="Detailed Translation" />
                </RadioGroup>
              </FormControl>
            )}
          />
        )}
      </Stack>
    </FormSection>
  );
};
```

### Custom Hook Patterns

**useCredentialManagement.ts - Credential Security Hook:**
```typescript
export const useCredentialManagement = () => {
  const dispatch = useAppDispatch();
  const credentials = useAppSelector(selectProviderCredentials);
  
  const storeCredential = useCallback(async (providerId: string, apiKey: string) => {
    // Validate API key format
    if (!validateApiKeyFormat(providerId, apiKey)) {
      throw new Error('Invalid API key format for provider');
    }
    
    // Store in Redux state
    dispatch(setProviderCredential({ providerId, apiKey }));
    
    // Store in session storage with encryption
    const encryptedKey = credentialSecurity.encrypt(apiKey);
    const sessionData = {
      version: '1.0',
      credentials: {
        [providerId]: {
          providerId,
          encryptedApiKey: encryptedKey,
          lastValidated: new Date().toISOString(),
          expiresAt: Date.now() + (2 * 60 * 60 * 1000), // 2 hours
        }
      }
    };
    
    sessionStorage.setItem('bin2nlp_credentials', JSON.stringify(sessionData));
  }, [dispatch]);
  
  const validateCredentials = useCallback(async (providerId: string, apiKey: string) => {
    try {
      // Basic format validation
      if (!validateApiKeyFormat(providerId, apiKey)) {
        return false;
      }
      
      // API validation through health check
      const healthResult = await checkProviderHealth({ providerId, apiKey }).unwrap();
      return healthResult.status === 'healthy';
      
    } catch (error) {
      console.warn('Credential validation failed:', error);
      return false;
    }
  }, []);
  
  const clearCredential = useCallback((providerId: string) => {
    dispatch(clearProviderCredential({ providerId }));
    
    // Update session storage
    const stored = sessionStorage.getItem('bin2nlp_credentials');
    if (stored) {
      try {
        const sessionData = JSON.parse(stored);
        delete sessionData.credentials[providerId];
        if (Object.keys(sessionData.credentials).length === 0) {
          sessionStorage.removeItem('bin2nlp_credentials');
        } else {
          sessionStorage.setItem('bin2nlp_credentials', JSON.stringify(sessionData));
        }
      } catch {
        sessionStorage.removeItem('bin2nlp_credentials');
      }
    }
  }, [dispatch]);
  
  // Auto-cleanup on component unmount
  useEffect(() => {
    const cleanup = () => {
      const stored = sessionStorage.getItem('bin2nlp_credentials');
      if (stored) {
        try {
          const sessionData = JSON.parse(stored);
          const now = Date.now();
          
          Object.entries(sessionData.credentials).forEach(([providerId, data]: [string, any]) => {
            if (data.expiresAt && now > data.expiresAt) {
              delete sessionData.credentials[providerId];
              dispatch(clearProviderCredential({ providerId }));
            }
          });
          
          if (Object.keys(sessionData.credentials).length === 0) {
            sessionStorage.removeItem('bin2nlp_credentials');
          } else {
            sessionStorage.setItem('bin2nlp_credentials', JSON.stringify(sessionData));
          }
        } catch {
          sessionStorage.removeItem('bin2nlp_credentials');
        }
      }
    };
    
    const interval = setInterval(cleanup, 5 * 60 * 1000); // Check every 5 minutes
    window.addEventListener('beforeunload', cleanup);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', cleanup);
    };
  }, [dispatch]);
  
  return {
    credentials,
    storeCredential,
    validateCredentials,
    clearCredential,
  };
};
```

**useCostEstimation.ts - Cost Calculation Hook:**
```typescript
export const useCostEstimation = (file: File, configuration: ConfigurationData) => {
  const [estimateCost, { data: estimation, isLoading, error }] = useEstimateCostLazyQuery();
  
  // Debounced estimation to prevent excessive API calls
  const debouncedEstimate = useCallback(
    debounce((config: ConfigurationData) => {
      if (!file || !config.analysisDepth) return;
      
      estimateCost({
        file_size: file.size,
        file_type: file.type || 'unknown',
        analysis_depth: config.analysisDepth,
        llm_provider: config.selectedProvider,
        llm_model: config.selectedModel,
        translation_detail: config.translationDetail || 'basic',
      });
    }, 500), // 500ms debounce
    [file, estimateCost]
  );
  
  // Trigger estimation when configuration changes
  useEffect(() => {
    debouncedEstimate(configuration);
  }, [configuration, debouncedEstimate]);
  
  // Calculate local estimates for basic scenarios
  const localEstimation = useMemo(() => {
    if (!file || !configuration.analysisDepth) return null;
    
    const baseTime = calculateBasicTime(file.size, configuration.analysisDepth);
    const baseCost = calculateBasicCost(file.size, configuration.analysisDepth);
    
    return {
      estimated_time_minutes: baseTime,
      estimated_cost_usd: baseCost,
      confidence: 'low' as const,
      breakdown: {
        decompilation: baseCost,
        llm_translation: 0,
      }
    };
  }, [file, configuration.analysisDepth]);
  
  return {
    estimation: estimation || localEstimation,
    isLoading,
    error,
    debouncedEstimate,
  };
};

// Helper functions
const calculateBasicTime = (fileSize: number, depth: string): number => {
  const sizeMultiplier = Math.max(1, fileSize / (1024 * 1024)); // MB
  const depthMultiplier = { basic: 1, standard: 2.5, detailed: 6 }[depth] || 1;
  return Math.ceil(sizeMultiplier * depthMultiplier);
};

const calculateBasicCost = (fileSize: number, depth: string): number => {
  const sizeCost = fileSize / (1024 * 1024) * 0.01; // $0.01 per MB
  const depthCost = { basic: 0.05, standard: 0.15, detailed: 0.40 }[depth] || 0.05;
  return Math.round((sizeCost + depthCost) * 100) / 100;
};
```

## API Implementation Strategy

### RTK Query API Definition

**configurationApi.ts - Comprehensive API Setup:**
```typescript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  ProviderInfo,
  ProviderDetails,
  ProviderHealthResponse,
  CostEstimationRequest,
  CostEstimationResponse,
  JobSubmissionRequest,
  JobSubmissionResponse,
} from '../types/Configuration.types';

export const configurationApi = createApi({
  reducerPath: 'configurationApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/v1',
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Providers', 'ProviderHealth', 'CostEstimation'],
  endpoints: (builder) => ({
    
    // Provider Discovery
    listProviders: builder.query<ProviderInfo[], void>({
      query: () => '/llm-providers',
      keepUnusedDataFor: 300, // 5 minutes cache
      providesTags: ['Providers'],
    }),
    
    getProviderDetails: builder.query<ProviderDetails, string>({
      query: (providerId) => `/llm-providers/${providerId}`,
      keepUnusedDataFor: 600, // 10 minutes cache
      providesTags: (result, error, providerId) => [
        { type: 'Providers', id: providerId }
      ],
    }),
    
    // Provider Health Monitoring
    checkProviderHealth: builder.mutation<ProviderHealthResponse, {
      providerId: string;
      apiKey?: string;
    }>({
      query: ({ providerId, apiKey }) => ({
        url: `/llm-providers/${providerId}/health-check`,
        method: 'POST',
        body: apiKey ? { api_key: apiKey } : {},
      }),
      invalidatesTags: (result, error, { providerId }) => [
        { type: 'ProviderHealth', id: providerId }
      ],
    }),
    
    getProviderHealth: builder.query<ProviderHealthResponse, string>({
      query: (providerId) => `/llm-providers/${providerId}/health`,
      keepUnusedDataFor: 60, // 1 minute cache for health data
      providesTags: (result, error, providerId) => [
        { type: 'ProviderHealth', id: providerId }
      ],
    }),
    
    // Cost Estimation
    estimateCost: builder.query<CostEstimationResponse, CostEstimationRequest>({
      query: (request) => ({
        url: '/estimate-cost',
        method: 'POST',
        body: request,
      }),
      keepUnusedDataFor: 180, // 3 minutes cache
      // Custom cache key for different configurations
      serializeQueryArgs: ({ queryArgs }) => {
        const key = `${queryArgs.file_size}-${queryArgs.analysis_depth}-${queryArgs.llm_provider || 'none'}-${queryArgs.llm_model || 'default'}`;
        return key;
      },
      providesTags: ['CostEstimation'],
    }),
    
    // Job Submission
    submitJob: builder.mutation<JobSubmissionResponse, JobSubmissionRequest>({
      query: ({ file, configuration, credentials }) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('analysis_depth', configuration.analysisDepth);
        
        // Add LLM configuration if provider is selected
        if (configuration.selectedProvider && credentials[configuration.selectedProvider]) {
          formData.append('llm_provider', configuration.selectedProvider);
          formData.append('llm_api_key', credentials[configuration.selectedProvider]);
          
          if (configuration.selectedModel) {
            formData.append('llm_model', configuration.selectedModel);
          }
          
          if (configuration.translationDetail) {
            formData.append('translation_detail', configuration.translationDetail);
          }
        }
        
        return {
          url: '/decompile',
          method: 'POST',
          body: formData,
          formData: true,
        };
      },
      invalidatesTags: ['CostEstimation'], // Cost estimates may change after submission
    }),
    
  }),
});

// Export hooks for components
export const {
  useListProvidersQuery,
  useGetProviderDetailsQuery,
  useCheckProviderHealthMutation,
  useGetProviderHealthQuery,
  useEstimateCostQuery,
  useEstimateCostLazyQuery,
  useSubmitJobMutation,
} = configurationApi;

// Export API reducer for store configuration
export const configurationApiReducer = configurationApi.reducer;
export const configurationApiMiddleware = configurationApi.middleware;
```

### Error Handling Strategy

**Error Classification and Recovery:**
```typescript
export enum ConfigurationErrorType {
  NETWORK_ERROR = 'network_error',
  VALIDATION_ERROR = 'validation_error',
  PROVIDER_ERROR = 'provider_error',
  CREDENTIALS_ERROR = 'credentials_error',
  QUOTA_ERROR = 'quota_error',
  SERVER_ERROR = 'server_error',
  UNKNOWN_ERROR = 'unknown_error',
}

export const classifyConfigurationError = (error: any): ConfigurationErrorType => {
  if (!navigator.onLine) return ConfigurationErrorType.NETWORK_ERROR;
  
  if (error?.status) {
    switch (error.status) {
      case 400: return ConfigurationErrorType.VALIDATION_ERROR;
      case 401: return ConfigurationErrorType.CREDENTIALS_ERROR;
      case 402: return ConfigurationErrorType.QUOTA_ERROR;
      case 403: return ConfigurationErrorType.PROVIDER_ERROR;
      case 404: return ConfigurationErrorType.PROVIDER_ERROR;
      case 429: return ConfigurationErrorType.QUOTA_ERROR;
      case 500:
      case 502:
      case 503:
      case 504: return ConfigurationErrorType.SERVER_ERROR;
      default: return ConfigurationErrorType.UNKNOWN_ERROR;
    }
  }
  
  return ConfigurationErrorType.NETWORK_ERROR;
};

export const getConfigurationErrorMessage = (error: any): string => {
  const errorType = classifyConfigurationError(error);
  
  const errorMessages: Record<ConfigurationErrorType, string> = {
    [ConfigurationErrorType.NETWORK_ERROR]: 'Network connection issue. Please check your internet connection.',
    [ConfigurationErrorType.VALIDATION_ERROR]: 'Invalid configuration parameters. Please check your selections.',
    [ConfigurationErrorType.PROVIDER_ERROR]: 'LLM provider is currently unavailable. Please try a different provider.',
    [ConfigurationErrorType.CREDENTIALS_ERROR]: 'Invalid API credentials. Please check your API key.',
    [ConfigurationErrorType.QUOTA_ERROR]: 'Rate limit or quota exceeded. Please wait before retrying.',
    [ConfigurationErrorType.SERVER_ERROR]: 'Server error occurred. Please try again in a moment.',
    [ConfigurationErrorType.UNKNOWN_ERROR]: 'Unexpected error occurred. Please try again.',
  };
  
  return errorMessages[errorType] || errorMessages[ConfigurationErrorType.UNKNOWN_ERROR];
};

// Retry strategy configuration
export const getRetryConfig = (errorType: ConfigurationErrorType): { shouldRetry: boolean; delay: number; maxRetries: number } => {
  const retryConfigs: Record<ConfigurationErrorType, { shouldRetry: boolean; delay: number; maxRetries: number }> = {
    [ConfigurationErrorType.NETWORK_ERROR]: { shouldRetry: true, delay: 2000, maxRetries: 3 },
    [ConfigurationErrorType.SERVER_ERROR]: { shouldRetry: true, delay: 5000, maxRetries: 2 },
    [ConfigurationErrorType.PROVIDER_ERROR]: { shouldRetry: true, delay: 10000, maxRetries: 1 },
    [ConfigurationErrorType.QUOTA_ERROR]: { shouldRetry: false, delay: 0, maxRetries: 0 },
    [ConfigurationErrorType.CREDENTIALS_ERROR]: { shouldRetry: false, delay: 0, maxRetries: 0 },
    [ConfigurationErrorType.VALIDATION_ERROR]: { shouldRetry: false, delay: 0, maxRetries: 0 },
    [ConfigurationErrorType.UNKNOWN_ERROR]: { shouldRetry: false, delay: 0, maxRetries: 0 },
  };
  
  return retryConfigs[errorType] || { shouldRetry: false, delay: 0, maxRetries: 0 };
};
```

## State Management Integration

### Redux Slice Enhancement

**Extended analysisSlice.ts - Configuration Integration:**
```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { 
  ConfigurationData, 
  ProviderInfo, 
  CostEstimation,
  ProviderHealthStatus,
  JobSubmissionState 
} from '../types/Configuration.types';

interface ConfigurationState {
  // Form state (coordinated with React Hook Form)
  currentConfiguration: Partial<ConfigurationData>;
  presets: Record<string, ConfigurationPreset>;
  
  // Provider management
  providers: {
    available: ProviderInfo[];
    selected?: string;
    health: Record<string, ProviderHealthStatus>;
    lastRefresh?: string;
  };
  
  // Credential management (session-only)
  credentials: {
    byProvider: Record<string, string>; // providerId -> apiKey
    lastValidated: Record<string, string>; // providerId -> timestamp
    validationStatus: Record<string, boolean>; // providerId -> isValid
  };
  
  // Cost estimation
  estimation: {
    current?: CostEstimation;
    isCalculating: boolean;
    history: CostEstimation[];
    lastCalculated?: string;
  };
  
  // Submission state
  submission: {
    isSubmitting: boolean;
    lastSubmittedJobId?: string;
    error?: string;
  };
  
  // UI state
  ui: {
    activeSection: 'basic' | 'advanced' | 'presets';
    showCostBreakdown: boolean;
    expandedSections: string[];
  };
}

const initialConfigurationState: ConfigurationState = {
  currentConfiguration: {
    analysisDepth: 'standard',
    translationDetail: 'basic',
  },
  presets: {},
  providers: {
    available: [],
    health: {},
  },
  credentials: {
    byProvider: {},
    lastValidated: {},
    validationStatus: {},
  },
  estimation: {
    isCalculating: false,
    history: [],
  },
  submission: {
    isSubmitting: false,
  },
  ui: {
    activeSection: 'basic',
    showCostBreakdown: true,
    expandedSections: [],
  },
};

const configurationSlice = createSlice({
  name: 'configuration',
  initialState: initialConfigurationState,
  reducers: {
    // Configuration management
    updateConfiguration: (state, action: PayloadAction<Partial<ConfigurationData>>) => {
      state.currentConfiguration = { ...state.currentConfiguration, ...action.payload };
    },
    
    resetConfiguration: (state) => {
      state.currentConfiguration = {
        analysisDepth: 'standard',
        translationDetail: 'basic',
      };
    },
    
    // Provider management
    setProviders: (state, action: PayloadAction<ProviderInfo[]>) => {
      state.providers.available = action.payload;
      state.providers.lastRefresh = new Date().toISOString();
    },
    
    selectProvider: (state, action: PayloadAction<string>) => {
      state.providers.selected = action.payload;
      state.currentConfiguration.selectedProvider = action.payload;
    },
    
    updateProviderHealth: (state, action: PayloadAction<{
      providerId: string;
      health: ProviderHealthStatus;
    }>) => {
      const { providerId, health } = action.payload;
      state.providers.health[providerId] = health;
    },
    
    // Credential management
    setProviderCredential: (state, action: PayloadAction<{
      providerId: string;
      apiKey: string;
    }>) => {
      const { providerId, apiKey } = action.payload;
      state.credentials.byProvider[providerId] = apiKey;
      state.credentials.lastValidated[providerId] = new Date().toISOString();
      state.credentials.validationStatus[providerId] = false; // Will be validated separately
    },
    
    clearProviderCredential: (state, action: PayloadAction<{ providerId: string }>) => {
      const { providerId } = action.payload;
      delete state.credentials.byProvider[providerId];
      delete state.credentials.lastValidated[providerId];
      delete state.credentials.validationStatus[providerId];
    },
    
    setCredentialValidation: (state, action: PayloadAction<{
      providerId: string;
      isValid: boolean;
    }>) => {
      const { providerId, isValid } = action.payload;
      state.credentials.validationStatus[providerId] = isValid;
      if (isValid) {
        state.credentials.lastValidated[providerId] = new Date().toISOString();
      }
    },
    
    // Cost estimation
    setCostEstimation: (state, action: PayloadAction<CostEstimation>) => {
      state.estimation.current = action.payload;
      state.estimation.isCalculating = false;
      state.estimation.lastCalculated = new Date().toISOString();
      
      // Add to history (keep last 10)
      state.estimation.history.unshift(action.payload);
      state.estimation.history = state.estimation.history.slice(0, 10);
    },
    
    startCostCalculation: (state) => {
      state.estimation.isCalculating = true;
    },
    
    clearCostEstimation: (state) => {
      state.estimation.current = undefined;
      state.estimation.isCalculating = false;
    },
    
    // Preset management
    saveConfigurationPreset: (state, action: PayloadAction<{
      name: string;
      configuration: ConfigurationData;
    }>) => {
      const { name, configuration } = action.payload;
      const presetId = `preset_${Date.now()}`;
      
      state.presets[presetId] = {
        id: presetId,
        name,
        configuration,
        createdAt: new Date().toISOString(),
        usageCount: 0,
      };
      
      // Persist to localStorage
      try {
        const presetsData = {
          version: '1.0',
          presets: state.presets,
        };
        localStorage.setItem('bin2nlp_configuration_presets', JSON.stringify(presetsData));
      } catch (error) {
        console.warn('Failed to save configuration presets to localStorage:', error);
      }
    },
    
    loadConfigurationPreset: (state, action: PayloadAction<{ presetId: string }>) => {
      const { presetId } = action.payload;
      const preset = state.presets[presetId];
      
      if (preset) {
        state.currentConfiguration = { ...preset.configuration };
        preset.usageCount += 1;
        preset.lastUsed = new Date().toISOString();
      }
    },
    
    deleteConfigurationPreset: (state, action: PayloadAction<{ presetId: string }>) => {
      delete state.presets[action.payload.presetId];
      
      // Update localStorage
      try {
        const presetsData = {
          version: '1.0',
          presets: state.presets,
        };
        localStorage.setItem('bin2nlp_configuration_presets', JSON.stringify(presetsData));
      } catch (error) {
        console.warn('Failed to update configuration presets in localStorage:', error);
      }
    },
    
    // Job submission
    startJobSubmission: (state) => {
      state.submission.isSubmitting = true;
      state.submission.error = undefined;
    },
    
    completeJobSubmission: (state, action: PayloadAction<{ jobId: string }>) => {
      state.submission.isSubmitting = false;
      state.submission.lastSubmittedJobId = action.payload.jobId;
      state.submission.error = undefined;
    },
    
    failJobSubmission: (state, action: PayloadAction<{ error: string }>) => {
      state.submission.isSubmitting = false;
      state.submission.error = action.payload.error;
    },
    
    // UI state management
    setActiveSection: (state, action: PayloadAction<'basic' | 'advanced' | 'presets'>) => {
      state.ui.activeSection = action.payload;
    },
    
    toggleCostBreakdown: (state) => {
      state.ui.showCostBreakdown = !state.ui.showCostBreakdown;
    },
    
    toggleSectionExpansion: (state, action: PayloadAction<{ sectionId: string }>) => {
      const { sectionId } = action.payload;
      const index = state.ui.expandedSections.indexOf(sectionId);
      
      if (index >= 0) {
        state.ui.expandedSections.splice(index, 1);
      } else {
        state.ui.expandedSections.push(sectionId);
      }
    },
  },
});

export const {
  updateConfiguration,
  resetConfiguration,
  setProviders,
  selectProvider,
  updateProviderHealth,
  setProviderCredential,
  clearProviderCredential,
  setCredentialValidation,
  setCostEstimation,
  startCostCalculation,
  clearCostEstimation,
  saveConfigurationPreset,
  loadConfigurationPreset,
  deleteConfigurationPreset,
  startJobSubmission,
  completeJobSubmission,
  failJobSubmission,
  setActiveSection,
  toggleCostBreakdown,
  toggleSectionExpansion,
} = configurationSlice.actions;

export const configurationReducer = configurationSlice.reducer;

// Selectors
export const selectConfigurationState = (state: RootState) => state.configuration;
export const selectCurrentConfiguration = (state: RootState) => state.configuration.currentConfiguration;
export const selectAvailableProviders = (state: RootState) => state.configuration.providers.available;
export const selectProviderCredentials = (state: RootState) => state.configuration.credentials.byProvider;
export const selectCurrentEstimation = (state: RootState) => state.configuration.estimation.current;
export const selectIsSubmitting = (state: RootState) => state.configuration.submission.isSubmitting;
```

## Security Implementation Approach

### Credential Security Service

**credentialSecurity.ts - Comprehensive Security:**
```typescript
import crypto from 'crypto';

export class CredentialSecurity {
  private static readonly STORAGE_KEY = 'bin2nlp_credentials';
  private static readonly VERSION = '1.0';
  private static readonly EXPIRY_HOURS = 2;
  
  // API Key format validation patterns
  private static readonly API_KEY_PATTERNS: Record<string, RegExp> = {
    openai: /^sk-[A-Za-z0-9]{48}$/,
    anthropic: /^sk-ant-api[0-9]{2}-[A-Za-z0-9_-]{95}$/,
    google: /^[A-Za-z0-9_-]{39}$/,
    ollama: /^.{1,100}$/, // Local installations can have various formats
    huggingface: /^hf_[A-Za-z0-9]{30,}$/,
  };
  
  /**
   * Validate API key format for specific provider
   */
  static validateApiKeyFormat(providerId: string, apiKey: string): boolean {
    if (!apiKey || typeof apiKey !== 'string') {
      return false;
    }
    
    const pattern = this.API_KEY_PATTERNS[providerId.toLowerCase()];
    if (!pattern) {
      // For unknown providers, basic length validation
      return apiKey.length >= 10 && apiKey.length <= 200;
    }
    
    return pattern.test(apiKey);
  }
  
  /**
   * Encrypt API key for session storage (simple base64 for session-only storage)
   */
  static encrypt(apiKey: string): string {
    try {
      // For session-only storage, base64 is sufficient
      // In production with persistent storage, use proper encryption
      return btoa(apiKey);
    } catch (error) {
      throw new Error('Failed to encrypt API key');
    }
  }
  
  /**
   * Decrypt API key from storage
   */
  static decrypt(encryptedKey: string): string {
    try {
      return atob(encryptedKey);
    } catch (error) {
      throw new Error('Failed to decrypt API key - invalid format');
    }
  }
  
  /**
   * Store credentials securely in session storage
   */
  static storeCredentials(credentials: Record<string, string>): void {
    try {
      const sessionData = {
        version: this.VERSION,
        credentials: Object.entries(credentials).reduce((acc, [providerId, apiKey]) => {
          acc[providerId] = {
            providerId,
            encryptedApiKey: this.encrypt(apiKey),
            storedAt: new Date().toISOString(),
            expiresAt: Date.now() + (this.EXPIRY_HOURS * 60 * 60 * 1000),
          };
          return acc;
        }, {} as Record<string, any>),
        createdAt: new Date().toISOString(),
      };
      
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessionData));
    } catch (error) {
      console.error('Failed to store credentials securely:', error);
      throw new Error('Failed to store credentials');
    }
  }
  
  /**
   * Retrieve credentials from session storage
   */
  static retrieveCredentials(): Record<string, string> {
    try {
      const stored = sessionStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return {};
      }
      
      const sessionData = JSON.parse(stored);
      const now = Date.now();
      const validCredentials: Record<string, string> = {};
      
      Object.entries(sessionData.credentials || {}).forEach(([providerId, data]: [string, any]) => {
        // Check expiry
        if (data.expiresAt && now < data.expiresAt) {
          try {
            validCredentials[providerId] = this.decrypt(data.encryptedApiKey);
          } catch (error) {
            console.warn(`Failed to decrypt credentials for provider ${providerId}:`, error);
          }
        }
      });
      
      // Clean up expired credentials
      if (Object.keys(validCredentials).length !== Object.keys(sessionData.credentials).length) {
        this.cleanupExpiredCredentials();
      }
      
      return validCredentials;
      
    } catch (error) {
      console.warn('Failed to retrieve credentials, clearing storage:', error);
      this.clearAllCredentials();
      return {};
    }
  }
  
  /**
   * Clear specific provider credential
   */
  static clearProviderCredential(providerId: string): void {
    try {
      const stored = sessionStorage.getItem(this.STORAGE_KEY);
      if (!stored) return;
      
      const sessionData = JSON.parse(stored);
      if (sessionData.credentials && sessionData.credentials[providerId]) {
        delete sessionData.credentials[providerId];
        
        if (Object.keys(sessionData.credentials).length === 0) {
          sessionStorage.removeItem(this.STORAGE_KEY);
        } else {
          sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessionData));
        }
      }
    } catch (error) {
      console.warn('Failed to clear provider credential:', error);
    }
  }
  
  /**
   * Clear all stored credentials
   */
  static clearAllCredentials(): void {
    try {
      sessionStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear credentials:', error);
    }
  }
  
  /**
   * Clean up expired credentials from storage
   */
  static cleanupExpiredCredentials(): void {
    try {
      const stored = sessionStorage.getItem(this.STORAGE_KEY);
      if (!stored) return;
      
      const sessionData = JSON.parse(stored);
      const now = Date.now();
      const validCredentials: Record<string, any> = {};
      
      Object.entries(sessionData.credentials || {}).forEach(([providerId, data]: [string, any]) => {
        if (data.expiresAt && now < data.expiresAt) {
          validCredentials[providerId] = data;
        }
      });
      
      if (Object.keys(validCredentials).length === 0) {
        sessionStorage.removeItem(this.STORAGE_KEY);
      } else {
        sessionData.credentials = validCredentials;
        sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessionData));
      }
      
    } catch (error) {
      console.warn('Failed to cleanup expired credentials:', error);
      this.clearAllCredentials();
    }
  }
  
  /**
   * Setup automatic cleanup on page unload and periodic intervals
   */
  static setupAutoCleanup(): void {
    // Cleanup on page unload
    const handleBeforeUnload = () => {
      this.clearAllCredentials();
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Periodic cleanup every 15 minutes
    const cleanupInterval = setInterval(() => {
      this.cleanupExpiredCredentials();
    }, 15 * 60 * 1000);
    
    // Cleanup on visibility change (tab becomes hidden)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        this.cleanupExpiredCredentials();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Return cleanup function
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(cleanupInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }
  
  /**
   * Sanitize API key for logging (show only first and last 4 characters)
   */
  static sanitizeForLogging(apiKey: string): string {
    if (!apiKey || apiKey.length < 8) {
      return '[REDACTED]';
    }
    
    return `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`;
  }
  
  /**
   * Validate credential strength (basic checks)
   */
  static validateCredentialStrength(providerId: string, apiKey: string): {
    isValid: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];
    
    // Format validation
    if (!this.validateApiKeyFormat(providerId, apiKey)) {
      warnings.push('API key format appears invalid for this provider');
    }
    
    // Basic security checks
    if (apiKey.includes(' ')) {
      warnings.push('API key contains spaces which may indicate copy/paste errors');
    }
    
    if (apiKey.length < 10) {
      warnings.push('API key appears too short');
    }
    
    if (apiKey === apiKey.toLowerCase() || apiKey === apiKey.toUpperCase()) {
      warnings.push('API key lacks character diversity which may indicate test key');
    }
    
    return {
      isValid: warnings.length === 0,
      warnings,
    };
  }
}

// Export singleton instance
export const credentialSecurity = new CredentialSecurity();
```

## Testing Implementation Approach

### Component Testing Strategy

**AnalysisConfigurationInterface.test.tsx:**
```typescript
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

import { AnalysisConfigurationInterface } from './AnalysisConfigurationInterface';
import { configurationReducer } from '../store/configurationSlice';
import { configurationApi } from '../services/configurationApi';

// Mock data
const mockProviders = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT models for code analysis',
    supported_models: ['gpt-3.5-turbo', 'gpt-4'],
    pricing_info: {
      input_cost_per_token: 0.0015,
      output_cost_per_token: 0.002,
      currency: 'USD',
    },
    capabilities: {
      supports_code_analysis: true,
      max_context_length: 4096,
      average_response_time_ms: 2000,
    },
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude models for detailed analysis',
    supported_models: ['claude-3-sonnet', 'claude-3-opus'],
    pricing_info: {
      input_cost_per_token: 0.003,
      output_cost_per_token: 0.015,
      currency: 'USD',
    },
    capabilities: {
      supports_code_analysis: true,
      max_context_length: 8192,
      average_response_time_ms: 3000,
    },
  },
];

const mockCostEstimation = {
  decompilation_cost: 0.15,
  llm_translation_cost: 0.45,
  total_estimated_cost: 0.60,
  estimated_processing_minutes: 8,
  currency: 'USD',
  confidence: 'high' as const,
  breakdown: {
    base_analysis: 0.15,
    llm_tokens_estimated: 1500,
    provider_markup: 0.10,
  },
};

// MSW server for API mocking
const server = setupServer(
  rest.get('/api/v1/llm-providers', (req, res, ctx) => {
    return res(ctx.json(mockProviders));
  }),
  
  rest.post('/api/v1/llm-providers/:providerId/health-check', (req, res, ctx) => {
    return res(ctx.json({
      provider_id: req.params.providerId,
      status: 'healthy',
      response_time_ms: 150,
      tested_at: new Date().toISOString(),
      capabilities_verified: ['code_analysis'],
    }));
  }),
  
  rest.post('/api/v1/estimate-cost', (req, res, ctx) => {
    return res(ctx.json(mockCostEstimation));
  }),
  
  rest.post('/api/v1/decompile', (req, res, ctx) => {
    return res(ctx.json({
      job_id: 'job_12345',
      status: 'queued',
      submitted_at: new Date().toISOString(),
      estimated_completion_minutes: 8,
    }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Test store setup
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      configuration: configurationReducer,
      [configurationApi.reducerPath]: configurationApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(configurationApi.middleware),
    preloadedState: initialState,
  });
};

// Test wrapper
const TestWrapper: React.FC<{ children: React.ReactNode; store?: any }> = ({
  children,
  store
}) => {
  const testStore = store || createTestStore();
  return <Provider store={testStore}>{children}</Provider>;
};

describe('AnalysisConfigurationInterface', () => {
  const mockFile = new File(['test content'], 'test.exe', {
    type: 'application/x-executable',
  });
  const mockOnJobSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should render configuration interface with file information', async () => {
      render(
        <TestWrapper>
          <AnalysisConfigurationInterface
            file={mockFile}
            onJobSubmit={mockOnJobSubmit}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      // Check file information display
      expect(screen.getByText('test.exe')).toBeInTheDocument();
      expect(screen.getByText(/12 B/)).toBeInTheDocument(); // File size

      // Check analysis depth options
      expect(screen.getByLabelText('Basic')).toBeInTheDocument();
      expect(screen.getByLabelText('Standard')).toBeInTheDocument();
      expect(screen.getByLabelText('Detailed')).toBeInTheDocument();

      // Standard should be pre-selected
      expect(screen.getByLabelText('Standard')).toBeChecked();
    });

    it('should load and display available LLM providers', async () => {
      render(
        <TestWrapper>
          <AnalysisConfigurationInterface
            file={mockFile}
            onJobSubmit={mockOnJobSubmit}
          />
        </TestWrapper>
      );

      // Expand LLM provider section
      const llmSection = screen.getByText(/LLM Translation/);
      fireEvent.click(llmSection);

      // Wait for providers to load
      await waitFor(() => {
        expect(screen.getByText('OpenAI')).toBeInTheDocument();
        expect(screen.getByText('Anthropic')).toBeInTheDocument();
      });
    });

    it('should validate form inputs correctly', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AnalysisConfigurationInterface
            file={mockFile}
            onJobSubmit={mockOnJobSubmit}
          />
        </TestWrapper>
      );

      // Try to submit without proper configuration
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      // Should be able to submit with basic configuration (no LLM provider)
      await waitFor(() => {
        expect(mockOnJobSubmit).toHaveBeenCalledWith('job_12345');
      });
    });
  });

  describe('LLM Provider Integration', () => {
    it('should handle provider selection and credential input', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AnalysisConfigurationInterface
            file={mockFile}
            onJobSubmit={mockOnJobSubmit}
          />
        </TestWrapper>
      );

      // Expand LLM provider section
      const llmSection = screen.getByText(/LLM Translation/);
      await user.click(llmSection);

      // Wait for providers to load and select one
      await waitFor(() => {
        expect(screen.getByText('OpenAI')).toBeInTheDocument();
      });

      // Select OpenAI provider
      const providerSelect = screen.getByRole('combobox', { name: /provider/i });
      await user.click(providerSelect);
      await user.click(screen.getByText('OpenAI'));

      // API key input should appear
      await waitFor(() => {
        expect(screen.getByLabelText(/api key/i)).toBeInTheDocument();
      });

      // Enter API key
      const apiKeyInput = screen.getByLabelText(/api key/i);
      await user.type(apiKeyInput, 'sk-test12345678901234567890123456789012345678901234567890');

      // Model selector should appear with options
      await waitFor(() => {
        expect(screen.getByDisplayValue('gpt-3.5-turbo')).toBeInTheDocument();
      });
    });

    it('should perform provider health checks', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AnalysisConfigurationInterface
            file={mockFile}
            onJobSubmit={mockOnJobSubmit}
          />
        </TestWrapper>
      );

      // Expand and select provider
      const llmSection = screen.getByText(/LLM Translation/);
      await user.click(llmSection);

      await waitFor(() => {
        expect(screen.getByText('OpenAI')).toBeInTheDocument();
      });

      const providerSelect = screen.getByRole('combobox', { name: /provider/i });
      await user.click(providerSelect);
      await user.click(screen.getByText('OpenAI'));

      // Health check should be triggered automatically
      await waitFor(() => {
        expect(screen.getByText(/healthy/i)).toBeInTheDocument();
      });
    });

    it('should validate API key formats correctly', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AnalysisConfigurationInterface
            file={mockFile}
            onJobSubmit={mockOnJobSubmit}
          />
        </TestWrapper>
      );

      // Setup provider selection
      const llmSection = screen.getByText(/LLM Translation/);
      await user.click(llmSection);

      await waitFor(() => {
        expect(screen.getByText('OpenAI')).toBeInTheDocument();
      });

      const providerSelect = screen.getByRole('combobox', { name: /provider/i });
      await user.click(providerSelect);
      await user.click(screen.getByText('OpenAI'));

      // Enter invalid API key
      const apiKeyInput = await screen.findByLabelText(/api key/i);
      await user.type(apiKeyInput, 'invalid-key');

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/invalid api key format/i)).toBeInTheDocument();
      });

      // Clear and enter valid API key
      await user.clear(apiKeyInput);
      await user.type(apiKeyInput, 'sk-test12345678901234567890123456789012345678901234567890');

      // Error should disappear
      await waitFor(() => {
        expect(screen.queryByText(/invalid api key format/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Cost Estimation', () => {
    it('should display cost estimation when configuration changes', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AnalysisConfigurationInterface
            file={mockFile}
            onJobSubmit={mockOnJobSubmit}
          />
        </TestWrapper>
      );

      // Should show basic cost estimation initially
      await waitFor(() => {
        expect(screen.getByText(/estimated cost/i)).toBeInTheDocument();
      });

      // Select detailed analysis
      const detailedRadio = screen.getByLabelText('Detailed');
      await user.click(detailedRadio);

      // Cost should update (with debounce)
      await waitFor(() => {
        expect(screen.getByText('$0.60')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should show cost breakdown when expanded', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AnalysisConfigurationInterface
            file={mockFile}
            onJobSubmit={mockOnJobSubmit}
          />
        </TestWrapper>
      );

      // Wait for cost estimation
      await waitFor(() => {
        expect(screen.getByText(/estimated cost/i)).toBeInTheDocument();
      });

      // Look for cost breakdown toggle
      const breakdownToggle = screen.getByRole('button', { name: /show breakdown/i });
      await user.click(breakdownToggle);

      // Should show detailed breakdown
      await waitFor(() => {
        expect(screen.getByText(/decompilation/i)).toBeInTheDocument();
        expect(screen.getByText(/llm translation/i)).toBeInTheDocument();
      });
    });
  });

  describe('Job Submission', () => {
    it('should submit job with complete configuration', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AnalysisConfigurationInterface
            file={mockFile}
            onJobSubmit={mockOnJobSubmit}
          />
        </TestWrapper>
      );

      // Configure analysis
      const detailedRadio = screen.getByLabelText('Detailed');
      await user.click(detailedRadio);

      // Add LLM provider
      const llmSection = screen.getByText(/LLM Translation/);
      await user.click(llmSection);

      await waitFor(() => {
        expect(screen.getByText('OpenAI')).toBeInTheDocument();
      });

      const providerSelect = screen.getByRole('combobox', { name: /provider/i });
      await user.click(providerSelect);
      await user.click(screen.getByText('OpenAI'));

      const apiKeyInput = await screen.findByLabelText(/api key/i);
      await user.type(apiKeyInput, 'sk-test12345678901234567890123456789012345678901234567890');

      // Submit job
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      // Should call onJobSubmit with job ID
      await waitFor(() => {
        expect(mockOnJobSubmit).toHaveBeenCalledWith('job_12345');
      });
    });

    it('should handle submission errors gracefully', async () => {
      server.use(
        rest.post('/api/v1/decompile', (req, res, ctx) => {
          return res(ctx.status(400), ctx.json({
            error: 'Invalid configuration',
            details: 'File size exceeds limit',
          }));
        })
      );

      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AnalysisConfigurationInterface
            file={mockFile}
            onJobSubmit={mockOnJobSubmit}
          />
        </TestWrapper>
      );

      // Submit job
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/invalid configuration/i)).toBeInTheDocument();
      });

      // Should not call onJobSubmit
      expect(mockOnJobSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Configuration Presets', () => {
    it('should allow saving configuration as preset', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AnalysisConfigurationInterface
            file={mockFile}
            onJobSubmit={mockOnJobSubmit}
          />
        </TestWrapper>
      );

      // Configure some settings
      const detailedRadio = screen.getByLabelText('Detailed');
      await user.click(detailedRadio);

      // Save as preset
      const savePresetButton = screen.getByRole('button', { name: /save preset/i });
      await user.click(savePresetButton);

      // Enter preset name
      const presetNameInput = screen.getByLabelText(/preset name/i);
      await user.type(presetNameInput, 'Detailed Analysis');

      const confirmSaveButton = screen.getByRole('button', { name: /confirm save/i });
      await user.click(confirmSaveButton);

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/preset saved/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle provider discovery errors', async () => {
      server.use(
        rest.get('/api/v1/llm-providers', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({
            error: 'Service unavailable',
          }));
        })
      );

      render(
        <TestWrapper>
          <AnalysisConfigurationInterface
            file={mockFile}
            onJobSubmit={mockOnJobSubmit}
          />
        </TestWrapper>
      );

      // Expand LLM section
      const llmSection = screen.getByText(/LLM Translation/);
      fireEvent.click(llmSection);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/failed to load providers/i)).toBeInTheDocument();
      });
    });

    it('should handle cost estimation errors gracefully', async () => {
      server.use(
        rest.post('/api/v1/estimate-cost', (req, res, ctx) => {
          return res(ctx.status(503), ctx.json({
            error: 'Cost estimation service unavailable',
          }));
        })
      );

      render(
        <TestWrapper>
          <AnalysisConfigurationInterface
            file={mockFile}
            onJobSubmit={mockOnJobSubmit}
          />
        </TestWrapper>
      );

      // Should show fallback estimation or error message
      await waitFor(() => {
        const estimationText = screen.queryByText(/cost estimation unavailable/i) ||
                              screen.queryByText(/estimated cost/i);
        expect(estimationText).toBeInTheDocument();
      });
    });
  });
});
```

## Performance Implementation Hints

### Optimization Strategies

**Form Performance with React Hook Form:**
```typescript
// Optimized form component with minimal re-renders
const OptimizedConfigurationForm = React.memo(({ file, providers }: ConfigurationFormProps) => {
  const { control, watch } = useFormContext<ConfigurationData>();
  
  // Watch only necessary fields to minimize re-renders
  const selectedProvider = watch('selectedProvider');
  const analysisDepth = watch('analysisDepth');
  
  // Memoize expensive computations
  const availableModels = useMemo(() => {
    if (!selectedProvider) return [];
    const provider = providers.find(p => p.id === selectedProvider);
    return provider?.supported_models || [];
  }, [selectedProvider, providers]);
  
  // Memoize provider options to prevent dropdown re-rendering
  const providerOptions = useMemo(() => {
    return providers.map(provider => ({
      value: provider.id,
      label: provider.name,
      description: provider.description,
      pricing: provider.pricing_info,
    }));
  }, [providers]);
  
  return (
    <Stack spacing={3}>
      {/* File info - static, no need to re-render */}
      <FileInfoPanel file={file} />
      
      {/* Analysis depth - memoized component */}
      <AnalysisDepthSection />
      
      {/* Provider selection - only re-render when providers change */}
      <ProviderSelectionSection
        providers={providerOptions}
        selectedProvider={selectedProvider}
        availableModels={availableModels}
      />
    </Stack>
  );
});

// Memoized sub-components to prevent unnecessary re-renders
const AnalysisDepthSection = React.memo(() => {
  const { control } = useFormContext<ConfigurationData>();
  
  return (
    <Controller
      name="analysisDepth"
      control={control}
      render={({ field }) => (
        <FormControl component="fieldset">
          <FormLabel>Analysis Depth</FormLabel>
          <RadioGroup {...field} row>
            <FormControlLabel value="basic" control={<Radio />} label="Basic" />
            <FormControlLabel value="standard" control={<Radio />} label="Standard" />
            <FormControlLabel value="detailed" control={<Radio />} label="Detailed" />
          </RadioGroup>
        </FormControl>
      )}
    />
  );
});
```

**Cost Estimation Debouncing:**
```typescript
// Intelligent cost estimation with caching and debouncing
export const useOptimizedCostEstimation = (file: File, configuration: ConfigurationData) => {
  const [estimateCost, { data, isLoading, error }] = useEstimateCostLazyQuery();
  
  // Cache for avoiding duplicate requests
  const cacheRef = useRef<Map<string, CostEstimationResponse>>(new Map());
  
  // Create cache key from configuration
  const getCacheKey = useCallback((config: ConfigurationData) => {
    return `${file.size}-${config.analysisDepth}-${config.selectedProvider || 'none'}-${config.selectedModel || 'default'}`;
  }, [file.size]);
  
  // Debounced estimation function
  const debouncedEstimate = useCallback(
    debounce((config: ConfigurationData) => {
      const cacheKey = getCacheKey(config);
      
      // Check cache first
      if (cacheRef.current.has(cacheKey)) {
        return; // Use cached result
      }
      
      // Make API request
      estimateCost({
        file_size: file.size,
        analysis_depth: config.analysisDepth,
        llm_provider: config.selectedProvider,
        llm_model: config.selectedModel,
        translation_detail: config.translationDetail,
      }).then(response => {
        // Cache the result
        if (response.data) {
          cacheRef.current.set(cacheKey, response.data);
        }
      });
    }, 500),
    [file.size, estimateCost, getCacheKey]
  );
  
  // Trigger estimation on configuration changes
  useEffect(() => {
    if (configuration.analysisDepth) {
      debouncedEstimate(configuration);
    }
  }, [configuration, debouncedEstimate]);
  
  // Get cached result if available
  const cacheKey = getCacheKey(configuration);
  const cachedResult = cacheRef.current.get(cacheKey);
  
  return {
    estimation: data || cachedResult,
    isLoading,
    error,
    isCached: !!cachedResult && !data,
  };
};
```

**RTK Query Cache Configuration:**
```typescript
// Optimized RTK Query configuration for performance
const configurationApiOptimized = createApi({
  reducerPath: 'configurationApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/v1',
  }),
  tagTypes: ['Providers', 'ProviderHealth', 'CostEstimation'],
  endpoints: (builder) => ({
    listProviders: builder.query<ProviderInfo[], void>({
      query: () => '/llm-providers',
      keepUnusedDataFor: 600, // 10 minutes - providers don't change often
      providesTags: ['Providers'],
      // Transform response to optimize for UI usage
      transformResponse: (response: ProviderInfo[]) => {
        return response.map(provider => ({
          ...provider,
          // Pre-compute frequently used values
          displayName: `${provider.name} (${provider.supported_models.length} models)`,
          costPerKToken: provider.pricing_info.input_cost_per_token * 1000,
        }));
      },
    }),
    
    estimateCost: builder.query<CostEstimationResponse, CostEstimationRequest>({
      query: (request) => ({
        url: '/estimate-cost',
        method: 'POST',
        body: request,
      }),
      keepUnusedDataFor: 300, // 5 minutes cache
      // Aggressive caching with custom serialization
      serializeQueryArgs: ({ queryArgs }) => {
        // Round file size to nearest MB for better cache hits
        const sizeMB = Math.ceil(queryArgs.file_size / (1024 * 1024));
        return `${sizeMB}MB-${queryArgs.analysis_depth}-${queryArgs.llm_provider || 'none'}`;
      },
      // Transform for UI optimization
      transformResponse: (response: CostEstimationResponse) => ({
        ...response,
        formattedCost: `$${response.total_estimated_cost.toFixed(2)}`,
        formattedTime: `${response.estimated_processing_minutes} min`,
      }),
    }),
  }),
});
```

## Code Quality and Standards

### TypeScript Integration

**Comprehensive Type Definitions:**
```typescript
// Configuration.types.ts - Complete type system
export interface ConfigurationData {
  analysisDepth: 'basic' | 'standard' | 'detailed';
  selectedProvider?: string;
  selectedModel?: string;
  translationDetail?: 'basic' | 'detailed';
  customParameters?: Record<string, unknown>;
}

export interface ProviderInfo {
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
  status?: 'available' | 'degraded' | 'unavailable';
}

export interface CostEstimationRequest {
  file_size: number;
  file_type?: string;
  analysis_depth: 'basic' | 'standard' | 'detailed';
  llm_provider?: string;
  llm_model?: string;
  translation_detail?: 'basic' | 'detailed';
}

export interface CostEstimationResponse {
  decompilation_cost: number;
  llm_translation_cost?: number;
  total_estimated_cost: number;
  estimated_processing_minutes: number;
  currency: string;
  confidence: 'high' | 'medium' | 'low';
  breakdown: {
    base_analysis: number;
    llm_tokens_estimated?: number;
    provider_markup?: number;
  };
}

export interface JobSubmissionRequest {
  file: File;
  configuration: ConfigurationData;
  credentials: Record<string, string>;
}

export interface JobSubmissionResponse {
  job_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  submitted_at: string;
  estimated_completion_minutes: number;
  configuration_snapshot: ConfigurationData;
}

export interface ProviderHealthResponse {
  provider_id: string;
  status: 'healthy' | 'degraded' | 'unavailable';
  response_time_ms: number;
  tested_at: string;
  capabilities_verified: string[];
  error_message?: string;
}

export interface ConfigurationPreset {
  id: string;
  name: string;
  description?: string;
  configuration: ConfigurationData;
  createdAt: string;
  lastUsed?: string;
  usageCount: number;
}

// Form validation schema types
export interface ValidationSchema {
  analysisDepth: yup.StringSchema;
  selectedProvider: yup.StringSchema;
  selectedModel: yup.StringSchema;
  translationDetail: yup.StringSchema;
}

// Component prop interfaces
export interface AnalysisConfigurationInterfaceProps {
  file: File;
  onJobSubmit: (jobId: string) => void;
  onCancel?: () => void;
  initialConfiguration?: Partial<ConfigurationData>;
}

export interface ConfigurationFormProps {
  file: File;
  availableProviders: ProviderInfo[];
  isLoadingProviders: boolean;
}

export interface CostEstimationPanelProps {
  estimation?: CostEstimationResponse;
  isCalculating: boolean;
  fileSize: number;
  showBreakdown?: boolean;
  onToggleBreakdown?: () => void;
}

// Hook return types
export interface UseConfigurationFormReturn {
  form: UseFormReturn<ConfigurationData>;
  isValid: boolean;
  isDirty: boolean;
  errors: FieldErrors<ConfigurationData>;
  reset: () => void;
  submit: (data: ConfigurationData) => Promise<void>;
}

export interface UseCostEstimationReturn {
  estimation?: CostEstimationResponse;
  isLoading: boolean;
  error?: string;
  isCached: boolean;
  refresh: () => void;
}

export interface UseCredentialManagementReturn {
  credentials: Record<string, string>;
  storeCredential: (providerId: string, apiKey: string) => Promise<void>;
  validateCredentials: (providerId: string, apiKey: string) => Promise<boolean>;
  clearCredential: (providerId: string) => void;
  clearAllCredentials: () => void;
}

// Redux state types
export interface ConfigurationState {
  currentConfiguration: Partial<ConfigurationData>;
  presets: Record<string, ConfigurationPreset>;
  providers: {
    available: ProviderInfo[];
    selected?: string;
    health: Record<string, ProviderHealthResponse>;
    lastRefresh?: string;
  };
  credentials: {
    byProvider: Record<string, string>;
    lastValidated: Record<string, string>;
    validationStatus: Record<string, boolean>;
  };
  estimation: {
    current?: CostEstimationResponse;
    isCalculating: boolean;
    history: CostEstimationResponse[];
    lastCalculated?: string;
  };
  submission: {
    isSubmitting: boolean;
    lastSubmittedJobId?: string;
    error?: string;
  };
  ui: {
    activeSection: 'basic' | 'advanced' | 'presets';
    showCostBreakdown: boolean;
    expandedSections: string[];
  };
}
```

### Validation Schema Implementation

**Comprehensive Form Validation:**
```typescript
import * as yup from 'yup';

export const configurationValidationSchema = yup.object({
  analysisDepth: yup
    .string()
    .oneOf(['basic', 'standard', 'detailed'], 'Invalid analysis depth')
    .required('Analysis depth is required'),
  
  selectedProvider: yup
    .string()
    .optional()
    .when('$requireProvider', {
      is: true,
      then: yup.string().required('LLM provider is required'),
    }),
  
  selectedModel: yup
    .string()
    .optional()
    .when('selectedProvider', {
      is: (provider: string) => Boolean(provider),
      then: yup.string().required('Model selection is required when provider is selected'),
    }),
  
  translationDetail: yup
    .string()
    .oneOf(['basic', 'detailed'], 'Invalid translation detail level')
    .default('basic')
    .when('selectedProvider', {
      is: (provider: string) => Boolean(provider),
      then: yup.string().required('Translation detail is required when provider is selected'),
    }),
  
  customParameters: yup
    .object()
    .optional()
    .test('valid-json', 'Custom parameters must be valid JSON', function(value) {
      if (!value) return true;
      
      try {
        JSON.stringify(value);
        return true;
      } catch {
        return this.createError({
          message: 'Invalid JSON format in custom parameters',
        });
      }
    })
    .test('parameter-limits', 'Too many custom parameters', function(value) {
      if (!value) return true;
      
      const paramCount = Object.keys(value).length;
      if (paramCount > 20) {
        return this.createError({
          message: 'Maximum 20 custom parameters allowed',
        });
      }
      
      return true;
    }),
});

// Provider-specific validation
export const createProviderValidationSchema = (providers: ProviderInfo[]) => {
  const providerIds = providers.map(p => p.id);
  
  return configurationValidationSchema.concat(
    yup.object({
      selectedProvider: yup
        .string()
        .optional()
        .oneOf([...providerIds, undefined], 'Invalid provider selection'),
      
      selectedModel: yup
        .string()
        .optional()
        .test('valid-model', 'Invalid model for selected provider', function(value) {
          const { selectedProvider } = this.parent;
          
          if (!selectedProvider || !value) return true;
          
          const provider = providers.find(p => p.id === selectedProvider);
          if (!provider) return false;
          
          return provider.supported_models.includes(value);
        }),
    })
  );
};

// API key validation schemas
export const apiKeyValidationSchemas = {
  openai: yup
    .string()
    .matches(/^sk-[A-Za-z0-9]{48}$/, 'Invalid OpenAI API key format')
    .required('OpenAI API key is required'),
  
  anthropic: yup
    .string()
    .matches(/^sk-ant-api[0-9]{2}-[A-Za-z0-9_-]{95}$/, 'Invalid Anthropic API key format')
    .required('Anthropic API key is required'),
  
  google: yup
    .string()
    .matches(/^[A-Za-z0-9_-]{39}$/, 'Invalid Google API key format')
    .required('Google API key is required'),
  
  generic: yup
    .string()
    .min(10, 'API key must be at least 10 characters')
    .max(200, 'API key must be less than 200 characters')
    .required('API key is required'),
};

export const createApiKeyValidationSchema = (providerId?: string) => {
  if (!providerId) return apiKeyValidationSchemas.generic;
  
  return apiKeyValidationSchemas[providerId as keyof typeof apiKeyValidationSchemas] || 
         apiKeyValidationSchemas.generic;
};
```

---

## Implementation Summary

This Technical Implementation Document provides comprehensive guidance for implementing the Analysis Configuration Interface feature with the following key characteristics:

**Architectural Foundation:**
- Feature-based directory structure with co-located components and utilities
- Hybrid state management combining React Hook Form for ephemeral state with Redux for persistent data
- RTK Query integration for provider discovery, health monitoring, and cost estimation
- Material-UI components with consistent theming and accessibility compliance

**Key Implementation Patterns:**
- Container/Presentational component architecture with clear separation of concerns
- Custom hooks for complex business logic extraction and reusability
- Comprehensive error handling with user-friendly messages and automatic recovery
- Performance optimization through memoization, debouncing, and intelligent caching

**Security and Quality:**
- Session-based credential management with automatic cleanup and format validation
- Comprehensive TypeScript integration with strict typing and validation schemas
- Extensive testing strategy covering unit, integration, and end-to-end scenarios
- Performance monitoring and optimization for large files and multiple providers

This implementation approach ensures the Analysis Configuration Interface meets all requirements from the PRD while following the established architectural patterns from the ADR, providing a solid foundation for the subsequent task generation phase.

---

**Document Version:** 1.0  
**Last Updated:** 2025-08-31  
**Next Phase:** Task List Generation (006_generate-tasks.md)  
**Implementation Readiness:** Complete - Ready for task breakdown