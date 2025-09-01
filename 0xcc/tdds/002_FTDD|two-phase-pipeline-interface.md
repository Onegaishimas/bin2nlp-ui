# Technical Design Document: Analysis Configuration Interface

**Date:** 2025-08-31  
**Project:** bin2nlp-frontend  
**Feature:** Analysis Configuration Interface  
**Document ID:** 002_FTDD|two-phase-pipeline-interface  
**Related PRD:** 002_FPRD|two-phase-pipeline-interface.md

## Executive Summary

The Analysis Configuration Interface provides a streamlined configuration panel for binary analysis settings and LLM provider selection that integrates directly with job submission. The technical approach leverages React 18 functional components with Material-UI for the interface, React Hook Form for configuration management, and RTK Query for provider discovery and job submission. The system emphasizes simplicity through direct job submission workflow while maintaining professional user experience.

**Key Technical Decisions:**
- Single comprehensive AnalysisConfigurationInterface component with focused sub-components
- Form-centric state management with React Hook Form for configuration data
- RTK Query integration for LLM provider discovery and job submission
- Session-based credential management for user API keys
- Direct integration with unified `/api/v1/decompile` endpoint

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│           AnalysisConfigurationInterface                   │
│  ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐  │
│  │ ConfigurationF  │ │ CostEstimation  │ │ ProviderHealth│  │
│  │     orm         │ │     Panel       │ │    Panel      │  │
│  └─────────────────┘ └─────────────────┘ └───────────────┘  │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                Redux Toolkit Store                          │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │               configurationSlice                        │ │
│  │  • Form state management                                │ │
│  │  • Provider discovery results                           │ │
│  │  • User credential storage (session)                    │ │
│  │  • Cost estimation cache                                │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                  RTK Query API                          │ │
│  │  • Provider discovery                                   │ │
│  │  • Provider health checks                               │ │
│  │  • Job submission                                       │ │
│  │  • Cost estimation                                      │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                Browser Storage Layer                        │
│  ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐  │
│  │   localStorage  │ │  sessionStorage │ │   Memory      │  │
│  │  Config Presets │ │  User Creds     │ │  Form State   │  │
│  └─────────────────┘ └─────────────────┘ └───────────────┘  │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    bin2nlp Job API                          │
│  • POST /api/v1/decompile - Submit analysis job            │
│  • GET /api/v1/llm-providers - List LLM providers          │
│  • GET /api/v1/llm-providers/{id} - Provider details       │
│  • POST /api/v1/llm-providers/{id}/health-check - Test     │
└─────────────────────────────────────────────────────────────┘
```

### Component Relationships and Data Flow

**Configuration Flow:**
1. User interacts with ConfigurationForm → React Hook Form manages state
2. Provider selection triggers → RTK Query fetches provider details
3. API key input → Session-based storage with validation
4. Configuration changes → Real-time cost estimation updates
5. Form validation → Submit button enable/disable

**Submission Flow:**
1. User submits form → Form validation runs
2. Valid configuration → FormData created with file + config
3. FormData submitted to POST /api/v1/decompile → job created
4. Job response received → Navigation to job tracking
5. Credentials stored securely → Session-based persistence

**Provider Integration Flow:**
1. Component mount → Provider discovery API called
2. Provider selection → Provider details fetched
3. Health check triggered → Provider connectivity tested
4. Cost estimation → Real-time pricing calculation
5. Provider status → UI updates with health indicators

### Integration Points

- **Job Management Integration:** Configuration submission creates new analysis job
- **Results Platform Integration:** Job completion triggers results viewer access
- **Provider Discovery:** Real-time provider availability and capability discovery
- **Cost Estimation:** Dynamic pricing calculation based on configuration

## Technical Stack

### Core Technologies

**Frontend Framework:**
- **React 18.2+** with functional components and hooks
- **TypeScript 5.1+** in strict mode for type safety
- **Vite 4.0+** for development and build tooling

**UI Framework:**
- **Material-UI (MUI) v5.14+** for consistent component design
- **@mui/icons-material** for configuration interface icons
- **@mui/lab** for advanced form components

**Form Management:**
- **React Hook Form 7.45+** for efficient form state management
- **@hookform/resolvers** for schema validation integration
- **Yup 1.0+** for comprehensive validation schemas

**State Management:**
- **Redux Toolkit 1.9+** for application state management
- **RTK Query** for API state management and caching
- **react-redux 8.1+** for React-Redux integration

**Configuration Processing:**
- **Web Crypto API** for secure credential handling
- **FormData API** for multipart job submission
- **date-fns** for cost estimation and timing calculations

### Supporting Libraries

**Configuration Management:**
- **lodash/debounce** for efficient cost estimation updates
- **uuid** for client-side preset ID generation
- **js-cookie** for secure session-based credential storage

**Development and Testing:**
- **TypeScript strict mode** for compile-time validation
- **Manual testing** for component validation
- **MSW (Mock Service Worker)** for API mocking in tests

### Justification for Technology Choices

**React Hook Form Selection:** Provides efficient form state management with minimal re-renders, built-in validation support, and excellent TypeScript integration for complex configuration forms.

**RTK Query Choice:** Essential for provider discovery, health checking, and job submission with built-in caching, error handling, and request deduplication.

**Material-UI Integration:** Provides professional enterprise-ready components with excellent form support, consistent theming, and accessibility compliance.

**Session-based Storage:** Balances security (credentials never persist) with user experience (configuration presets retained across sessions).

## Data Design

### Redux State Schema

```typescript
// Consolidated Application Store Structure - Configuration Context
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
    details: Record<string, LLMProviderDetails>; // Cached provider details
    models: Record<string, string[]>;         // Provider ID -> available models
  };
  
  // UI slice - Application UI state (Configuration-focused)
  ui: {
    currentView: 'submission' | 'tracking' | 'results'; // Main application view
    selectedJobId: string | null;            // Job selected for viewing
    configurationTab: 'basic' | 'advanced' | 'presets'; // Configuration tab
    showCostBreakdown: boolean;               // Cost estimation visibility
    formState: {
      analysisDepth: 'basic' | 'standard' | 'detailed';
      selectedProvider?: string;
      selectedModel?: string;
      translationDetail?: 'basic' | 'detailed';
      isValid: boolean;
      isDirty: boolean;
    };
    costEstimation: {
      current?: CostEstimation;
      isCalculating: boolean;
      history: CostEstimation[];
    };
  };
}

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

