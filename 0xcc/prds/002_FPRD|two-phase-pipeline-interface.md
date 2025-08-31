# Feature PRD: Analysis Configuration Interface

**Date:** 2025-08-31  
**Project:** bin2nlp-frontend  
**Feature Priority:** Core/MVP  
**Document ID:** 002_FPRD|two-phase-pipeline-interface  

## Feature Overview

**Feature Name:** Analysis Configuration Interface  
**Brief Description:** A streamlined configuration panel for decompilation settings and LLM provider selection that integrates directly with job submission, providing cost estimation, processing time preview, and secure credential management for binary analysis workflows.

**Problem Statement:** Software engineers and security researchers need an efficient way to configure analysis parameters, select optimal LLM providers with their own API keys, preview costs and processing times, and submit configured analysis jobs without complex workflow management overhead.

**Feature Goals:**
- Provide intuitive configuration interface for analysis parameters (depth, LLM provider, model selection)
- Enable secure input and validation of personal LLM API credentials
- Display cost estimation and processing time preview before job submission
- Support direct job submission with all configuration included in single request
- Integrate seamlessly with job management and results exploration platforms

**User Value Proposition:**
- **For Software Engineers:** Streamlined configuration with cost transparency, enabling efficient analysis parameter optimization
- **For Security Researchers:** Flexible provider selection with personal API key management for research budget control
- **For All Users:** Clear cost and time estimates with secure credential handling and one-step job submission

**Connection to Project Objectives:**
- Implements the core user journey: "Configure analysis depth and optionally select LLM provider with user API key"
- Supports the project goal of "streamlined job setup" and "session-based credential management"
- Contributes to the "unified workflow control" through integrated configuration and submission

## User Stories & Scenarios

### Primary User Stories

**US-001: Configure Analysis Parameters**
- **As a** software engineer
- **I want to** configure decompilation settings and analysis depth
- **So that** I can optimize the analysis for my specific use case and processing requirements
- **Acceptance Criteria:**
  - Configuration panel displays analysis depth options: basic, standard, detailed
  - Clear descriptions of what each depth level includes and processing implications
  - Parameter validation prevents invalid configurations
  - Visual feedback on configuration changes and their impact
  - Integration with file upload to show file-specific recommendations

**US-002: Input LLM API Credentials Securely**
- **As a** security researcher
- **I want to** securely input my personal LLM API keys for analysis
- **So that** I can use my own provider accounts and maintain cost control
- **Acceptance Criteria:**
  - Secure input fields for LLM API credentials with proper masking
  - Session-only storage with no persistent credential retention
  - API key validation with provider connectivity testing
  - Clear indication of which providers are available and configured
  - Option to proceed without LLM translation (decompilation only)

**US-003: Preview Estimated Costs and Processing Time**
- **As a** software engineer
- **I want to** see estimated costs and processing time before submitting analysis job
- **So that** I can make informed decisions about analysis parameters and provider selection
- **Acceptance Criteria:**
  - Real-time cost estimation based on file size, analysis depth, and selected LLM provider
  - Processing time estimates with confidence intervals
  - Cost breakdown showing decompilation vs LLM translation costs
  - Comparison between different provider options when multiple are configured
  - Clear indication when estimates are unavailable or uncertain

**US-004: Submit Configured Analysis Job**
- **As a** security researcher
- **I want to** submit analysis job with all configuration in a single request
- **So that** I can initiate complete analysis without separate configuration steps
- **Acceptance Criteria:**
  - Single submission button that includes file, configuration, and credentials
  - Job submission confirmation with job ID and expected completion time
  - Automatic transition to job tracking interface after submission
  - Error handling for submission failures with clear corrective guidance
  - Option to save configuration preferences for future jobs

### Secondary User Stories

**US-005: Manage Configuration Presets**
- **As a** software engineer
- **I want to** save and reuse configuration presets for common analysis scenarios
- **So that** I can quickly apply consistent settings across multiple analysis jobs
- **Acceptance Criteria:**
  - Ability to save current configuration as named preset
  - Quick selection of saved presets with preview of settings
  - Preset management (rename, delete, duplicate)
  - Default preset selection for new jobs

**US-006: Provider Health Monitoring**
- **As a** security researcher
- **I want to** verify LLM provider connectivity and performance before job submission
- **So that** I can avoid job failures due to provider issues
- **Acceptance Criteria:**
  - Health check functionality for configured providers
  - Provider status indicators (healthy, degraded, unavailable)
  - Performance metrics display (response time, success rate)
  - Automatic provider recommendations based on current health

## Functional Requirements

### Core Functionality

**FR-001: Configuration Parameter Management**
- Analysis depth selection with clear impact descriptions
- LLM provider discovery and selection interface
- Model selection for chosen providers with capability descriptions
- Translation detail level configuration (basic, detailed)
- Real-time parameter validation and conflict resolution
- Configuration summary display with all selected options

**FR-002: Secure Credential Management**
- Secure input fields for LLM API keys with proper input masking
- Session-only credential storage with automatic cleanup
- API key format validation for different providers
- Credential testing with provider connectivity verification
- Multiple provider credential management in single session
- Clear indication of credential status and validation results

**FR-003: Cost and Time Estimation**
- Real-time cost calculation based on file size and configuration
- Processing time estimation with confidence intervals
- Cost breakdown by processing phase (decompilation vs LLM translation)
- Provider comparison showing cost and performance differences
- Historical accuracy tracking for estimation improvement
- Currency and time unit preferences

**FR-004: Job Submission Integration**
- Single form submission combining file, configuration, and credentials
- FormData construction with proper parameter encoding
- Job submission validation with comprehensive error handling
- Submission confirmation with job tracking transition
- Retry capability for failed submissions with error diagnosis
- Progress indication during submission process

### Integration Requirements

**FR-005: Provider Discovery Integration**
- API integration with GET /api/v1/llm-providers for available providers
- Provider detail retrieval via GET /api/v1/llm-providers/{provider_id}
- Provider health checking via POST /api/v1/llm-providers/{provider_id}/health-check
- Dynamic provider availability updates based on health status
- Provider capability mapping to configuration options
- Error handling for provider discovery failures

**FR-006: Job Submission Integration**
- Job submission via POST /api/v1/decompile with complete FormData payload
- Parameter encoding for analysis_depth, llm_provider, llm_api_key, llm_model, translation_detail
- File attachment with configuration metadata
- Submission response handling with job ID extraction
- Error response processing with user-friendly error messages
- Integration with job tracking interface for seamless workflow

## Technical Requirements

### Performance Requirements

**TR-001: Configuration Response Times**
- Configuration panel loading within 2 seconds of file upload
- Real-time cost estimation updates within 500ms of parameter changes
- Provider health checks completed within 5 seconds
- Job submission processing within 3 seconds of form completion
- Configuration validation feedback within 200ms of input changes

**TR-002: Resource Management**
- Efficient credential storage with automatic session cleanup
- Optimized provider discovery with caching for repeated requests
- Memory-efficient configuration state management
- Minimal API calls through intelligent request batching
- Background provider health monitoring without UI blocking

### Security Requirements

**TR-003: Credential Security**
- Session-only credential storage with no disk persistence
- Secure transmission of API keys via HTTPS
- Credential masking in UI with secure input handling
- Automatic credential cleanup on session end or browser close
- No credential logging or debugging output
- Secure credential validation without exposure

**TR-004: Input Validation and Sanitization**
- Comprehensive validation of all configuration parameters
- API key format validation for each supported provider
- File size and format validation integration
- Parameter range and compatibility validation
- Sanitization of user input to prevent injection attacks
- Configuration integrity verification before submission

## API Integration

### Core Endpoints

```typescript
// Provider Discovery
const listProviders = useQuery({
  queryKey: ['providers'],
  queryFn: async () => {
    const response = await fetch('/api/v1/llm-providers');
    return response.json();
  },
});

// Provider Details
const getProviderDetails = useQuery({
  queryKey: ['provider', providerId],
  queryFn: async ({ queryKey }) => {
    const response = await fetch(`/api/v1/llm-providers/${queryKey[1]}`);
    return response.json();
  },
  enabled: !!providerId,
});

// Provider Health Check
const checkProviderHealth = useMutation({
  mutationFn: async (providerId: string) => {
    const response = await fetch(`/api/v1/llm-providers/${providerId}/health-check`, {
      method: 'POST',
    });
    return response.json();
  },
});

// Job Submission with Configuration
const submitConfiguredJob = useMutation({
  mutationFn: async (configuration: JobConfiguration) => {
    const formData = new FormData();
    formData.append('file', configuration.file);
    formData.append('analysis_depth', configuration.analysisDepth);
    
    if (configuration.llmProvider) {
      formData.append('llm_provider', configuration.llmProvider);
      formData.append('llm_api_key', configuration.llmApiKey);
      formData.append('llm_model', configuration.llmModel);
      formData.append('translation_detail', configuration.translationDetail);
    }
    
    const response = await fetch('/api/v1/decompile', {
      method: 'POST',
      body: formData,
    });
    return response.json();
  },
});
```

### Request/Response Schemas

**Provider List Response:**
```typescript
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

interface ProviderListResponse {
  providers: ProviderInfo[];
  total_count: number;
}
```

**Configuration Form Data:**
```typescript
interface JobConfiguration {
  file: File;
  analysisDepth: 'basic' | 'standard' | 'detailed';
  llmProvider?: string;
  llmApiKey?: string;
  llmModel?: string;
  translationDetail?: 'basic' | 'detailed';
}

interface CostEstimation {
  decompilation_cost: number;
  llm_translation_cost?: number;
  total_estimated_cost: number;
  processing_time_estimate_minutes: number;
  currency: string;
  confidence_level: 'high' | 'medium' | 'low';
}
```