interface ConfigurationPreset {
  id: string;
  name: string;
  description?: string;
  configuration: {
    analysisDepth: 'basic' | 'standard' | 'detailed';
    llmProvider?: string;
    llmModel?: string;
    translationDetail?: 'basic' | 'detailed';
  };
  createdAt: string;
  lastUsed?: string;
  usageCount: number;
}

interface CostEstimation {
  id: string;
  fileSize: number;
  configuration: ConfigurationSnapshot;
  estimatedCosts: {
    decompilation: number;
    llmTranslation?: number;
    total: number;
    currency: string;
  };
  estimatedTime: {
    decompilation: number;
    llmTranslation?: number;
    total: number;
    unit: 'minutes';
  };
  confidence: 'high' | 'medium' | 'low';
  calculatedAt: string;
}
```

### Browser Storage Design

**localStorage Schema:**
```typescript
interface StoredConfigurationPresets {
  version: string;
  presets: Record<string, ConfigurationPreset>;
  settings: {
    maxPresets: number;
    defaultPreset?: string;
    autoSaveEnabled: boolean;
  };
  lastCleaned: string;
}
```

**sessionStorage Schema:**
```typescript
interface SessionCredentials {
  version: string;
  credentials: Record<string, {
    providerId: string;
    encryptedApiKey: string;
    lastValidated: string;
    isValid: boolean;
  }>;
  selectedProvider?: string;
  autoExpiry: number; // timestamp
}
```

### Data Validation Strategy

**Configuration Validation:**
```typescript
const configurationSchema = yup.object({
  analysisDepth: yup
    .string()
    .oneOf(['basic', 'standard', 'detailed'])
    .required('Analysis depth is required'),
  
  selectedProvider: yup
    .string()
    .when('enableLLMTranslation', {
      is: true,
      then: yup.string().required('LLM provider is required for translation'),
    }),
  
  selectedModel: yup
    .string()
    .when('selectedProvider', {
      is: (provider) => Boolean(provider),
      then: yup.string().required('Model selection is required'),
    }),
  
  translationDetail: yup
    .string()
    .oneOf(['basic', 'detailed'])
    .default('basic'),
  
  customParameters: yup
    .object()
    .test('valid-json', 'Invalid JSON parameters', (value) => {
      if (!value) return true;
      try {
        JSON.stringify(value);
        return true;
      } catch {
        return false;
      }
    }),
});
```

**State Consistency:**
- All configuration updates through React Hook Form with validation
- Provider data cached with TTL for freshness
- Credentials validated before job submission
- Cost estimates recalculated on configuration changes

## API Design

### RTK Query Endpoint Design

```typescript
const configurationApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Provider discovery and management
    listLLMProviders: builder.query<LLMProviderInfo[], void>({
      query: () => '/api/v1/llm-providers',
      keepUnusedDataFor: 300, // 5 minutes
      providesTags: ['LLMProviders'],
    }),

    getProviderDetails: builder.query<LLMProviderDetails, string>({
      query: (providerId) => `/api/v1/llm-providers/${providerId}`,
      keepUnusedDataFor: 600, // 10 minutes
      providesTags: (result, error, providerId) => [
        { type: 'LLMProviderDetails', id: providerId }
      ],
    }),

    checkProviderHealth: builder.mutation<ProviderHealthResponse, {
      providerId: string;
      apiKey?: string;
    }>({
      query: ({ providerId, apiKey }) => ({
        url: `/api/v1/llm-providers/${providerId}/health-check`,
        method: 'POST',
        body: apiKey ? { api_key: apiKey } : {},
      }),
      invalidatesTags: (result, error, { providerId }) => [
        { type: 'ProviderHealth', id: providerId }
      ],
    }),

    // Job submission with configuration
    submitAnalysisJob: builder.mutation<JobSubmissionResponse, JobSubmissionData>({
      query: (jobData) => {
        const formData = new FormData();
        formData.append('file', jobData.file);
        formData.append('analysis_depth', jobData.analysisDepth);
        
        if (jobData.llmProvider) {
          formData.append('llm_provider', jobData.llmProvider);
          formData.append('llm_api_key', jobData.llmApiKey);
          
          if (jobData.llmModel) {
            formData.append('llm_model', jobData.llmModel);
          }
          
          if (jobData.translationDetail) {
            formData.append('translation_detail', jobData.translationDetail);
          }
        }
        
        return {
          url: '/api/v1/decompile',
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: ['ActiveJobs'],
    }),

    // Cost estimation
    estimateAnalysisCost: builder.query<CostEstimation, CostEstimationRequest>({
      query: (request) => ({
        url: '/api/v1/estimate-cost',
        method: 'POST',
        body: request,
      }),
      keepUnusedDataFor: 180, // 3 minutes
      serializeQueryArgs: ({ queryArgs }) => {
        // Custom serialization for cost estimation caching
        return `${queryArgs.fileSize}-${queryArgs.analysisDepth}-${queryArgs.llmProvider || 'none'}`;
      },
    }),
  }),
});
```

### Request/Response Schemas

**Job Submission Request:**
```typescript
interface JobSubmissionData {
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
  configuration_snapshot: ConfigurationSnapshot;
}
```

**Provider Health Check:**
```typescript
interface ProviderHealthResponse {
  provider_id: string;
  status: 'healthy' | 'degraded' | 'unavailable';
  response_time_ms: number;
  tested_at: string;
  capabilities_verified: string[];
  error_message?: string;
}
```

**Cost Estimation:**
```typescript
interface CostEstimationRequest {
  file_size: number;
  analysis_depth: 'basic' | 'standard' | 'detailed';
  llm_provider?: string;
  llm_model?: string;
  translation_detail?: 'basic' | 'detailed';
}