**Provider Health Response:**
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

## Testing Requirements

### Unit Testing

**UT-001: Configuration Component Testing**
- Configuration form validation with various parameter combinations
- Cost estimation calculations with different file sizes and configurations
- Provider selection logic with availability and health status
- Credential input handling with masking and validation
- Error handling for invalid configurations and provider failures

**UT-002: Integration Service Testing**
- Provider discovery API integration with mock responses
- Cost estimation service with different provider pricing models
- Credential validation service with various API key formats
- Job submission service with FormData construction
- Error handling for network failures and API errors

### Integration Testing

**IT-001: End-to-End Configuration Flow**
- Complete configuration workflow from file upload to job submission
- Provider discovery and health checking integration
- Credential validation with actual provider endpoints (in test environment)
- Cost estimation accuracy with real provider pricing
- Job submission with various configuration combinations

**IT-002: Security Integration Testing**
- Credential handling security with session isolation
- API key transmission security and validation
- Configuration parameter sanitization and validation
- Session cleanup and credential disposal
- Error handling without credential exposure

### End-to-End Testing

**E2E-001: Complete User Workflow**
- File upload → configuration → cost preview → job submission → job tracking
- Multi-provider configuration scenarios with credential management
- Configuration preset saving and reuse
- Error scenarios and recovery workflows
- Cross-browser compatibility for configuration interface

**E2E-002: Security and Performance Testing**
- Credential security throughout complete workflow
- Configuration interface performance with large files
- Provider health monitoring during configuration process
- Cost estimation accuracy and update performance
- Memory usage during extended configuration sessions

## Implementation Approach

### Development Phases

**Phase 1: Basic Configuration Interface (Week 1)**
- Implement core configuration form with analysis depth selection
- Add provider discovery and selection interface
- Create basic cost estimation without provider integration
- Implement form validation and error handling

**Phase 2: Provider Integration (Week 2)**
- Integrate provider discovery API with health checking
- Add credential input and validation functionality
- Implement real-time cost estimation with provider pricing
- Create provider health monitoring interface

**Phase 3: Job Submission Integration (Week 3)**
- Implement job submission with FormData construction
- Add submission confirmation and job tracking transition
- Create configuration preset management
- Integrate error handling and retry functionality

**Phase 4: Advanced Features and Polish (Week 4)**
- Add advanced configuration options and comparison tools
- Implement performance optimizations for large files
- Add comprehensive error handling and user guidance
- Complete testing and documentation

### Technical Implementation Notes

**State Management Architecture:**
```typescript
interface ConfigurationState {
  form: {
    analysisDepth: 'basic' | 'standard' | 'detailed';
    selectedProvider?: string;
    apiKey?: string;
    selectedModel?: string;
    translationDetail?: 'basic' | 'detailed';
    isValid: boolean;
    errors: Record<string, string>;
  };
  providers: {
    available: ProviderInfo[];
    health: Record<string, ProviderHealthResponse>;
    isLoading: boolean;
  };
  estimation: {
    cost?: CostEstimation;
    isCalculating: boolean;
    lastUpdated?: string;
  };
  submission: {
    isSubmitting: boolean;
    submittedJobId?: string;
    error?: string;
  };
}
```

**Component Architecture:**
```
AnalysisConfigurationInterface/
├── ConfigurationForm/
│   ├── AnalysisDepthSelector
│   ├── ProviderSelector
│   ├── CredentialInput
│   └── ModelSelector
├── CostEstimationPanel/
│   ├── CostBreakdown
│   ├── ProcessingTimeEstimate
│   └── ProviderComparison
├── ProviderHealthPanel/
│   ├── ProviderStatusIndicators
│   ├── HealthCheckButton
│   └── PerformanceMetrics
└── SubmissionPanel/
    ├── ConfigurationSummary
    ├── SubmitButton
    └── ErrorDisplay
```

## Success Metrics

### User Experience Metrics
- Configuration completion rate >90%
- Average configuration time <2 minutes
- Cost estimation accuracy >85% (within 20% of actual)
- Provider selection success rate >95%
- Job submission success rate >98%

### Technical Performance Metrics
- Configuration panel loading time <2 seconds
- Real-time cost updates <500ms
- Provider health check completion <5 seconds
- Memory usage for configuration interface <25MB
- API call efficiency <10 calls per configuration session

### Business Value Metrics
- User adoption of LLM provider selection >70%
- Average cost estimation usage >80% of submissions
- Configuration preset creation >40% of users
- User satisfaction with configuration process >4.5/5
- Support requests related to configuration <3% of total

---

**Document Version:** 1.0  
**Last Updated:** 2025-08-31  
**Next Review:** After implementation Phase 1  
**Related Documents:** 000_PPRD|bin2nlp-frontend.md, 000_PADR|bin2nlp-frontend.md, 001_FPRD|file-management-system.md