interface CostEstimationResponse {
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
```

### Error Handling Strategy

**API Error Classification:**
```typescript
enum ConfigurationAPIError {
  NETWORK_ERROR = 'network_error',
  VALIDATION_ERROR = 'validation_error',
  PROVIDER_ERROR = 'provider_error',
  AUTH_ERROR = 'auth_error',
  QUOTA_ERROR = 'quota_error',
  SERVER_ERROR = 'server_error'
}

const handleConfigurationError = (error: any): ConfigurationAPIError => {
  if (error.status === 400) return ConfigurationAPIError.VALIDATION_ERROR;
  if (error.status === 401) return ConfigurationAPIError.AUTH_ERROR;
  if (error.status === 402) return ConfigurationAPIError.QUOTA_ERROR;
  if (error.status === 403) return ConfigurationAPIError.PROVIDER_ERROR;
  if (error.status >= 500) return ConfigurationAPIError.SERVER_ERROR;
  if (!navigator.onLine) return ConfigurationAPIError.NETWORK_ERROR;
  return ConfigurationAPIError.SERVER_ERROR;
};
```

**Retry Strategy:**
- Provider discovery errors: 2 retries with exponential backoff
- Health check errors: 1 retry with 2-second delay
- Job submission errors: No automatic retry (user action required)
- Cost estimation errors: 3 retries with 1-second delay

## Component Architecture

### Component Hierarchy

```typescript
// Unified Application Architecture - Configuration Focus
App/
└── AnalysisManager/             // Main container for all analysis features
    ├── JobSubmission/           // Job submission and configuration (PRIMARY)
    │   ├── FileUploadZone      // Drag-drop file interface
    │   ├── AnalysisConfigPanel // Analysis depth, parameters (MAIN FOCUS)
    │   │   ├── AnalysisDepthSelector    // Analysis depth options
    │   │   ├── AdvancedOptionsPanel     // Advanced configuration
    │   │   ├── ConfigurationPreview     // Settings summary
    │   │   └── SubmissionSection        // Form submission
    │   └── LLMProviderSelector // Provider selection + credentials
    │       ├── ProviderSelector         // Provider dropdown
    │       ├── ModelSelector            // Model selection  
    │       ├── CredentialInput          // API key input
    │       └── CostEstimationPanel      // Cost and time estimation
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
    ├── ProviderManagement/     // LLM provider configuration (SECONDARY FOCUS)
    │   ├── ProviderDiscovery   // Available providers list
    │   ├── CredentialInput     // Secure API key input
    │   └── HealthMonitoring    // Provider status monitoring
    └── SystemStatus/           // System health and information
        ├── HealthIndicator     // Overall system status
        └── SystemInfo          // System capabilities and info
```

### Component Design Patterns

**AnalysisConfigurationInterface (Container Component):**
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
  const dispatch = useAppDispatch();
  const { providers, estimation, credentials } = useAppSelector(
    state => state.configuration
  );

  // React Hook Form setup
  const form = useForm<ConfigurationData>({
    resolver: yupResolver(configurationSchema),
    defaultValues: {
      analysisDepth: 'standard',
      ...initialConfiguration,
    },
    mode: 'onChange',
  });

  // RTK Query hooks
  const { data: providerList } = useListLLMProvidersQuery();
  const [submitJob, { isLoading: isSubmitting }] = useSubmitAnalysisJobMutation();
  const [checkHealth] = useCheckProviderHealthMutation();

  // Cost estimation with debouncing
  const debouncedCostEstimation = useCallback(
    debounce((config: ConfigurationData) => {
      dispatch(requestCostEstimation({ file, configuration: config }));
    }, 500),
    [file, dispatch]
  );

  // Watch form changes for cost estimation
  const watchedValues = form.watch();
  useEffect(() => {
    if (form.formState.isValid) {
      debouncedCostEstimation(watchedValues);
    }
  }, [watchedValues, form.formState.isValid, debouncedCostEstimation]);

  const handleSubmit = useCallback(async (data: ConfigurationData) => {
    try {
      const result = await submitJob({
        file,
        analysisDepth: data.analysisDepth,
        llmProvider: data.selectedProvider,
        llmApiKey: data.selectedProvider ? credentials.byProvider[data.selectedProvider] : undefined,
        llmModel: data.selectedModel,
        translationDetail: data.translationDetail,
      }).unwrap();
      
      onJobSubmit(result.job_id);
    } catch (error) {
      form.setError('root', {
        type: 'submission',
        message: getErrorMessage(error),
      });
    }
  }, [file, credentials.byProvider, submitJob, onJobSubmit]);

  return (
    <Card sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        Configure Analysis Job
      </Typography>
      
      <FormProvider {...form}>
        <Box component="form" onSubmit={form.handleSubmit(handleSubmit)}>
          <ConfigurationForm 
            file={file}
            providers={providerList || []}
            onHealthCheck={checkHealth}
          />
          
          <CostEstimationPanel 
            estimation={estimation.current}
            isCalculating={estimation.isCalculating}
          />
          
          <SubmissionSection
            isSubmitting={isSubmitting}
            isValid={form.formState.isValid}
            onCancel={onCancel}
          />
        </Box>
      </FormProvider>
    </Card>
  );
};
```

**ConfigurationForm (Presentation Component):**
```typescript
interface ConfigurationFormProps {
  file: File;
  providers: LLMProviderInfo[];
  onHealthCheck: (providerId: string) => Promise<ProviderHealthResponse>;
}

const ConfigurationForm: React.FC<ConfigurationFormProps> = ({
  file,
  providers,
  onHealthCheck
}) => {
  const { control, watch, setValue } = useFormContext<ConfigurationData>();
  const selectedProvider = watch('selectedProvider');
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Provider-specific models
  const availableModels = useMemo(() => {
    const provider = providers.find(p => p.id === selectedProvider);
    return provider?.supported_models || [];
  }, [providers, selectedProvider]);
  
  // Auto-select first model when provider changes
  useEffect(() => {
    if (selectedProvider && availableModels.length > 0) {
      setValue('selectedModel', availableModels[0]);
    }
  }, [selectedProvider, availableModels, setValue]);

  return (
    <Stack spacing={3}>
      {/* File Information */}
      <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
        <Typography variant="subtitle2" gutterBottom>
          File Information
        </Typography>
        <Typography variant="body2">
          <strong>Name:</strong> {file.name}
        </Typography>
        <Typography variant="body2">
          <strong>Size:</strong> {formatFileSize(file.size)}
        </Typography>
        <Typography variant="body2">
          <strong>Type:</strong> {file.type || 'Unknown'}
        </Typography>
      </Paper>

      {/* Analysis Depth Selection */}
      <Controller
        name="analysisDepth"
        control={control}
        render={({ field, fieldState }) => (
          <FormControl fullWidth error={!!fieldState.error}>
            <FormLabel component="legend">Analysis Depth</FormLabel>
            <RadioGroup {...field} row>
              <FormControlLabel value="basic" control={<Radio />} label="Basic" />
              <FormControlLabel value="standard" control={<Radio />} label="Standard" />
              <FormControlLabel value="detailed" control={<Radio />} label="Detailed" />
            </RadioGroup>
            {fieldState.error && (
              <FormHelperText>{fieldState.error.message}</FormHelperText>
            )}
          </FormControl>
        )}
      />

      {/* LLM Provider Section */}
      <Accordion expanded={showAdvanced || !!selectedProvider}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <Typography variant="h6">LLM Translation (Optional)</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <LLMProviderSection
              providers={providers}
              onHealthCheck={onHealthCheck}
            />
          </Stack>
        </AccordionDetails>
      </Accordion>
    </Stack>
  );
};
```

### Reusability Patterns

**Custom Hooks for Configuration Management:**
```typescript
// Form validation with provider-specific rules
export const useConfigurationValidation = (providers: LLMProviderInfo[]) => {
  return useMemo(() => {
    return yup.object({
      analysisDepth: yup.string().oneOf(['basic', 'standard', 'detailed']).required(),
      selectedProvider: yup.string().optional(),
      selectedModel: yup.string().when('selectedProvider', {
        is: (provider) => Boolean(provider),
        then: yup.string().required('Model is required when provider is selected'),
      }),
      translationDetail: yup.string().oneOf(['basic', 'detailed']).default('basic'),
    });
  }, [providers]);
};

// Cost estimation with caching
export const useCostEstimation = (file: File, configuration: ConfigurationData) => {
  const [estimateCost, { data: estimation, isLoading }] = useEstimateAnalysisCostLazyQuery();
  
  const debouncedEstimate = useCallback(
    debounce((config: ConfigurationData) => {
      estimateCost({
        file_size: file.size,
        analysis_depth: config.analysisDepth,
        llm_provider: config.selectedProvider,
        llm_model: config.selectedModel,
        translation_detail: config.translationDetail,
      });
    }, 500),
    [file.size, estimateCost]
  );
  
  useEffect(() => {
    debouncedEstimate(configuration);
  }, [configuration, debouncedEstimate]);
  
  return { estimation, isLoading };
};

// Credential management with session storage
export const useCredentialManagement = () => {
  const dispatch = useAppDispatch();
  const credentials = useAppSelector(state => state.configuration.credentials);
  
  const storeCredential = useCallback((providerId: string, apiKey: string) => {
    dispatch(storeProviderCredential({ providerId, apiKey }));
  }, [dispatch]);
  
  const clearCredential = useCallback((providerId: string) => {
    dispatch(clearProviderCredential({ providerId }));
  }, [dispatch]);
  
  const validateCredential = useCallback(async (providerId: string, apiKey: string) => {
    // Implement credential validation logic
    return true; // simplified
  }, []);
  
  return {
    credentials: credentials.byProvider,
    storeCredential,
    clearCredential,
    validateCredential,
  };
};
```

## State Management

### Redux Slice Organization

```typescript
const configurationSlice = createSlice({
  name: 'configuration',
  initialState,
  reducers: {
    // Form state management
    updateFormField: (state, action: PayloadAction<{
      field: keyof ConfigurationData;
      value: any;
    }>) => {
      const { field, value } = action.payload;
      state.form[field] = value;
      state.form.isDirty = true;
    },

    setFormValidation: (state, action: PayloadAction<{
      isValid: boolean;
      errors: Record<string, string>;
    }>) => {
      state.form.isValid = action.payload.isValid;
      // Handle form errors
    },

    // Provider management
    setProviders: (state, action: PayloadAction<LLMProviderInfo[]>) => {
      state.providers.available = action.payload;
      state.providers.lastUpdated = new Date().toISOString();
    },

    updateProviderHealth: (state, action: PayloadAction<{
      providerId: string;
      health: ProviderHealthStatus;
    }>) => {
      const { providerId, health } = action.payload;
      state.providers.health[providerId] = health;
    },

    // Cost estimation
    setCostEstimation: (state, action: PayloadAction<CostEstimation>) => {
      state.estimation.current = action.payload;
      state.estimation.isCalculating = false;
      state.estimation.lastCalculated = new Date().toISOString();
      
      // Add to history
      state.estimation.history.unshift(action.payload);
      // Keep only last 5 estimates
      state.estimation.history = state.estimation.history.slice(0, 5);
    },

    startCostCalculation: (state) => {
      state.estimation.isCalculating = true;
    },

    // Credential management (session-only)
    storeProviderCredential: (state, action: PayloadAction<{
      providerId: string;
      apiKey: string;
    }>) => {
      const { providerId, apiKey } = action.payload;
      state.credentials.byProvider[providerId] = apiKey;
      state.credentials.lastUsed[providerId] = new Date().toISOString();
      
      // Store in sessionStorage with encryption
      const sessionData = {
        version: '1.0',
        credentials: {
          [providerId]: {
            providerId,
            encryptedApiKey: btoa(apiKey), // Simple base64 encoding
            lastValidated: new Date().toISOString(),
            isValid: true,
          }
        },
        autoExpiry: Date.now() + (2 * 60 * 60 * 1000), // 2 hours
      };
      
      sessionStorage.setItem('bin2nlp_config_credentials', JSON.stringify(sessionData));
    },

    clearProviderCredential: (state, action: PayloadAction<{ providerId: string }>) => {
      const { providerId } = action.payload;
      delete state.credentials.byProvider[providerId];
      delete state.credentials.lastUsed[providerId];
      
      // Update sessionStorage
      const stored = sessionStorage.getItem('bin2nlp_config_credentials');
      if (stored) {
        try {
          const sessionData = JSON.parse(stored);
          delete sessionData.credentials[providerId];
          sessionStorage.setItem('bin2nlp_config_credentials', JSON.stringify(sessionData));
        } catch (error) {
          // Clear corrupted data
          sessionStorage.removeItem('bin2nlp_config_credentials');
        }
      }
    },

    // Preset management
    saveConfigurationPreset: (state, action: PayloadAction<{
      name: string;
      configuration: ConfigurationData;
    }>) => {
      const { name, configuration } = action.payload;
      const presetId = generateUUID();
      
      const preset: ConfigurationPreset = {
        id: presetId,
        name,
        configuration: {
          analysisDepth: configuration.analysisDepth,
          llmProvider: configuration.selectedProvider,
          llmModel: configuration.selectedModel,
          translationDetail: configuration.translationDetail,
        },
        createdAt: new Date().toISOString(),
        usageCount: 0,
      };
      
      state.presets.saved[presetId] = preset;
      
      // Persist to localStorage
      const presetData = {
        version: '1.0',
        presets: state.presets.saved,
        settings: {
          maxPresets: 20,
          autoSaveEnabled: true,
        },
        lastCleaned: new Date().toISOString(),
      };
      
      localStorage.setItem('bin2nlp_config_presets', JSON.stringify(presetData));
    },

    loadConfigurationPreset: (state, action: PayloadAction<{ presetId: string }>) => {
      const { presetId } = action.payload;
      const preset = state.presets.saved[presetId];
      
      if (preset) {
        // Update form with preset configuration
        state.form.analysisDepth = preset.configuration.analysisDepth;
        state.form.selectedProvider = preset.configuration.llmProvider;
        state.form.selectedModel = preset.configuration.llmModel;
        state.form.translationDetail = preset.configuration.translationDetail;
        
        // Update usage statistics
        preset.usageCount += 1;
        preset.lastUsed = new Date().toISOString();
        
        state.presets.active = presetId;
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
    },

    failJobSubmission: (state, action: PayloadAction<{ error: string }>) => {
      state.submission.isSubmitting = false;
      state.submission.error = action.payload.error;
    },

    // UI state management
    setActiveTab: (state, action: PayloadAction<'basic' | 'advanced' | 'presets'>) => {
      state.ui.activeTab = action.payload;
    },

    toggleCostBreakdown: (state) => {
      state.ui.showCostBreakdown = !state.ui.showCostBreakdown;
    },

    setValidationMode: (state, action: PayloadAction<'realtime' | 'onSubmit'>) => {
      state.ui.validationMode = action.payload;
    },
  },
});
```

### Integration with React Hook Form

```typescript
// Custom hook integrating Redux with React Hook Form
export const useConfigurationForm = (initialConfig?: Partial<ConfigurationData>) => {
  const dispatch = useAppDispatch();
  const reduxState = useAppSelector(state => state.configuration);
  
  const form = useForm<ConfigurationData>({
    resolver: yupResolver(configurationSchema),
    defaultValues: {
      analysisDepth: 'standard',
      translationDetail: 'basic',
      ...initialConfig,
    },
    mode: 'onChange',
  });
  
  // Sync form changes with Redux
  const watchedValues = form.watch();
  useEffect(() => {
    // Update Redux state when form changes
    Object.entries(watchedValues).forEach(([field, value]) => {
      dispatch(updateFormField({ field: field as keyof ConfigurationData, value }));
    });
  }, [watchedValues, dispatch]);
  
  // Sync validation state with Redux
  useEffect(() => {
    dispatch(setFormValidation({
      isValid: form.formState.isValid,
      errors: form.formState.errors,
    }));
  }, [form.formState.isValid, form.formState.errors, dispatch]);
  
  return {
    form,
    reduxState,
    dispatch,
  };
};
```

## Security Considerations

### Credential Security

**Session-only Storage with Encryption:**
```typescript
const credentialSecurity = {
  encrypt: (apiKey: string): string => {
    // Simple base64 encoding (use proper encryption in production)
    return btoa(apiKey);
  },
  
  decrypt: (encrypted: string): string => {
    try {
      return atob(encrypted);
    } catch {
      throw new Error('Invalid credential format');
    }
  },
  
  validateApiKey: (providerId: string, apiKey: string): boolean => {
    const patterns = {
      openai: /^sk-[A-Za-z0-9]{48}$/,
      anthropic: /^sk-ant-api[0-9]{2}-[A-Za-z0-9_-]{95}$/,
      // Add more provider patterns
    };
    
    const pattern = patterns[providerId];
    return pattern ? pattern.test(apiKey) : apiKey.length > 0;
  },
  
  // Automatic cleanup on session end
  setupAutoCleanup: () => {
    window.addEventListener('beforeunload', () => {
      sessionStorage.removeItem('bin2nlp_config_credentials');
    });
    
    // Cleanup after 2 hours of inactivity
    const cleanup = () => {
      const stored = sessionStorage.getItem('bin2nlp_config_credentials');
      if (stored) {
        try {
          const data = JSON.parse(stored);
          if (Date.now() > data.autoExpiry) {
            sessionStorage.removeItem('bin2nlp_config_credentials');
          }
        } catch {
          sessionStorage.removeItem('bin2nlp_config_credentials');
        }
      }
    };
    
    setInterval(cleanup, 15 * 60 * 1000); // Check every 15 minutes
  },
};
```

### Input Sanitization

**Configuration Parameter Sanitization:**
```typescript
const sanitizeConfiguration = (config: ConfigurationData): ConfigurationData => {
  return {
    analysisDepth: ['basic', 'standard', 'detailed'].includes(config.analysisDepth) 
      ? config.analysisDepth 
      : 'standard',
    
    selectedProvider: config.selectedProvider?.replace(/[^a-zA-Z0-9_-]/g, ''),
    
    selectedModel: config.selectedModel?.replace(/[^a-zA-Z0-9._-]/g, ''),
    
    translationDetail: ['basic', 'detailed'].includes(config.translationDetail || '') 
      ? config.translationDetail 
      : 'basic',
    
    customParameters: config.customParameters 
      ? sanitizeCustomParameters(config.customParameters)
      : undefined,
  };
};

const sanitizeCustomParameters = (params: Record<string, any>): Record<string, any> => {
  const sanitized = {};
  
  Object.entries(params).forEach(([key, value]) => {
    // Sanitize keys (alphanumeric and underscores only)
    const cleanKey = key.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 50);
    
    if (cleanKey && typeof value === 'string') {
      // Sanitize string values
      sanitized[cleanKey] = value.slice(0, 1000);
    } else if (cleanKey && typeof value === 'number') {
      // Validate numeric values
      if (Number.isFinite(value)) {
        sanitized[cleanKey] = value;
      }
    } else if (cleanKey && typeof value === 'boolean') {
      sanitized[cleanKey] = value;
    }
  });
  
  return sanitized;
};
```

## Performance & Scalability

### Form Performance Optimization

**Efficient Re-rendering with React Hook Form:**
```typescript
// Memoized form components to prevent unnecessary re-renders
const AnalysisDepthSelector = React.memo(({ control }: { control: Control<ConfigurationData> }) => {
  return (
    <Controller
      name="analysisDepth"
      control={control}
      render={({ field }) => (
        <FormControl component="fieldset">
          <FormLabel component="legend">Analysis Depth</FormLabel>
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

// Debounced cost estimation to prevent excessive API calls
const useDebouncedCostEstimation = (
  estimationFunction: (config: ConfigurationData) => void,
  delay: number = 500
) => {
  const debouncedFunction = useCallback(
    debounce(estimationFunction, delay),
    [estimationFunction, delay]
  );
  
  return debouncedFunction;
};

// Optimized provider selector with virtual scrolling for large lists
const ProviderSelector = React.memo(({ providers, value, onChange }: {
  providers: LLMProviderInfo[];
  value?: string;
  onChange: (provider: string) => void;
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredProviders = useMemo(() => {
    if (!searchTerm) return providers;
    return providers.filter(provider => 
      provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [providers, searchTerm]);
  
  return (
    <Autocomplete
      options={filteredProviders}
      getOptionLabel={(option) => option.name}
      value={filteredProviders.find(p => p.id === value) || null}
      onChange={(_, newValue) => newValue && onChange(newValue.id)}
      onInputChange={(_, newInputValue) => setSearchTerm(newInputValue)}
      renderInput={(params) => (
        <TextField
          {...params}
          label="LLM Provider"
          placeholder="Search providers..."
        />
      )}
      renderOption={(props, option) => (
        <Box component="li" {...props}>
          <Stack direction="row" spacing={2} alignItems="center" width="100%">
            <Typography variant="body1">{option.name}</Typography>
            <Typography variant="caption" color="text.secondary">
              {option.description}
            </Typography>
          </Stack>
        </Box>
      )}
    />
  );
});
```

### Caching Strategy

**Multi-level Caching for Provider Data:**
```typescript
// RTK Query caching with intelligent invalidation
const configurationApiWithCaching = api.injectEndpoints({
  endpoints: (builder) => ({
    listLLMProviders: builder.query<LLMProviderInfo[], void>({
      query: () => '/api/v1/llm-providers',
      keepUnusedDataFor: 300, // 5 minutes
      providesTags: ['LLMProviders'],
      // Custom cache key for provider lists
      serializeQueryArgs: ({ endpointName }) => endpointName,
    }),
    
    getProviderDetails: builder.query<LLMProviderDetails, string>({
      query: (providerId) => `/api/v1/llm-providers/${providerId}`,
      keepUnusedDataFor: 600, // 10 minutes - provider details change less frequently
      providesTags: (result, error, providerId) => [
        { type: 'LLMProviderDetails', id: providerId }
      ],
    }),
    
    estimateAnalysisCost: builder.query<CostEstimationResponse, CostEstimationRequest>({
      query: (request) => ({
        url: '/api/v1/estimate-cost',
        method: 'POST',
        body: request,
      }),
      keepUnusedDataFor: 180, // 3 minutes - costs change more frequently
      // Custom cache key based on significant parameters
      serializeQueryArgs: ({ queryArgs }) => {
        return `cost-${queryArgs.file_size}-${queryArgs.analysis_depth}-${queryArgs.llm_provider || 'none'}`;
      },
    }),
  }),
});
```

## Testing Strategy

### Component Testing with React Hook Form

**Form Validation Testing:**
```typescript
describe('AnalysisConfigurationInterface', () => {
  beforeEach(() => {
    // Setup MSW handlers for API mocking
    server.use(
      rest.get('/api/v1/llm-providers', (req, res, ctx) => {
        return res(ctx.json([
          {
            id: 'openai',
            name: 'OpenAI',
            description: 'OpenAI GPT models',
            supported_models: ['gpt-3.5-turbo', 'gpt-4'],
            pricing_info: {
              input_cost_per_token: 0.0015,
              output_cost_per_token: 0.002,
              currency: 'USD',
            },
          },
        ]));
      })
    );
  });

  it('should validate required fields correctly', async () => {
    const mockFile = new File(['test content'], 'test.exe', { type: 'application/x-executable' });
    const mockOnJobSubmit = vi.fn(); // Using Vitest for any needed mock functions
    
    render(
      <Provider store={createTestStore()}>
        <AnalysisConfigurationInterface
          file={mockFile}
          onJobSubmit={mockOnJobSubmit}
        />
      </Provider>
    );
    
    // Try to submit without selecting anything
    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);
    
    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/analysis depth is required/i)).toBeInTheDocument();
    });
    
    // Fill in required field
    const basicRadio = screen.getByLabelText('Basic');
    fireEvent.click(basicRadio);
    
    // Now submit should work
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnJobSubmit).not.toHaveBeenCalled(); // Should validate form first
    });
  });
  
  it('should handle provider selection and credential input', async () => {
    const mockFile = new File(['test'], 'test.exe', { type: 'application/x-executable' });
    
    render(
      <Provider store={createTestStore()}>
        <AnalysisConfigurationInterface
          file={mockFile}
          onJobSubmit={vi.fn()}
        />
      </Provider>
    );
    
    // Expand LLM section
    const llmSection = screen.getByText('LLM Translation (Optional)');
    fireEvent.click(llmSection);
    
    // Wait for providers to load
    await waitFor(() => {
      expect(screen.getByText('OpenAI')).toBeInTheDocument();
    });
    
    // Select provider
    const providerSelect = screen.getByLabelText(/llm provider/i);
    fireEvent.mouseDown(providerSelect);
    
    const openaiOption = screen.getByText('OpenAI');
    fireEvent.click(openaiOption);
    
    // API key input should appear
    await waitFor(() => {
      expect(screen.getByLabelText(/api key/i)).toBeInTheDocument();
    });
    
    // Enter API key
    const apiKeyInput = screen.getByLabelText(/api key/i);
    fireEvent.change(apiKeyInput, { target: { value: 'sk-test12345678901234567890123456789012345678901234567890' } });
    
    // Model selector should appear with options
    await waitFor(() => {
      expect(screen.getByLabelText(/model/i)).toBeInTheDocument();
    });
  });
});
```

**Cost Estimation Testing:**
```typescript
describe('Cost Estimation', () => {
  it('should calculate costs correctly for different configurations', async () => {
    const mockFile = new File(['x'.repeat(1024)], 'test.exe'); // 1KB file
    
    // Mock cost estimation API
    server.use(
      rest.post('/api/v1/estimate-cost', (req, res, ctx) => {
        return res(ctx.json({
          decompilation_cost: 0.10,
          llm_translation_cost: 0.25,
          total_estimated_cost: 0.35,
          estimated_processing_minutes: 5,
          currency: 'USD',
          confidence: 'high',
        }));
      })
    );
    
    const { result } = renderHook(() => 
      useCostEstimation(mockFile, {
        analysisDepth: 'standard',
        selectedProvider: 'openai',
        selectedModel: 'gpt-3.5-turbo',
        translationDetail: 'basic',
      }), 
      {
        wrapper: ({ children }) => (
          <Provider store={createTestStore()}>{children}</Provider>
        ),
      }
    );
    
    // Should initially be loading
    expect(result.current.isLoading).toBe(true);
    
    // Wait for estimation to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.estimation).toEqual({
        decompilation_cost: 0.10,
        llm_translation_cost: 0.25,
        total_estimated_cost: 0.35,
        estimated_processing_minutes: 5,
        currency: 'USD',
        confidence: 'high',
      });
    });
  });
});
```

## Development Phases

### Phase 1: Core Configuration Interface (Week 1-2)

**Objectives:**
- Implement basic configuration form with React Hook Form
- Create Material-UI component structure
- Set up Redux state management for configuration
- Implement basic provider discovery

**Deliverables:**
- AnalysisConfigurationInterface container component
- ConfigurationForm with analysis depth selection
- Basic provider selector and model selection
- Form validation with real-time feedback

### Phase 2: Provider Integration (Week 2-3)

**Objectives:**
- Implement LLM provider discovery and health checking
- Add credential input and session-based storage
- Create cost estimation functionality
- Integrate provider health monitoring

**Deliverables:**
- Complete LLM provider integration
- Secure credential management
- Real-time cost estimation
- Provider health status indicators

### Phase 3: Job Submission (Week 3-4)

**Objectives:**
- Implement job submission with FormData construction
- Add configuration preset management
- Create comprehensive error handling
- Integration with job management system

**Deliverables:**
- Job submission functionality
- Configuration preset system
- Error handling and recovery
- Integration with job tracking

### Phase 4: Polish and Testing (Week 4-5)

**Objectives:**
- Performance optimization
- Comprehensive testing implementation
- User experience enhancements
- Documentation completion

**Deliverables:**
- Performance optimizations
- Complete test suite
- Enhanced user experience
- Production-ready implementation

---

**Document Version:** 1.0  
**Last Updated:** 2025-08-31  
**Next Phase:** Technical Implementation Document (TID)  
**Related Documents:** 002_FPRD|two-phase-pipeline-interface.md, 000_PADR|bin2nlp-frontend.md