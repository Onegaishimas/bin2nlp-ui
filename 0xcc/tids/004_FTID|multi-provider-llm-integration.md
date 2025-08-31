# Technical Implementation Document: Multi-Provider LLM Integration

**Date:** 2025-08-31  
**Project:** bin2nlp-frontend  
**Feature:** Multi-Provider LLM Integration  
**Document ID:** 004_FTID|multi-provider-llm-integration  
**Related PRD:** 004_FPRD|multi-provider-llm-integration.md  
**Related TDD:** 004_FTDD|multi-provider-llm-integration.md

## Implementation Overview

The Multi-Provider LLM Integration implements a sophisticated provider coordination system that abstracts multiple LLM providers (OpenAI, Anthropic, Gemini, Ollama) through a unified adapter pattern while maintaining provider-specific optimizations. The implementation emphasizes secure credential management with Web Crypto API encryption, intelligent failover coordination, and seamless integration with the existing job-based analysis workflow.

**Key Implementation Principles:**
- Feature-based organization following established ADR patterns with co-located provider adapters and management components
- Adapter pattern with unified interface preserving provider-specific capabilities and authentication mechanisms
- Secure credential management using Web Crypto API with session-based storage and automatic cleanup
- Centralized failover coordinator with configurable priority, retry logic, and health monitoring
- Seamless integration with job submission workflow through embedded provider selection and credential passing

**Integration Architecture:**
- Direct integration with analysis configuration interface for unified user experience
- Provider discovery and validation through dedicated RTK Query endpoints
- Health monitoring through hybrid background polling and on-demand validation
- Session-based credential storage with automatic cleanup and cross-tab coordination
- Provider metadata tracking throughout job lifecycle for traceability and optimization

## File Structure and Organization

### Feature Directory Architecture

```
src/
├── features/
│   └── llm-providers/                     # Multi-provider feature root
│       ├── components/                    # Provider management components
│       │   ├── ProviderManager.tsx       # Main provider management interface
│       │   ├── configuration/            # Provider configuration components
│       │   │   ├── ProviderConfiguration.tsx    # Main configuration panel
│       │   │   ├── ProviderSelector.tsx         # Provider selection interface
│       │   │   ├── ModelSelector.tsx           # Model selection per provider
│       │   │   ├── CredentialInput.tsx         # Secure API key input
│       │   │   └── ConfigurationPresets.tsx    # Configuration preset management
│       │   ├── monitoring/               # Provider monitoring components
│       │   │   ├── ProviderHealthStatus.tsx    # Real-time health indicators
│       │   │   ├── ConnectionTester.tsx        # Provider connectivity testing
│       │   │   ├── HealthDashboard.tsx         # Comprehensive health overview
│       │   │   └── FailoverIndicator.tsx       # Failover status and history
│       │   ├── comparison/               # Provider comparison tools
│       │   │   ├── ProviderComparison.tsx      # Side-by-side provider comparison
│       │   │   ├── CostComparison.tsx          # Cost analysis per provider
│       │   │   ├── PerformanceMetrics.tsx      # Provider performance indicators
│       │   │   └── CapabilityMatrix.tsx        # Provider capability comparison
│       │   └── integration/              # Pipeline integration components
│       │       ├── ProviderSelectionPanel.tsx  # Job configuration integration
│       │       ├── ProviderStatusDisplay.tsx   # Job-time provider status
│       │       ├── FailoverControls.tsx        # Manual failover controls
│       │       └── ProviderResults.tsx         # Results with provider metadata
│       ├── adapters/                     # Provider adapter implementations
│       │   ├── base/                     # Base adapter infrastructure
│       │   │   ├── BaseProviderAdapter.ts      # Abstract base adapter
│       │   │   ├── ProviderAdapterFactory.ts   # Adapter factory and registry
│       │   │   ├── AdapterConfiguration.ts     # Common configuration interface
│       │   │   └── AdapterError.ts             # Provider error handling
│       │   ├── openai/                   # OpenAI provider implementation
│       │   │   ├── OpenAIAdapter.ts            # OpenAI API adapter
│       │   │   ├── OpenAITypes.ts              # OpenAI-specific types
│       │   │   ├── OpenAIAuth.ts               # OpenAI authentication
│       │   │   └── OpenAIModels.ts             # OpenAI model management
│       │   ├── anthropic/                # Anthropic provider implementation
│       │   │   ├── AnthropicAdapter.ts         # Anthropic API adapter
│       │   │   ├── AnthropicTypes.ts           # Anthropic-specific types
│       │   │   ├── AnthropicAuth.ts            # Anthropic authentication
│       │   │   └── AnthropicModels.ts          # Anthropic model management
│       │   ├── gemini/                   # Gemini provider implementation
│       │   │   ├── GeminiAdapter.ts            # Gemini API adapter
│       │   │   ├── GeminiTypes.ts              # Gemini-specific types
│       │   │   ├── GeminiAuth.ts               # Gemini OAuth handling
│       │   │   └── GeminiModels.ts             # Gemini model management
│       │   └── ollama/                   # Ollama provider implementation
│       │       ├── OllamaAdapter.ts            # Ollama API adapter
│       │       ├── OllamaTypes.ts              # Ollama-specific types
│       │       ├── OllamaAuth.ts               # Ollama local auth
│       │       └── OllamaModels.ts             # Ollama model management
│       ├── services/                     # Core provider services
│       │   ├── ProviderRegistry.ts             # Provider registration and discovery
│       │   ├── CredentialManager.ts            # Secure credential management
│       │   ├── FailoverCoordinator.ts          # Intelligent failover logic
│       │   ├── HealthMonitor.ts                # Provider health monitoring
│       │   ├── ModelDiscovery.ts               # Dynamic model discovery
│       │   ├── ProviderValidator.ts            # Configuration validation
│       │   └── SessionManager.ts               # Session-based state management
│       ├── hooks/                        # Provider-specific hooks
│       │   ├── useProviderManager.ts           # Main provider management hook
│       │   ├── useProviderConfiguration.ts     # Configuration state hook
│       │   ├── useProviderHealth.ts            # Health monitoring hook
│       │   ├── useCredentialManagement.ts      # Secure credential hook
│       │   ├── useFailoverCoordination.ts      # Failover management hook
│       │   ├── useModelSelection.ts            # Model selection hook
│       │   └── useProviderComparison.ts        # Provider comparison hook
│       ├── api/                          # Provider API integration
│       │   ├── providersApi.ts                 # RTK Query provider API
│       │   ├── healthApi.ts                    # Health check endpoints
│       │   ├── modelsApi.ts                    # Model discovery endpoints
│       │   └── validationApi.ts                # Configuration validation
│       ├── types/                        # Provider type definitions
│       │   ├── ProviderTypes.ts                # Core provider interfaces
│       │   ├── AdapterTypes.ts                 # Adapter interface types
│       │   ├── CredentialTypes.ts              # Credential management types
│       │   ├── HealthTypes.ts                  # Health monitoring types
│       │   ├── FailoverTypes.ts                # Failover coordination types
│       │   └── ConfigurationTypes.ts           # Configuration management types
│       ├── utils/                        # Provider utility functions
│       │   ├── providerValidation.ts           # Provider validation utilities
│       │   ├── credentialSecurity.ts           # Credential security utilities
│       │   ├── healthCalculation.ts            # Health score calculation
│       │   ├── failoverLogic.ts                # Failover decision logic
│       │   ├── modelComparison.ts              # Model comparison utilities
│       │   └── configurationHelpers.ts         # Configuration helper functions
│       ├── constants/                    # Provider constants
│       │   ├── ProviderConstants.ts            # Provider configuration constants
│       │   ├── HealthConstants.ts              # Health monitoring thresholds
│       │   ├── FailoverConstants.ts            # Failover timing and retry limits
│       │   └── SecurityConstants.ts            # Security and encryption constants
│       └── index.ts                      # Feature exports
├── store/
│   └── slices/
│       ├── llmProvidersSlice.ts                # Main provider state management
│       └── providerHealthSlice.ts              # Health monitoring state
└── components/                           # Shared components
    └── common/
        ├── SecureInput.tsx                     # Reusable secure input component
        ├── HealthIndicator.tsx                 # Reusable health status indicator
        └── LoadingOverlay.tsx                  # Loading state component
```

### Import Organization Pattern

```typescript
// External dependencies
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Card, CardContent, Typography, Box, Stack, Tab, Tabs,
  TextField, InputAdornment, IconButton, Chip, Alert,
  CircularProgress, Button, Dialog, DialogTitle, DialogContent
} from '@mui/material';
import {
  Visibility as VisibilityIcon, VisibilityOff as VisibilityOffIcon,
  Check as CheckIcon, Error as ErrorIcon, Warning as WarningIcon,
  Refresh as RefreshIcon, Settings as SettingsIcon
} from '@mui/icons-material';

// Crypto and security
import { webcrypto } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { debounce } from 'lodash';

// Redux and state management
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { 
  useGetProvidersQuery, 
  useValidateProviderMutation,
  useGetProviderModelsQuery 
} from '../api/providersApi';
import {
  selectProviderConfiguration,
  selectProviderHealth,
  selectFailoverState,
  updateProviderConfig,
  setProviderCredentials,
  updateProviderHealth
} from '../../../store/slices/llmProvidersSlice';

// Provider services and utilities
import { ProviderAdapterFactory } from '../adapters/base/ProviderAdapterFactory';
import { CredentialManager } from '../services/CredentialManager';
import { FailoverCoordinator } from '../services/FailoverCoordinator';
import { HealthMonitor } from '../services/HealthMonitor';
import { validateProviderConfiguration } from '../utils/providerValidation';
import { encryptCredentials, decryptCredentials } from '../utils/credentialSecurity';

// Feature components
import { ProviderSelector } from './ProviderSelector';
import { ModelSelector } from './ModelSelector';
import { CredentialInput } from './CredentialInput';
import { ProviderHealthStatus } from '../monitoring/ProviderHealthStatus';

// Types and constants
import type {
  ProviderConfiguration,
  ProviderAdapter,
  ProviderHealthStatus as ProviderHealthStatusType,
  FailoverConfiguration,
  CredentialSet
} from '../types/ProviderTypes';
import { PROVIDER_CONSTANTS, HEALTH_CONSTANTS } from '../constants/ProviderConstants';
```

## Component Implementation Hints

### Main Provider Management Container

**ProviderManager.tsx - Primary Management Interface:**
```typescript
interface ProviderManagerProps {
  embedded?: boolean; // True when embedded in job configuration
  onProviderChange?: (providerId: string, isValid: boolean) => void;
  initialProvider?: string;
  showComparison?: boolean;
}

const ProviderManager: React.FC<ProviderManagerProps> = ({
  embedded = false,
  onProviderChange,
  initialProvider,
  showComparison = true
}) => {
  const dispatch = useAppDispatch();
  
  // Provider state from Redux
  const {
    availableProviders,
    configuredProviders,
    activeProvider,
    credentials,
    healthStatus,
    failoverConfiguration
  } = useAppSelector(selectProviderConfiguration);
  
  // RTK Query for provider data
  const { 
    data: providers, 
    isLoading: providersLoading,
    refetch: refetchProviders 
  } = useGetProvidersQuery(undefined, {
    pollingInterval: embedded ? undefined : 60000, // Poll every minute when not embedded
    refetchOnMountOrArgChange: true,
  });
  
  // Provider management services
  const [providerFactory] = useState(() => new ProviderAdapterFactory());
  const [credentialManager] = useState(() => new CredentialManager());
  const [failoverCoordinator] = useState(() => new FailoverCoordinator());
  const [healthMonitor] = useState(() => new HealthMonitor());
  
  // Custom hooks for complex functionality
  const {
    configureProvider,
    validateConfiguration,
    testConnection,
    clearConfiguration
  } = useProviderConfiguration({
    providerFactory,
    credentialManager,
    onConfigurationChange: onProviderChange,
  });
  
  const {
    healthScores,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    refreshHealth
  } = useProviderHealth({
    healthMonitor,
    providers: configuredProviders,
    credentials,
  });
  
  const {
    failoverEnabled,
    failoverHistory,
    enableFailover,
    disableFailover,
    configureFailover
  } = useFailoverCoordination({
    failoverCoordinator,
    configuredProviders,
    healthScores,
  });
  
  // Tab state for configuration interface
  const [activeTab, setActiveTab] = useState<number>(0);
  const [selectedProvider, setSelectedProvider] = useState<string>(
    initialProvider || activeProvider || ''
  );
  
  // Provider configuration dialog
  const [configurationDialog, setConfigurationDialog] = useState<{
    open: boolean;
    providerId: string | null;
  }>({ open: false, providerId: null });
  
  // Initialize health monitoring on mount
  useEffect(() => {
    if (configuredProviders.length > 0 && !embedded) {
      startMonitoring();
    }
    
    return () => {
      if (!embedded) {
        stopMonitoring();
      }
    };
  }, [configuredProviders.length, embedded, startMonitoring, stopMonitoring]);
  
  // Handle provider selection
  const handleProviderSelect = useCallback(async (providerId: string) => {
    setSelectedProvider(providerId);
    
    // Test connection if credentials are available
    if (credentials[providerId]) {
      try {
        const isValid = await testConnection(providerId, credentials[providerId]);
        onProviderChange?.(providerId, isValid);
        
        // Update active provider if valid
        if (isValid) {
          dispatch(updateProviderConfig({
            activeProvider: providerId,
            lastSelected: new Date().toISOString(),
          }));
        }
      } catch (error) {
        console.warn('Provider connection test failed:', error);
        onProviderChange?.(providerId, false);
      }
    }
  }, [credentials, testConnection, onProviderChange, dispatch]);
  
  // Handle credential input
  const handleCredentialUpdate = useCallback(async (
    providerId: string, 
    apiKey: string
  ) => {
    try {
      // Encrypt and store credentials
      const encryptedCredentials = await credentialManager.storeCredentials(
        providerId, 
        apiKey
      );
      
      dispatch(setProviderCredentials({
        providerId,
        credentials: encryptedCredentials,
        timestamp: new Date().toISOString(),
      }));
      
      // Test connection with new credentials
      const isValid = await testConnection(providerId, apiKey);
      
      // Update health status
      dispatch(updateProviderHealth({
        providerId,
        status: isValid ? 'healthy' : 'error',
        lastChecked: new Date().toISOString(),
        responseTime: 0, // Will be updated by actual health check
      }));
      
      onProviderChange?.(providerId, isValid);
      
    } catch (error) {
      console.error('Failed to update credentials:', error);
      
      dispatch(updateProviderHealth({
        providerId,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: new Date().toISOString(),
      }));
      
      onProviderChange?.(providerId, false);
    }
  }, [credentialManager, dispatch, testConnection, onProviderChange]);
  
  // Handle provider configuration
  const handleConfigureProvider = useCallback((providerId: string) => {
    setConfigurationDialog({ open: true, providerId });
  }, []);
  
  const handleCloseConfiguration = useCallback(() => {
    setConfigurationDialog({ open: false, providerId: null });
  }, []);
  
  // Render provider tabs or embedded interface
  if (embedded) {
    return (
      <Card sx={{ width: '100%' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            LLM Provider Selection
          </Typography>
          
          <Stack spacing={2}>
            {/* Provider Selection */}
            <ProviderSelector
              providers={providers || []}
              selectedProvider={selectedProvider}
              healthStatus={healthScores}
              onProviderSelect={handleProviderSelect}
              showHealthIndicators
              compact
            />
            
            {/* Credential Input for Selected Provider */}
            {selectedProvider && (
              <CredentialInput
                providerId={selectedProvider}
                currentCredentials={credentials[selectedProvider]}
                onCredentialUpdate={handleCredentialUpdate}
                onTestConnection={(apiKey) => testConnection(selectedProvider, apiKey)}
                compact
              />
            )}
            
            {/* Model Selection */}
            {selectedProvider && credentials[selectedProvider] && (
              <ModelSelector
                providerId={selectedProvider}
                onModelSelect={(model) => {
                  dispatch(updateProviderConfig({
                    providerModels: {
                      ...configuredProviders,
                      [selectedProvider]: {
                        ...configuredProviders[selectedProvider],
                        selectedModel: model,
                      },
                    },
                  }));
                }}
                compact
              />
            )}
            
            {/* Health Status */}
            {selectedProvider && (
              <ProviderHealthStatus
                providerId={selectedProvider}
                healthStatus={healthScores[selectedProvider]}
                onRefresh={() => refreshHealth(selectedProvider)}
                compact
              />
            )}
          </Stack>
        </CardContent>
      </Card>
    );
  }
  
  // Full provider management interface
  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Provider Management Header */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, py: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">
            LLM Provider Management
          </Typography>
          
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => {
                refetchProviders();
                Object.keys(configuredProviders).forEach(providerId => {
                  refreshHealth(providerId);
                });
              }}
              disabled={providersLoading}
            >
              Refresh All
            </Button>
            
            <Button
              variant="contained"
              startIcon={<SettingsIcon />}
              onClick={() => configureFailover(failoverConfiguration)}
            >
              Configure Failover
            </Button>
          </Stack>
        </Stack>
      </Box>
      
      {/* Provider Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={activeTab} 
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Configuration" />
          <Tab label="Health Monitoring" />
          {showComparison && <Tab label="Comparison" />}
          <Tab label="Failover" />
        </Tabs>
      </Box>
      
      {/* Tab Panels */}
      <Box sx={{ flex: 1, p: 2 }}>
        {activeTab === 0 && (
          <ProviderConfiguration
            providers={providers || []}
            configuredProviders={configuredProviders}
            credentials={credentials}
            onProviderSelect={handleProviderSelect}
            onCredentialUpdate={handleCredentialUpdate}
            onConfigureProvider={handleConfigureProvider}
          />
        )}
        
        {activeTab === 1 && (
          <HealthDashboard
            providers={configuredProviders}
            healthScores={healthScores}
            isMonitoring={isMonitoring}
            onStartMonitoring={startMonitoring}
            onStopMonitoring={stopMonitoring}
            onRefreshHealth={refreshHealth}
          />
        )}
        
        {activeTab === 2 && showComparison && (
          <ProviderComparison
            providers={Object.keys(configuredProviders)}
            healthScores={healthScores}
            credentials={credentials}
          />
        )}
        
        {activeTab === 3 && (
          <FailoverConfiguration
            failoverEnabled={failoverEnabled}
            failoverHistory={failoverHistory}
            configuredProviders={configuredProviders}
            healthScores={healthScores}
            onEnableFailover={enableFailover}
            onDisableFailover={disableFailover}
            onConfigureFailover={configureFailover}
          />
        )}
      </Box>
      
      {/* Provider Configuration Dialog */}
      <Dialog
        open={configurationDialog.open}
        onClose={handleCloseConfiguration}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Configure {configurationDialog.providerId ? 
            providers?.find(p => p.id === configurationDialog.providerId)?.name : 
            'Provider'
          }
        </DialogTitle>
        <DialogContent>
          {configurationDialog.providerId && (
            <AdvancedProviderConfiguration
              providerId={configurationDialog.providerId}
              onClose={handleCloseConfiguration}
              onSave={(config) => {
                configureProvider(configurationDialog.providerId!, config);
                handleCloseConfiguration();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};
```

### Provider Adapter System

**BaseProviderAdapter.ts - Abstract Adapter Foundation:**
```typescript
export abstract class BaseProviderAdapter {
  protected readonly providerId: string;
  protected readonly providerName: string;
  protected configuration: AdapterConfiguration;
  protected credentials?: EncryptedCredentials;
  
  constructor(providerId: string, providerName: string) {
    this.providerId = providerId;
    this.providerName = providerName;
    this.configuration = this.getDefaultConfiguration();
  }
  
  /**
   * Initialize adapter with configuration and credentials
   */
  async initialize(
    configuration: AdapterConfiguration,
    credentials?: EncryptedCredentials
  ): Promise<void> {
    this.configuration = { ...this.getDefaultConfiguration(), ...configuration };
    this.credentials = credentials;
    
    // Validate configuration
    const validation = await this.validateConfiguration();
    if (!validation.isValid) {
      throw new AdapterError(
        `Invalid configuration for ${this.providerName}`,
        'CONFIGURATION_ERROR',
        validation.errors
      );
    }
    
    // Initialize provider-specific setup
    await this.initializeProvider();
  }
  
  /**
   * Test provider connectivity and authentication
   */
  async testConnection(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Decrypt credentials for testing
      const decryptedCredentials = this.credentials ? 
        await this.decryptCredentials(this.credentials) : 
        undefined;
      
      if (!decryptedCredentials) {
        return {
          providerId: this.providerId,
          status: 'error',
          responseTime: 0,
          error: 'No credentials provided',
          testedAt: new Date().toISOString(),
        };
      }
      
      // Provider-specific connection test
      const result = await this.performHealthCheck(decryptedCredentials);
      const responseTime = Date.now() - startTime;
      
      return {
        providerId: this.providerId,
        status: result.success ? 'healthy' : 'error',
        responseTime,
        error: result.error,
        testedAt: new Date().toISOString(),
        additionalInfo: result.additionalInfo,
      };
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        providerId: this.providerId,
        status: 'error',
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        testedAt: new Date().toISOString(),
      };
    }
  }
  
  /**
   * Get available models for this provider
   */
  async getAvailableModels(): Promise<ModelInfo[]> {
    try {
      const decryptedCredentials = this.credentials ? 
        await this.decryptCredentials(this.credentials) : 
        undefined;
      
      if (!decryptedCredentials) {
        throw new AdapterError(
          'No credentials available for model discovery',
          'AUTHENTICATION_ERROR'
        );
      }
      
      return await this.discoverModels(decryptedCredentials);
      
    } catch (error) {
      console.error(`Model discovery failed for ${this.providerName}:`, error);
      return this.getDefaultModels();
    }
  }
  
  /**
   * Execute LLM request with failover support
   */
  async executeRequest(
    request: LLMRequest,
    options?: RequestOptions
  ): Promise<LLMResponse> {
    const startTime = Date.now();
    
    try {
      // Validate request
      const validation = this.validateRequest(request);
      if (!validation.isValid) {
        throw new AdapterError(
          'Invalid request format',
          'VALIDATION_ERROR',
          validation.errors
        );
      }
      
      // Decrypt credentials
      const decryptedCredentials = this.credentials ? 
        await this.decryptCredentials(this.credentials) : 
        undefined;
      
      if (!decryptedCredentials) {
        throw new AdapterError(
          'No credentials available for request',
          'AUTHENTICATION_ERROR'
        );
      }
      
      // Execute provider-specific request
      const response = await this.performRequest(
        request, 
        decryptedCredentials, 
        options
      );
      
      const processingTime = Date.now() - startTime;
      
      return {
        ...response,
        providerId: this.providerId,
        processingTime,
        requestId: options?.requestId || this.generateRequestId(),
      };
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      // Convert to standardized error
      const adapterError = error instanceof AdapterError ? 
        error : 
        new AdapterError(
          error instanceof Error ? error.message : 'Unknown error',
          'REQUEST_ERROR'
        );
      
      throw new AdapterError(
        adapterError.message,
        adapterError.code,
        adapterError.details,
        { providerId: this.providerId, processingTime }
      );
    }
  }
  
  // Abstract methods to be implemented by specific providers
  protected abstract getDefaultConfiguration(): AdapterConfiguration;
  protected abstract initializeProvider(): Promise<void>;
  protected abstract performHealthCheck(credentials: DecryptedCredentials): Promise<{
    success: boolean;
    error?: string;
    additionalInfo?: Record<string, any>;
  }>;
  protected abstract discoverModels(credentials: DecryptedCredentials): Promise<ModelInfo[]>;
  protected abstract getDefaultModels(): ModelInfo[];
  protected abstract validateRequest(request: LLMRequest): ValidationResult;
  protected abstract performRequest(
    request: LLMRequest,
    credentials: DecryptedCredentials,
    options?: RequestOptions
  ): Promise<LLMResponse>;
  
  // Common utility methods
  protected async decryptCredentials(
    encrypted: EncryptedCredentials
  ): Promise<DecryptedCredentials> {
    try {
      return await CredentialManager.decryptCredentials(encrypted);
    } catch (error) {
      throw new AdapterError(
        'Failed to decrypt credentials',
        'SECURITY_ERROR',
        { originalError: error }
      );
    }
  }
  
  protected generateRequestId(): string {
    return `${this.providerId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  protected validateConfiguration(): Promise<ValidationResult> {
    // Basic configuration validation
    const errors: string[] = [];
    
    if (!this.configuration.apiEndpoint) {
      errors.push('API endpoint is required');
    }
    
    if (!this.configuration.timeout || this.configuration.timeout < 1000) {
      errors.push('Timeout must be at least 1000ms');
    }
    
    return Promise.resolve({
      isValid: errors.length === 0,
      errors,
      warnings: [],
    });
  }
}
```

**OpenAIAdapter.ts - OpenAI Provider Implementation:**
```typescript
export class OpenAIAdapter extends BaseProviderAdapter {
  private static readonly DEFAULT_ENDPOINT = 'https://api.openai.com/v1';
  private static readonly DEFAULT_MODELS = [
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and cost-effective' },
    { id: 'gpt-4', name: 'GPT-4', description: 'Most capable model' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Latest GPT-4 with larger context' },
  ];
  
  constructor() {
    super('openai', 'OpenAI');
  }
  
  protected getDefaultConfiguration(): AdapterConfiguration {
    return {
      apiEndpoint: OpenAIAdapter.DEFAULT_ENDPOINT,
      timeout: 30000,
      maxRetries: 3,
      retryDelay: 1000,
      rateLimitPerMinute: 60,
      defaultModel: 'gpt-3.5-turbo',
      providerSpecific: {
        temperature: 0.1,
        maxTokens: 4000,
        topP: 1.0,
        frequencyPenalty: 0,
        presencePenalty: 0,
      },
    };
  }
  
  protected async initializeProvider(): Promise<void> {
    // OpenAI-specific initialization
    // Validate API endpoint accessibility
    try {
      const response = await fetch(`${this.configuration.apiEndpoint}/models`, {
        method: 'HEAD',
        timeout: 5000,
      });
      
      if (!response.ok && response.status !== 401) {
        throw new Error(`OpenAI API endpoint not accessible: ${response.status}`);
      }
    } catch (error) {
      console.warn('OpenAI endpoint validation failed:', error);
      // Continue initialization - will fail later with proper error handling
    }
  }
  
  protected async performHealthCheck(
    credentials: DecryptedCredentials
  ): Promise<{ success: boolean; error?: string; additionalInfo?: Record<string, any> }> {
    try {
      const response = await fetch(`${this.configuration.apiEndpoint}/models`, {
        headers: {
          'Authorization': `Bearer ${credentials.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: this.configuration.timeout,
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          additionalInfo: {
            availableModels: data.data?.length || 0,
            organization: response.headers.get('openai-organization'),
          },
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error?.message || `HTTP ${response.status}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }
  
  protected async discoverModels(credentials: DecryptedCredentials): Promise<ModelInfo[]> {
    try {
      const response = await fetch(`${this.configuration.apiEndpoint}/models`, {
        headers: {
          'Authorization': `Bearer ${credentials.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: this.configuration.timeout,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`);
      }
      
      const data = await response.json();
      
      return data.data
        .filter((model: any) => model.id.startsWith('gpt-') || model.id.startsWith('text-'))
        .map((model: any) => ({
          id: model.id,
          name: this.formatModelName(model.id),
          description: this.getModelDescription(model.id),
          capabilities: {
            maxTokens: this.getModelMaxTokens(model.id),
            supportsChatCompletion: model.id.startsWith('gpt-'),
            supportsCompletion: true,
            costPer1KTokens: this.getModelCost(model.id),
          },
          recommended: this.isRecommendedModel(model.id),
        }));
        
    } catch (error) {
      console.warn('OpenAI model discovery failed, using defaults:', error);
      return this.getDefaultModels();
    }
  }
  
  protected getDefaultModels(): ModelInfo[] {
    return OpenAIAdapter.DEFAULT_MODELS.map(model => ({
      ...model,
      capabilities: {
        maxTokens: this.getModelMaxTokens(model.id),
        supportsChatCompletion: true,
        supportsCompletion: true,
        costPer1KTokens: this.getModelCost(model.id),
      },
      recommended: model.id === 'gpt-3.5-turbo',
    }));
  }
  
  protected validateRequest(request: LLMRequest): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Validate required fields
    if (!request.prompt && !request.messages) {
      errors.push('Either prompt or messages is required');
    }
    
    if (request.messages) {
      // Validate chat completion format
      if (!Array.isArray(request.messages)) {
        errors.push('Messages must be an array');
      } else {
        request.messages.forEach((msg, idx) => {
          if (!msg.role || !msg.content) {
            errors.push(`Message ${idx} missing role or content`);
          }
          if (!['system', 'user', 'assistant'].includes(msg.role)) {
            errors.push(`Message ${idx} has invalid role: ${msg.role}`);
          }
        });
      }
    }
    
    // Validate model
    if (request.model && !this.isValidModel(request.model)) {
      warnings.push(`Model ${request.model} may not be supported`);
    }
    
    // Validate parameters
    if (request.maxTokens && request.maxTokens > 4096) {
      warnings.push('Max tokens exceeds recommended limit for most models');
    }
    
    if (request.temperature && (request.temperature < 0 || request.temperature > 2)) {
      errors.push('Temperature must be between 0 and 2');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
  
  protected async performRequest(
    request: LLMRequest,
    credentials: DecryptedCredentials,
    options?: RequestOptions
  ): Promise<LLMResponse> {
    const endpoint = request.messages ? 
      `${this.configuration.apiEndpoint}/chat/completions` :
      `${this.configuration.apiEndpoint}/completions`;
    
    // Build request payload
    const payload = this.buildRequestPayload(request);
    
    // Execute request with retry logic
    const response = await this.executeWithRetry(async () => {
      const fetchResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'bin2nlp-frontend/1.0',
        },
        body: JSON.stringify(payload),
        timeout: this.configuration.timeout,
      });
      
      if (!fetchResponse.ok) {
        const errorData = await fetchResponse.json().catch(() => ({}));
        throw new AdapterError(
          errorData.error?.message || `HTTP ${fetchResponse.status}`,
          this.classifyError(fetchResponse.status),
          { status: fetchResponse.status, ...errorData }
        );
      }
      
      return fetchResponse.json();
    }, options?.maxRetries || this.configuration.maxRetries);
    
    return this.parseResponse(response, request);
  }
  
  private buildRequestPayload(request: LLMRequest): any {
    const basePayload = {
      model: request.model || this.configuration.defaultModel,
      temperature: request.temperature ?? this.configuration.providerSpecific?.temperature ?? 0.1,
      max_tokens: request.maxTokens ?? this.configuration.providerSpecific?.maxTokens ?? 4000,
      top_p: request.topP ?? this.configuration.providerSpecific?.topP ?? 1.0,
      frequency_penalty: this.configuration.providerSpecific?.frequencyPenalty ?? 0,
      presence_penalty: this.configuration.providerSpecific?.presencePenalty ?? 0,
    };
    
    if (request.messages) {
      return {
        ...basePayload,
        messages: request.messages,
      };
    } else {
      return {
        ...basePayload,
        prompt: request.prompt,
      };
    }
  }
  
  private parseResponse(response: any, originalRequest: LLMRequest): LLMResponse {
    const choice = response.choices?.[0];
    if (!choice) {
      throw new AdapterError(
        'No valid response from OpenAI',
        'RESPONSE_ERROR',
        { response }
      );
    }
    
    return {
      content: choice.message?.content || choice.text || '',
      finishReason: choice.finish_reason,
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
      model: response.model,
      providerId: this.providerId,
      metadata: {
        id: response.id,
        created: response.created,
        systemFingerprint: response.system_fingerprint,
      },
    };
  }
  
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Don't retry on certain error types
        if (error instanceof AdapterError) {
          if (['AUTHENTICATION_ERROR', 'VALIDATION_ERROR'].includes(error.code)) {
            throw error;
          }
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          const delay = this.configuration.retryDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError!;
  }
  
  private classifyError(status: number): string {
    if (status === 401) return 'AUTHENTICATION_ERROR';
    if (status === 400) return 'VALIDATION_ERROR';
    if (status === 429) return 'RATE_LIMIT_ERROR';
    if (status >= 500) return 'SERVER_ERROR';
    return 'REQUEST_ERROR';
  }
  
  private formatModelName(modelId: string): string {
    const nameMap: Record<string, string> = {
      'gpt-3.5-turbo': 'GPT-3.5 Turbo',
      'gpt-3.5-turbo-16k': 'GPT-3.5 Turbo 16K',
      'gpt-4': 'GPT-4',
      'gpt-4-turbo': 'GPT-4 Turbo',
      'gpt-4-turbo-preview': 'GPT-4 Turbo Preview',
    };
    
    return nameMap[modelId] || modelId.toUpperCase();
  }
  
  private getModelDescription(modelId: string): string {
    const descriptions: Record<string, string> = {
      'gpt-3.5-turbo': 'Fast and cost-effective for most tasks',
      'gpt-4': 'Most capable model for complex reasoning',
      'gpt-4-turbo': 'Latest GPT-4 with improved performance',
    };
    
    return descriptions[modelId] || 'OpenAI language model';
  }
  
  private getModelMaxTokens(modelId: string): number {
    const tokenLimits: Record<string, number> = {
      'gpt-3.5-turbo': 4096,
      'gpt-3.5-turbo-16k': 16384,
      'gpt-4': 8192,
      'gpt-4-turbo': 128000,
    };
    
    return tokenLimits[modelId] || 4096;
  }
  
  private getModelCost(modelId: string): number {
    // Cost per 1K tokens (input)
    const costs: Record<string, number> = {
      'gpt-3.5-turbo': 0.0015,
      'gpt-4': 0.03,
      'gpt-4-turbo': 0.01,
    };
    
    return costs[modelId] || 0.002;
  }
  
  private isValidModel(modelId: string): boolean {
    return modelId.startsWith('gpt-') || modelId.startsWith('text-');
  }
  
  private isRecommendedModel(modelId: string): boolean {
    return ['gpt-3.5-turbo', 'gpt-4'].includes(modelId);
  }
}
```

## State Management Integration

### LLM Providers Redux Slice

**llmProvidersSlice.ts - Comprehensive Provider State Management:**
```typescript
import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../store/store';
import type {
  ProviderConfiguration,
  ProviderInfo,
  ProviderHealthStatus,
  FailoverConfiguration,
  CredentialSet,
  ModelInfo,
  ProviderPreferences,
} from '../types/ProviderTypes';

interface LLMProvidersState {
  // Provider registry and discovery
  availableProviders: ProviderInfo[];
  lastProviderRefresh: string | null;
  providerDiscoveryLoading: boolean;
  
  // Provider configuration
  configuredProviders: Record<string, ProviderConfiguration>;
  activeProvider: string | null;
  providerPreferences: ProviderPreferences;
  
  // Credential management (session-based)
  credentials: Record<string, EncryptedCredentials>;
  credentialValidation: Record<string, {
    isValid: boolean;
    lastValidated: string;
    error?: string;
  }>;
  
  // Model management
  providerModels: Record<string, ModelInfo[]>;
  selectedModels: Record<string, string>; // providerId -> modelId
  modelDiscoveryLoading: Record<string, boolean>;
  
  // Health monitoring
  healthStatus: Record<string, ProviderHealthStatus>;
  healthMonitoring: {
    enabled: boolean;
    interval: number;
    lastFullCheck: string | null;
  };
  
  // Failover configuration
  failover: {
    enabled: boolean;
    configuration: FailoverConfiguration;
    history: FailoverEvent[];
    currentFailoverChain: string[];
    lastFailover: string | null;
  };
  
  // Usage tracking
  usage: {
    requestCounts: Record<string, number>; // providerId -> count
    totalCosts: Record<string, number>; // providerId -> estimated cost
    lastUsed: Record<string, string>; // providerId -> timestamp
    averageResponseTimes: Record<string, number>; // providerId -> ms
  };
  
  // UI state
  ui: {
    selectedProviderId: string | null;
    configurationDialog: {
      open: boolean;
      providerId: string | null;
    };
    healthMonitoringPanel: boolean;
    providerComparisonView: boolean;
    lastUserInteraction: string | null;
  };
  
  // Error handling
  errors: {
    discovery: string | null;
    configuration: Record<string, string>;
    health: Record<string, string>;
    failover: string | null;
  };
}

const initialState: LLMProvidersState = {
  availableProviders: [],
  lastProviderRefresh: null,
  providerDiscoveryLoading: false,
  
  configuredProviders: {},
  activeProvider: null,
  providerPreferences: {
    defaultProvider: null,
    priorityOrder: [],
    autoFailover: true,
    costThreshold: null,
    performanceThreshold: 5000, // 5 seconds
  },
  
  credentials: {},
  credentialValidation: {},
  
  providerModels: {},
  selectedModels: {},
  modelDiscoveryLoading: {},
  
  healthStatus: {},
  healthMonitoring: {
    enabled: false,
    interval: 60000, // 1 minute
    lastFullCheck: null,
  },
  
  failover: {
    enabled: false,
    configuration: {
      maxRetries: 3,
      retryDelay: 1000,
      healthThreshold: 0.8,
      priorityOrder: [],
      excludeProviders: [],
    },
    history: [],
    currentFailoverChain: [],
    lastFailover: null,
  },
  
  usage: {
    requestCounts: {},
    totalCosts: {},
    lastUsed: {},
    averageResponseTimes: {},
  },
  
  ui: {
    selectedProviderId: null,
    configurationDialog: { open: false, providerId: null },
    healthMonitoringPanel: false,
    providerComparisonView: false,
    lastUserInteraction: null,
  },
  
  errors: {
    discovery: null,
    configuration: {},
    health: {},
    failover: null,
  },
};

const llmProvidersSlice = createSlice({
  name: 'llmProviders',
  initialState,
  reducers: {
    // Provider discovery actions
    setAvailableProviders: (state, action: PayloadAction<ProviderInfo[]>) => {
      state.availableProviders = action.payload;
      state.lastProviderRefresh = new Date().toISOString();
      state.providerDiscoveryLoading = false;
      state.errors.discovery = null;
    },
    
    setProviderDiscoveryLoading: (state, action: PayloadAction<boolean>) => {
      state.providerDiscoveryLoading = action.payload;
    },
    
    setProviderDiscoveryError: (state, action: PayloadAction<string>) => {
      state.errors.discovery = action.payload;
      state.providerDiscoveryLoading = false;
    },
    
    // Provider configuration actions
    updateProviderConfig: (state, action: PayloadAction<{
      providerId: string;
      configuration: Partial<ProviderConfiguration>;
    }>) => {
      const { providerId, configuration } = action.payload;
      
      if (!state.configuredProviders[providerId]) {
        state.configuredProviders[providerId] = {
          providerId,
          enabled: true,
          priority: Object.keys(state.configuredProviders).length + 1,
          configuration: {},
          lastConfigured: new Date().toISOString(),
        };
      }
      
      state.configuredProviders[providerId] = {
        ...state.configuredProviders[providerId],
        configuration: {
          ...state.configuredProviders[providerId].configuration,
          ...configuration,
        },
        lastConfigured: new Date().toISOString(),
      };
      
      // Clear any configuration errors
      delete state.errors.configuration[providerId];
    },
    
    removeProviderConfig: (state, action: PayloadAction<string>) => {
      const providerId = action.payload;
      
      delete state.configuredProviders[providerId];
      delete state.credentials[providerId];
      delete state.credentialValidation[providerId];
      delete state.selectedModels[providerId];
      delete state.providerModels[providerId];
      delete state.healthStatus[providerId];
      delete state.errors.configuration[providerId];
      delete state.errors.health[providerId];
      
      // Update active provider if it was removed
      if (state.activeProvider === providerId) {
        const remainingProviders = Object.keys(state.configuredProviders);
        state.activeProvider = remainingProviders.length > 0 ? remainingProviders[0] : null;
      }
    },
    
    setActiveProvider: (state, action: PayloadAction<string | null>) => {
      state.activeProvider = action.payload;
      state.ui.lastUserInteraction = new Date().toISOString();
    },
    
    updateProviderPreferences: (state, action: PayloadAction<Partial<ProviderPreferences>>) => {
      state.providerPreferences = { ...state.providerPreferences, ...action.payload };
    },
    
    // Credential management actions
    setProviderCredentials: (state, action: PayloadAction<{
      providerId: string;
      credentials: EncryptedCredentials;
    }>) => {
      const { providerId, credentials } = action.payload;
      state.credentials[providerId] = credentials;
      
      // Reset validation status
      state.credentialValidation[providerId] = {
        isValid: false,
        lastValidated: new Date().toISOString(),
      };
    },
    
    clearProviderCredentials: (state, action: PayloadAction<string>) => {
      const providerId = action.payload;
      delete state.credentials[providerId];
      delete state.credentialValidation[providerId];
    },
    
    setCredentialValidation: (state, action: PayloadAction<{
      providerId: string;
      isValid: boolean;
      error?: string;
    }>) => {
      const { providerId, isValid, error } = action.payload;
      state.credentialValidation[providerId] = {
        isValid,
        lastValidated: new Date().toISOString(),
        error,
      };
    },
    
    // Model management actions
    setProviderModels: (state, action: PayloadAction<{
      providerId: string;
      models: ModelInfo[];
    }>) => {
      const { providerId, models } = action.payload;
      state.providerModels[providerId] = models;
      state.modelDiscoveryLoading[providerId] = false;
      
      // Auto-select first model if none selected
      if (!state.selectedModels[providerId] && models.length > 0) {
        const recommendedModel = models.find(m => m.recommended) || models[0];
        state.selectedModels[providerId] = recommendedModel.id;
      }
    },
    
    setModelDiscoveryLoading: (state, action: PayloadAction<{
      providerId: string;
      loading: boolean;
    }>) => {
      const { providerId, loading } = action.payload;
      state.modelDiscoveryLoading[providerId] = loading;
    },
    
    selectProviderModel: (state, action: PayloadAction<{
      providerId: string;
      modelId: string;
    }>) => {
      const { providerId, modelId } = action.payload;
      state.selectedModels[providerId] = modelId;
      state.ui.lastUserInteraction = new Date().toISOString();
    },
    
    // Health monitoring actions
    updateProviderHealth: (state, action: PayloadAction<{
      providerId: string;
      health: ProviderHealthStatus;
    }>) => {
      const { providerId, health } = action.payload;
      state.healthStatus[providerId] = {
        ...health,
        lastChecked: new Date().toISOString(),
      };
      
      // Clear health errors if status is healthy
      if (health.status === 'healthy') {
        delete state.errors.health[providerId];
      } else if (health.error) {
        state.errors.health[providerId] = health.error;
      }
    },
    
    setHealthMonitoring: (state, action: PayloadAction<{
      enabled: boolean;
      interval?: number;
    }>) => {
      const { enabled, interval } = action.payload;
      state.healthMonitoring.enabled = enabled;
      
      if (interval) {
        state.healthMonitoring.interval = interval;
      }
      
      if (enabled) {
        state.healthMonitoring.lastFullCheck = new Date().toISOString();
      }
    },
    
    // Failover management actions
    setFailoverEnabled: (state, action: PayloadAction<boolean>) => {
      state.failover.enabled = action.payload;
    },
    
    updateFailoverConfiguration: (state, action: PayloadAction<Partial<FailoverConfiguration>>) => {
      state.failover.configuration = {
        ...state.failover.configuration,
        ...action.payload,
      };
    },
    
    addFailoverEvent: (state, action: PayloadAction<{
      fromProvider: string;
      toProvider: string;
      reason: string;
      success: boolean;
    }>) => {
      const event: FailoverEvent = {
        id: `failover_${Date.now()}`,
        timestamp: new Date().toISOString(),
        fromProvider: action.payload.fromProvider,
        toProvider: action.payload.toProvider,
        reason: action.payload.reason,
        success: action.payload.success,
      };
      
      state.failover.history.unshift(event);
      state.failover.lastFailover = event.timestamp;
      
      // Keep only last 50 failover events
      state.failover.history = state.failover.history.slice(0, 50);
      
      // Update current failover chain
      if (event.success) {
        state.failover.currentFailoverChain = [action.payload.toProvider];
        state.activeProvider = action.payload.toProvider;
      }
    },
    
    // Usage tracking actions
    incrementRequestCount: (state, action: PayloadAction<string>) => {
      const providerId = action.payload;
      state.usage.requestCounts[providerId] = (state.usage.requestCounts[providerId] || 0) + 1;
      state.usage.lastUsed[providerId] = new Date().toISOString();
    },
    
    updateUsageMetrics: (state, action: PayloadAction<{
      providerId: string;
      cost?: number;
      responseTime?: number;
    }>) => {
      const { providerId, cost, responseTime } = action.payload;
      
      if (cost !== undefined) {
        state.usage.totalCosts[providerId] = (state.usage.totalCosts[providerId] || 0) + cost;
      }
      
      if (responseTime !== undefined) {
        const currentAvg = state.usage.averageResponseTimes[providerId] || responseTime;
        const requestCount = state.usage.requestCounts[providerId] || 1;
        state.usage.averageResponseTimes[providerId] = 
          (currentAvg * (requestCount - 1) + responseTime) / requestCount;
      }
      
      state.usage.lastUsed[providerId] = new Date().toISOString();
    },
    
    // UI state actions
    setSelectedProvider: (state, action: PayloadAction<string | null>) => {
      state.ui.selectedProviderId = action.payload;
    },
    
    setConfigurationDialog: (state, action: PayloadAction<{
      open: boolean;
      providerId?: string;
    }>) => {
      const { open, providerId } = action.payload;
      state.ui.configurationDialog = {
        open,
        providerId: open ? (providerId || null) : null,
      };
    },
    
    toggleHealthMonitoringPanel: (state) => {
      state.ui.healthMonitoringPanel = !state.ui.healthMonitoringPanel;
    },
    
    toggleProviderComparisonView: (state) => {
      state.ui.providerComparisonView = !state.ui.providerComparisonView;
    },
    
    // Error management actions
    setConfigurationError: (state, action: PayloadAction<{
      providerId: string;
      error: string;
    }>) => {
      const { providerId, error } = action.payload;
      state.errors.configuration[providerId] = error;
    },
    
    clearConfigurationError: (state, action: PayloadAction<string>) => {
      delete state.errors.configuration[action.payload];
    },
    
    setFailoverError: (state, action: PayloadAction<string>) => {
      state.errors.failover = action.payload;
    },
    
    clearAllErrors: (state) => {
      state.errors = {
        discovery: null,
        configuration: {},
        health: {},
        failover: null,
      };
    },
  },
});

export const {
  setAvailableProviders,
  setProviderDiscoveryLoading,
  setProviderDiscoveryError,
  updateProviderConfig,
  removeProviderConfig,
  setActiveProvider,
  updateProviderPreferences,
  setProviderCredentials,
  clearProviderCredentials,
  setCredentialValidation,
  setProviderModels,
  setModelDiscoveryLoading,
  selectProviderModel,
  updateProviderHealth,
  setHealthMonitoring,
  setFailoverEnabled,
  updateFailoverConfiguration,
  addFailoverEvent,
  incrementRequestCount,
  updateUsageMetrics,
  setSelectedProvider,
  setConfigurationDialog,
  toggleHealthMonitoringPanel,
  toggleProviderComparisonView,
  setConfigurationError,
  clearConfigurationError,
  setFailoverError,
  clearAllErrors,
} = llmProvidersSlice.actions;

export const llmProvidersReducer = llmProvidersSlice.reducer;

// Selectors
export const selectLLMProvidersState = (state: RootState) => state.llmProviders;
export const selectAvailableProviders = (state: RootState) => state.llmProviders.availableProviders;
export const selectConfiguredProviders = (state: RootState) => state.llmProviders.configuredProviders;
export const selectActiveProvider = (state: RootState) => state.llmProviders.activeProvider;
export const selectProviderCredentials = (state: RootState) => state.llmProviders.credentials;
export const selectProviderHealth = (state: RootState) => state.llmProviders.healthStatus;
export const selectFailoverConfiguration = (state: RootState) => state.llmProviders.failover;
export const selectProviderUsage = (state: RootState) => state.llmProviders.usage;

// Memoized selectors
export const selectHealthyProviders = createSelector(
  [selectConfiguredProviders, selectProviderHealth],
  (configuredProviders, healthStatus) => {
    return Object.keys(configuredProviders).filter(providerId => 
      healthStatus[providerId]?.status === 'healthy'
    );
  }
);

export const selectAvailableModels = createSelector(
  [selectLLMProvidersState, (_, providerId: string) => providerId],
  (state, providerId) => {
    return state.providerModels[providerId] || [];
  }
);

export const selectProviderByPriority = createSelector(
  [selectConfiguredProviders, selectProviderHealth],
  (configuredProviders, healthStatus) => {
    return Object.values(configuredProviders)
      .sort((a, b) => (a.priority || 999) - (b.priority || 999))
      .filter(provider => provider.enabled)
      .map(provider => ({
        ...provider,
        health: healthStatus[provider.providerId],
      }));
  }
);

export const selectFailoverCandidates = createSelector(
  [selectProviderByPriority, selectFailoverConfiguration],
  (providers, failoverConfig) => {
    if (!failoverConfig.enabled) return [];
    
    return providers
      .filter(provider => 
        !failoverConfig.configuration.excludeProviders.includes(provider.providerId)
      )
      .filter(provider => 
        provider.health?.status === 'healthy' || 
        provider.health?.status === 'degraded'
      );
  }
);

export const selectProviderStatistics = createSelector(
  [selectProviderUsage, selectProviderHealth],
  (usage, health) => {
    const statistics: Record<string, any> = {};
    
    Object.keys(usage.requestCounts).forEach(providerId => {
      statistics[providerId] = {
        requests: usage.requestCounts[providerId] || 0,
        totalCost: usage.totalCosts[providerId] || 0,
        averageResponseTime: usage.averageResponseTimes[providerId] || 0,
        lastUsed: usage.lastUsed[providerId],
        healthStatus: health[providerId]?.status || 'unknown',
        uptime: calculateUptime(providerId, health[providerId]),
      };
    });
    
    return statistics;
  }
);

// Helper function for uptime calculation
const calculateUptime = (providerId: string, health?: ProviderHealthStatus): number => {
  if (!health || !health.firstHealthy) return 0;
  
  const totalTime = Date.now() - new Date(health.firstHealthy).getTime();
  const downtime = health.totalDowntime || 0;
  
  return totalTime > 0 ? ((totalTime - downtime) / totalTime) * 100 : 0;
};
```

## Security Implementation Strategy

### Credential Security Service

**CredentialManager.ts - Comprehensive Credential Security:**
```typescript
export class CredentialManager {
  private static readonly STORAGE_KEY = 'llm_provider_credentials';
  private static readonly ENCRYPTION_ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  private static readonly IV_LENGTH = 96;
  
  private encryptionKey: CryptoKey | null = null;
  private sessionId: string;
  
  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeEncryption();
  }
  
  /**
   * Initialize Web Crypto API encryption key
   */
  private async initializeEncryption(): Promise<void> {
    try {
      // Generate or retrieve session encryption key
      const keyData = await this.getOrCreateSessionKey();
      
      this.encryptionKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: CredentialManager.ENCRYPTION_ALGORITHM },
        false,
        ['encrypt', 'decrypt']
      );
      
    } catch (error) {
      console.error('Failed to initialize encryption:', error);
      throw new Error('Credential security initialization failed');
    }
  }
  
  /**
   * Store encrypted credentials for a provider
   */
  async storeCredentials(
    providerId: string, 
    apiKey: string,
    metadata?: Record<string, any>
  ): Promise<EncryptedCredentials> {
    if (!this.encryptionKey) {
      await this.initializeEncryption();
    }
    
    try {
      // Validate API key format for provider
      this.validateApiKeyFormat(providerId, apiKey);
      
      // Create credentials object
      const credentials: DecryptedCredentials = {
        apiKey,
        providerId,
        metadata,
        createdAt: new Date().toISOString(),
        sessionId: this.sessionId,
      };
      
      // Encrypt credentials
      const encrypted = await this.encryptData(JSON.stringify(credentials));
      
      const encryptedCredentials: EncryptedCredentials = {
        providerId,
        encryptedData: encrypted.encryptedData,
        iv: encrypted.iv,
        createdAt: credentials.createdAt,
        sessionId: this.sessionId,
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours
      };
      
      // Store in session storage
      await this.storeEncryptedCredentials(providerId, encryptedCredentials);
      
      return encryptedCredentials;
      
    } catch (error) {
      console.error('Failed to store credentials:', error);
      throw new CredentialSecurityError(
        'Failed to securely store credentials',
        'ENCRYPTION_ERROR',
        error
      );
    }
  }
  
  /**
   * Retrieve and decrypt credentials for a provider
   */
  async retrieveCredentials(providerId: string): Promise<DecryptedCredentials | null> {
    try {
      const encryptedCredentials = await this.getStoredCredentials(providerId);
      
      if (!encryptedCredentials) {
        return null;
      }
      
      // Check expiration
      if (new Date() > new Date(encryptedCredentials.expiresAt)) {
        await this.removeCredentials(providerId);
        return null;
      }
      
      // Check session ID
      if (encryptedCredentials.sessionId !== this.sessionId) {
        await this.removeCredentials(providerId);
        return null;
      }
      
      // Decrypt credentials
      const decryptedData = await this.decryptData(
        encryptedCredentials.encryptedData,
        encryptedCredentials.iv
      );
      
      const credentials: DecryptedCredentials = JSON.parse(decryptedData);
      
      // Validate decrypted credentials
      if (credentials.providerId !== providerId || credentials.sessionId !== this.sessionId) {
        throw new Error('Credential integrity check failed');
      }
      
      return credentials;
      
    } catch (error) {
      console.error('Failed to retrieve credentials:', error);
      await this.removeCredentials(providerId);
      return null;
    }
  }
  
  /**
   * Validate API key against provider credentials
   */
  async validateCredentials(
    providerId: string,
    credentials?: DecryptedCredentials
  ): Promise<boolean> {
    try {
      const creds = credentials || await this.retrieveCredentials(providerId);
      
      if (!creds) {
        return false;
      }
      
      // Validate API key format
      if (!this.validateApiKeyFormat(providerId, creds.apiKey)) {
        return false;
      }
      
      // Test credentials with provider adapter
      const adapter = ProviderAdapterFactory.createAdapter(providerId);
      await adapter.initialize({}, { 
        providerId, 
        encryptedData: '', 
        iv: '', 
        createdAt: creds.createdAt,
        sessionId: this.sessionId,
        expiresAt: '',
      });
      
      const healthResult = await adapter.testConnection();
      return healthResult.status === 'healthy';
      
    } catch (error) {
      console.warn('Credential validation failed:', error);
      return false;
    }
  }
  
  /**
   * Remove credentials for a provider
   */
  async removeCredentials(providerId: string): Promise<void> {
    try {
      const storedCredentials = await this.getAllStoredCredentials();
      delete storedCredentials[providerId];
      
      if (Object.keys(storedCredentials).length === 0) {
        sessionStorage.removeItem(CredentialManager.STORAGE_KEY);
      } else {
        sessionStorage.setItem(
          CredentialManager.STORAGE_KEY,
          JSON.stringify({
            version: '1.0',
            sessionId: this.sessionId,
            credentials: storedCredentials,
            lastUpdated: new Date().toISOString(),
          })
        );
      }
      
    } catch (error) {
      console.error('Failed to remove credentials:', error);
    }
  }
  
  /**
   * Clear all stored credentials
   */
  async clearAllCredentials(): Promise<void> {
    try {
      sessionStorage.removeItem(CredentialManager.STORAGE_KEY);
      
      // Clear encryption key
      this.encryptionKey = null;
      
      // Generate new session ID
      this.sessionId = this.generateSessionId();
      
    } catch (error) {
      console.error('Failed to clear all credentials:', error);
    }
  }
  
  /**
   * Setup automatic credential cleanup
   */
  setupAutomaticCleanup(): () => void {
    // Cleanup on page unload
    const handleBeforeUnload = () => {
      this.clearAllCredentials();
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Periodic cleanup of expired credentials
    const cleanupInterval = setInterval(async () => {
      await this.cleanupExpiredCredentials();
    }, 5 * 60 * 1000); // Every 5 minutes
    
    // Cleanup on visibility change
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
  
  // Private helper methods
  private async getOrCreateSessionKey(): Promise<Uint8Array> {
    // Generate new key for each session (not persistent)
    const keyData = new Uint8Array(CredentialManager.KEY_LENGTH / 8);
    crypto.getRandomValues(keyData);
    return keyData;
  }
  
  private async encryptData(data: string): Promise<{
    encryptedData: string;
    iv: string;
  }> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }
    
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    // Generate random IV
    const iv = new Uint8Array(CredentialManager.IV_LENGTH / 8);
    crypto.getRandomValues(iv);
    
    // Encrypt data
    const encrypted = await crypto.subtle.encrypt(
      { name: CredentialManager.ENCRYPTION_ALGORITHM, iv },
      this.encryptionKey,
      dataBuffer
    );
    
    return {
      encryptedData: Array.from(new Uint8Array(encrypted))
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join(''),
      iv: Array.from(iv)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join(''),
    };
  }
  
  private async decryptData(encryptedData: string, ivHex: string): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }
    
    // Convert hex strings back to Uint8Array
    const encrypted = new Uint8Array(
      encryptedData.match(/.{2}/g)!.map(byte => parseInt(byte, 16))
    );
    const iv = new Uint8Array(
      ivHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16))
    );
    
    // Decrypt data
    const decrypted = await crypto.subtle.decrypt(
      { name: CredentialManager.ENCRYPTION_ALGORITHM, iv },
      this.encryptionKey,
      encrypted
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }
  
  private async storeEncryptedCredentials(
    providerId: string,
    credentials: EncryptedCredentials
  ): Promise<void> {
    const storedCredentials = await this.getAllStoredCredentials();
    storedCredentials[providerId] = credentials;
    
    const storageData = {
      version: '1.0',
      sessionId: this.sessionId,
      credentials: storedCredentials,
      lastUpdated: new Date().toISOString(),
    };
    
    sessionStorage.setItem(
      CredentialManager.STORAGE_KEY,
      JSON.stringify(storageData)
    );
  }
  
  private async getStoredCredentials(providerId: string): Promise<EncryptedCredentials | null> {
    const allCredentials = await this.getAllStoredCredentials();
    return allCredentials[providerId] || null;
  }
  
  private async getAllStoredCredentials(): Promise<Record<string, EncryptedCredentials>> {
    try {
      const stored = sessionStorage.getItem(CredentialManager.STORAGE_KEY);
      
      if (!stored) {
        return {};
      }
      
      const data = JSON.parse(stored);
      
      // Validate session ID
      if (data.sessionId !== this.sessionId) {
        sessionStorage.removeItem(CredentialManager.STORAGE_KEY);
        return {};
      }
      
      return data.credentials || {};
      
    } catch (error) {
      console.error('Failed to parse stored credentials:', error);
      sessionStorage.removeItem(CredentialManager.STORAGE_KEY);
      return {};
    }
  }
  
  private async cleanupExpiredCredentials(): Promise<void> {
    try {
      const allCredentials = await this.getAllStoredCredentials();
      const now = new Date();
      let hasExpired = false;
      
      Object.keys(allCredentials).forEach(providerId => {
        const credentials = allCredentials[providerId];
        if (new Date(credentials.expiresAt) <= now) {
          delete allCredentials[providerId];
          hasExpired = true;
        }
      });
      
      if (hasExpired) {
        if (Object.keys(allCredentials).length === 0) {
          sessionStorage.removeItem(CredentialManager.STORAGE_KEY);
        } else {
          sessionStorage.setItem(
            CredentialManager.STORAGE_KEY,
            JSON.stringify({
              version: '1.0',
              sessionId: this.sessionId,
              credentials: allCredentials,
              lastUpdated: new Date().toISOString(),
            })
          );
        }
      }
    } catch (error) {
      console.error('Failed to cleanup expired credentials:', error);
    }
  }
  
  private validateApiKeyFormat(providerId: string, apiKey: string): boolean {
    const formatValidators: Record<string, RegExp> = {
      openai: /^sk-[A-Za-z0-9]{48}$/,
      anthropic: /^sk-ant-api[0-9]{2}-[A-Za-z0-9_-]{95}$/,
      gemini: /^[A-Za-z0-9_-]{39}$/,
      ollama: /^.{1,100}$/, // Local setup can vary
    };
    
    const validator = formatValidators[providerId.toLowerCase()];
    if (!validator) {
      // Generic validation for unknown providers
      return apiKey.length >= 10 && apiKey.length <= 200;
    }
    
    return validator.test(apiKey);
  }
  
  private generateSessionId(): string {
    return `session_${Date.now()}_${crypto.getRandomValues(new Uint32Array(1))[0].toString(36)}`;
  }
}

// Custom error class for credential security
export class CredentialSecurityError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'CredentialSecurityError';
  }
}

// Utility functions for credential security
export const credentialSecurityUtils = {
  /**
   * Sanitize API key for logging (show only first and last 4 characters)
   */
  sanitizeApiKey: (apiKey: string): string => {
    if (!apiKey || apiKey.length < 8) {
      return '[REDACTED]';
    }
    
    return `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`;
  },
  
  /**
   * Validate credential strength and provide warnings
   */
  validateCredentialStrength: (providerId: string, apiKey: string): {
    isStrong: boolean;
    warnings: string[];
    score: number;
  } => {
    const warnings: string[] = [];
    let score = 100;
    
    // Length check
    if (apiKey.length < 20) {
      warnings.push('API key appears to be too short');
      score -= 30;
    }
    
    // Character diversity check
    if (apiKey === apiKey.toLowerCase() || apiKey === apiKey.toUpperCase()) {
      warnings.push('API key lacks character diversity');
      score -= 20;
    }
    
    // Common patterns check
    if (apiKey.includes('test') || apiKey.includes('demo') || apiKey.includes('example')) {
      warnings.push('API key appears to be a test or example key');
      score -= 50;
    }
    
    // Whitespace check
    if (apiKey.includes(' ') || apiKey.includes('\t') || apiKey.includes('\n')) {
      warnings.push('API key contains whitespace characters');
      score -= 40;
    }
    
    return {
      isStrong: warnings.length === 0 && score >= 70,
      warnings,
      score: Math.max(0, score),
    };
  },
  
  /**
   * Check if credentials are expired
   */
  isCredentialExpired: (credentials: EncryptedCredentials): boolean => {
    return new Date() > new Date(credentials.expiresAt);
  },
  
  /**
   * Calculate time until credential expiration
   */
  getTimeToExpiration: (credentials: EncryptedCredentials): number => {
    return new Date(credentials.expiresAt).getTime() - Date.now();
  },
};
```

## Testing Implementation Approach

### Provider Integration Testing

**ProviderManager.test.tsx - Comprehensive Testing:**
```typescript
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

import { ProviderManager } from './ProviderManager';
import { llmProvidersReducer } from '../../../store/slices/llmProvidersSlice';
import { ProviderAdapterFactory } from '../adapters/base/ProviderAdapterFactory';
import { CredentialManager } from '../services/CredentialManager';

// Mock Web Crypto API
const mockWebCrypto = {
  subtle: {
    generateKey: jest.fn(),
    importKey: jest.fn(),
    encrypt: jest.fn(),
    decrypt: jest.fn(),
  },
  getRandomValues: jest.fn((array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  }),
};

Object.defineProperty(window, 'crypto', { value: mockWebCrypto });

// Mock data
const mockProviders = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT models for advanced reasoning',
    capabilities: {
      supports_code_analysis: true,
      max_context_length: 4096,
      average_response_time_ms: 2000,
    },
    pricing_info: {
      input_cost_per_token: 0.0015,
      output_cost_per_token: 0.002,
      currency: 'USD',
    },
    supported_models: ['gpt-3.5-turbo', 'gpt-4'],
    status: 'available',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude models for detailed analysis',
    capabilities: {
      supports_code_analysis: true,
      max_context_length: 8192,
      average_response_time_ms: 3000,
    },
    pricing_info: {
      input_cost_per_token: 0.003,
      output_cost_per_token: 0.015,
      currency: 'USD',
    },
    supported_models: ['claude-3-sonnet', 'claude-3-opus'],
    status: 'available',
  },
];

// MSW server for API mocking
const server = setupServer(
  rest.get('/api/v1/llm-providers', (req, res, ctx) => {
    return res(ctx.json(mockProviders));
  }),
  
  rest.get('/api/v1/llm-providers/:providerId', (req, res, ctx) => {
    const { providerId } = req.params;
    const provider = mockProviders.find(p => p.id === providerId);
    
    if (!provider) {
      return res(ctx.status(404), ctx.json({ error: 'Provider not found' }));
    }
    
    return res(ctx.json({
      ...provider,
      detailed_info: {
        authentication_type: 'api_key',
        rate_limits: {
          requests_per_minute: 60,
          tokens_per_minute: 10000,
        },
        models: provider.supported_models.map(modelId => ({
          id: modelId,
          name: modelId.toUpperCase(),
          max_tokens: 4096,
          cost_per_1k_tokens: 0.002,
        })),
      },
    }));
  }),
  
  rest.post('/api/v1/llm-providers/:providerId/health-check', (req, res, ctx) => {
    const { providerId } = req.params;
    
    return res(ctx.json({
      provider_id: providerId,
      status: 'healthy',
      response_time_ms: 150,
      tested_at: new Date().toISOString(),
      capabilities_verified: ['code_analysis'],
    }));
  }),
  
  rest.get('/api/v1/llm-providers/:providerId/models', (req, res, ctx) => {
    const { providerId } = req.params;
    const provider = mockProviders.find(p => p.id === providerId);
    
    return res(ctx.json({
      models: provider?.supported_models.map(modelId => ({
        id: modelId,
        name: modelId.toUpperCase(),
        description: `${modelId} model for advanced reasoning`,
        capabilities: {
          max_tokens: 4096,
          supports_function_calling: true,
          supports_code_analysis: true,
        },
        pricing: {
          input_cost_per_1k_tokens: 0.0015,
          output_cost_per_1k_tokens: 0.002,
        },
        recommended: modelId.includes('turbo') || modelId.includes('sonnet'),
      })) || [],
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
      llmProviders: llmProvidersReducer,
    },
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

describe('ProviderManager - Multi-Provider Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock crypto operations
    mockWebCrypto.subtle.importKey.mockResolvedValue('mock-key');
    mockWebCrypto.subtle.encrypt.mockResolvedValue(new ArrayBuffer(32));
    mockWebCrypto.subtle.decrypt.mockResolvedValue(new ArrayBuffer(32));
  });

  describe('Provider Discovery and Configuration', () => {
    it('should discover available providers on load', async () => {
      render(
        <TestWrapper>
          <ProviderManager />
        </TestWrapper>
      );

      // Should show loading state initially
      expect(screen.getByText(/loading/i)).toBeInTheDocument();

      // Wait for providers to load
      await waitFor(() => {
        expect(screen.getByText('OpenAI')).toBeInTheDocument();
        expect(screen.getByText('Anthropic')).toBeInTheDocument();
      });

      // Should show provider capabilities
      expect(screen.getByText(/gpt models for advanced reasoning/i)).toBeInTheDocument();
      expect(screen.getByText(/claude models for detailed analysis/i)).toBeInTheDocument();
    });

    it('should handle provider configuration flow', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ProviderManager />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('OpenAI')).toBeInTheDocument();
      });

      // Select OpenAI provider
      const openaiCard = screen.getByText('OpenAI').closest('[role="button"]');
      expect(openaiCard).toBeInTheDocument();
      
      await user.click(openaiCard!);

      // Should show configuration options
      await waitFor(() => {
        expect(screen.getByLabelText(/api key/i)).toBeInTheDocument();
      });

      // Enter API key
      const apiKeyInput = screen.getByLabelText(/api key/i);
      await user.type(apiKeyInput, 'sk-test12345678901234567890123456789012345678901234567890');

      // Should validate API key format
      await waitFor(() => {
        expect(screen.queryByText(/invalid api key format/i)).not.toBeInTheDocument();
      });

      // Test connection button should appear
      const testButton = screen.getByRole('button', { name: /test connection/i });
      await user.click(testButton);

      // Should show success status
      await waitFor(() => {
        expect(screen.getByText(/healthy/i)).toBeInTheDocument();
      });
    });

    it('should handle invalid API key validation', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ProviderManager />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('OpenAI')).toBeInTheDocument();
      });

      // Select OpenAI provider
      const openaiCard = screen.getByText('OpenAI').closest('[role="button"]');
      await user.click(openaiCard!);

      // Enter invalid API key
      const apiKeyInput = await screen.findByLabelText(/api key/i);
      await user.type(apiKeyInput, 'invalid-key');

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/invalid api key format/i)).toBeInTheDocument();
      });

      // Test connection should not be available
      expect(screen.queryByRole('button', { name: /test connection/i })).not.toBeInTheDocument();
    });
  });

  describe('Model Discovery and Selection', () => {
    it('should discover models for configured providers', async () => {
      const user = userEvent.setup();
      
      const storeWithProvider = createTestStore({
        llmProviders: {
          configuredProviders: {
            openai: {
              providerId: 'openai',
              enabled: true,
              configuration: {},
            },
          },
          credentials: {
            openai: {
              providerId: 'openai',
              encryptedData: 'mock-encrypted',
              iv: 'mock-iv',
              createdAt: new Date().toISOString(),
              sessionId: 'test-session',
              expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            },
          },
        },
      });

      render(
        <TestWrapper store={storeWithProvider}>
          <ProviderManager />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('OpenAI')).toBeInTheDocument();
      });

      // Should automatically discover models
      await waitFor(() => {
        expect(screen.getByText(/gpt-3.5-turbo/i)).toBeInTheDocument();
        expect(screen.getByText(/gpt-4/i)).toBeInTheDocument();
      });

      // Should show model details
      expect(screen.getByText(/recommended/i)).toBeInTheDocument();
    });

    it('should handle model selection', async () => {
      const user = userEvent.setup();
      
      const storeWithModels = createTestStore({
        llmProviders: {
          configuredProviders: {
            openai: {
              providerId: 'openai',
              enabled: true,
              configuration: {},
            },
          },
          providerModels: {
            openai: [
              {
                id: 'gpt-3.5-turbo',
                name: 'GPT-3.5 Turbo',
                description: 'Fast and cost-effective',
                recommended: true,
              },
              {
                id: 'gpt-4',
                name: 'GPT-4',
                description: 'Most capable model',
                recommended: false,
              },
            ],
          },
          selectedModels: {
            openai: 'gpt-3.5-turbo',
          },
        },
      });

      render(
        <TestWrapper store={storeWithModels}>
          <ProviderManager />
        </TestWrapper>
      );

      // Should show selected model
      await waitFor(() => {
        expect(screen.getByDisplayValue('gpt-3.5-turbo')).toBeInTheDocument();
      });

      // Change model selection
      const modelSelect = screen.getByRole('combobox', { name: /model/i });
      await user.click(modelSelect);
      
      const gpt4Option = screen.getByText('GPT-4');
      await user.click(gpt4Option);

      // Should update selection
      expect(screen.getByDisplayValue('gpt-4')).toBeInTheDocument();
    });
  });

  describe('Health Monitoring', () => {
    it('should monitor provider health status', async () => {
      const storeWithProvider = createTestStore({
        llmProviders: {
          configuredProviders: {
            openai: {
              providerId: 'openai',
              enabled: true,
              configuration: {},
            },
          },
          healthStatus: {
            openai: {
              providerId: 'openai',
              status: 'healthy',
              responseTime: 150,
              lastChecked: new Date().toISOString(),
            },
          },
          healthMonitoring: {
            enabled: true,
            interval: 60000,
          },
        },
      });

      render(
        <TestWrapper store={storeWithProvider}>
          <ProviderManager />
        </TestWrapper>
      );

      // Should show health status
      await waitFor(() => {
        expect(screen.getByText(/healthy/i)).toBeInTheDocument();
        expect(screen.getByText(/150ms/i)).toBeInTheDocument();
      });

      // Should show health indicator
      const healthIndicator = screen.getByTestId('health-indicator');
      expect(healthIndicator).toHaveStyle({ color: 'green' }); // or appropriate healthy color
    });

    it('should handle provider health failures', async () => {
      const user = userEvent.setup();
      
      // Mock health check failure
      server.use(
        rest.post('/api/v1/llm-providers/:providerId/health-check', (req, res, ctx) => {
          return res(ctx.status(401), ctx.json({
            error: 'Invalid credentials',
          }));
        })
      );

      const storeWithProvider = createTestStore({
        llmProviders: {
          configuredProviders: {
            openai: {
              providerId: 'openai',
              enabled: true,
              configuration: {},
            },
          },
          credentials: {
            openai: {
              providerId: 'openai',
              encryptedData: 'mock-encrypted',
              iv: 'mock-iv',
              createdAt: new Date().toISOString(),
              sessionId: 'test-session',
              expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            },
          },
        },
      });

      render(
        <TestWrapper store={storeWithProvider}>
          <ProviderManager />
        </TestWrapper>
      );

      // Trigger health check
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      // Should show error status
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });
  });

  describe('Failover Configuration', () => {
    it('should configure failover settings', async () => {
      const user = userEvent.setup();
      
      const storeWithMultipleProviders = createTestStore({
        llmProviders: {
          configuredProviders: {
            openai: {
              providerId: 'openai',
              enabled: true,
              priority: 1,
              configuration: {},
            },
            anthropic: {
              providerId: 'anthropic',
              enabled: true,
              priority: 2,
              configuration: {},
            },
          },
        },
      });

      render(
        <TestWrapper store={storeWithMultipleProviders}>
          <ProviderManager />
        </TestWrapper>
      );

      // Navigate to failover tab
      const failoverTab = screen.getByRole('tab', { name: /failover/i });
      await user.click(failoverTab);

      // Should show failover configuration
      await waitFor(() => {
        expect(screen.getByText(/failover configuration/i)).toBeInTheDocument();
      });

      // Enable failover
      const enableFailoverToggle = screen.getByRole('switch', { name: /enable failover/i });
      await user.click(enableFailoverToggle);

      // Should show failover options
      expect(screen.getByText(/priority order/i)).toBeInTheDocument();
      expect(screen.getByText(/max retries/i)).toBeInTheDocument();
    });

    it('should handle failover execution', async () => {
      const mockFailoverCoordinator = {
        executeFailover: jest.fn().mockResolvedValue({
          success: true,
          newProvider: 'anthropic',
          reason: 'Primary provider health check failed',
        }),
      };

      const storeWithFailover = createTestStore({
        llmProviders: {
          configuredProviders: {
            openai: {
              providerId: 'openai',
              enabled: true,
              priority: 1,
              configuration: {},
            },
            anthropic: {
              providerId: 'anthropic',
              enabled: true,
              priority: 2,
              configuration: {},
            },
          },
          failover: {
            enabled: true,
            configuration: {
              maxRetries: 3,
              retryDelay: 1000,
              priorityOrder: ['openai', 'anthropic'],
            },
            history: [],
          },
          healthStatus: {
            openai: {
              providerId: 'openai',
              status: 'error',
              error: 'Connection timeout',
              lastChecked: new Date().toISOString(),
            },
            anthropic: {
              providerId: 'anthropic',
              status: 'healthy',
              responseTime: 200,
              lastChecked: new Date().toISOString(),
            },
          },
        },
      });

      render(
        <TestWrapper store={storeWithFailover}>
          <ProviderManager />
        </TestWrapper>
      );

      // Should show failover status
      await waitFor(() => {
        expect(screen.getByText(/failed over to anthropic/i)).toBeInTheDocument();
      });

      // Should show failover history
      expect(screen.getByText(/failover history/i)).toBeInTheDocument();
    });
  });

  describe('Embedded Mode Integration', () => {
    it('should work in embedded mode for job configuration', async () => {
      const mockOnProviderChange = jest.fn();
      
      render(
        <TestWrapper>
          <ProviderManager
            embedded={true}
            onProviderChange={mockOnProviderChange}
            initialProvider="openai"
            showComparison={false}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/llm provider selection/i)).toBeInTheDocument();
      });

      // Should show compact interface
      expect(screen.queryByRole('tab')).not.toBeInTheDocument();
      expect(screen.getByText('OpenAI')).toBeInTheDocument();

      // Should have initial provider selected
      expect(screen.getByDisplayValue('openai')).toBeInTheDocument();
    });

    it('should integrate with job submission workflow', async () => {
      const user = userEvent.setup();
      const mockOnProviderChange = jest.fn();
      
      render(
        <TestWrapper>
          <ProviderManager
            embedded={true}
            onProviderChange={mockOnProviderChange}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('OpenAI')).toBeInTheDocument();
      });

      // Select provider
      const providerSelect = screen.getByRole('combobox', { name: /provider/i });
      await user.click(providerSelect);
      await user.click(screen.getByText('OpenAI'));

      // Should call onChange callback
      expect(mockOnProviderChange).toHaveBeenCalledWith('openai', expect.any(Boolean));
    });
  });

  describe('Credential Security', () => {
    it('should encrypt credentials before storage', async () => {
      const user = userEvent.setup();
      const credentialManager = new CredentialManager();
      
      // Mock successful encryption
      mockWebCrypto.subtle.encrypt.mockResolvedValue(new ArrayBuffer(64));
      
      render(
        <TestWrapper>
          <ProviderManager />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('OpenAI')).toBeInTheDocument();
      });

      // Configure provider with API key
      const openaiCard = screen.getByText('OpenAI').closest('[role="button"]');
      await user.click(openaiCard!);

      const apiKeyInput = await screen.findByLabelText(/api key/i);
      await user.type(apiKeyInput, 'sk-test12345678901234567890123456789012345678901234567890');

      // Should encrypt credentials
      expect(mockWebCrypto.subtle.encrypt).toHaveBeenCalled();
    });

    it('should handle credential expiration', async () => {
      const expiredCredentials = {
        llmProviders: {
          credentials: {
            openai: {
              providerId: 'openai',
              encryptedData: 'expired-data',
              iv: 'expired-iv',
              createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
              sessionId: 'expired-session',
              expiresAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
            },
          },
        },
      };

      render(
        <TestWrapper store={createTestStore(expiredCredentials)}>
          <ProviderManager />
        </TestWrapper>
      );

      // Should not show expired credentials
      await waitFor(() => {
        expect(screen.queryByDisplayValue(/sk-/)).not.toBeInTheDocument();
      });

      // Should require re-authentication
      expect(screen.getByText(/authentication required/i)).toBeInTheDocument();
    });
  });
});
```

## Code Quality and Standards

### Comprehensive Type System

**Complete Provider Type Definitions:**
```typescript
// ProviderTypes.ts - Complete Provider System Types
export interface ProviderInfo {
  id: string;
  name: string;
  description: string;
  capabilities: ProviderCapabilities;
  pricing_info: PricingInfo;
  supported_models: string[];
  status: 'available' | 'degraded' | 'unavailable';
  last_updated: string;
}

export interface ProviderCapabilities {
  supports_code_analysis: boolean;
  supports_function_calling: boolean;
  max_context_length: number;
  average_response_time_ms: number;
  supports_streaming: boolean;
  rate_limits: {
    requests_per_minute: number;
    tokens_per_minute: number;
  };
}

export interface PricingInfo {
  input_cost_per_token: number;
  output_cost_per_token: number;
  currency: string;
  billing_model: 'per_token' | 'per_request' | 'subscription';
  volume_discounts?: VolumeDiscount[];
}

export interface VolumeDiscount {
  threshold: number;
  discount_percentage: number;
}

export interface ProviderConfiguration {
  providerId: string;
  enabled: boolean;
  priority: number;
  configuration: AdapterConfiguration;
  lastConfigured: string;
  preferences?: ProviderPreferences;
}

export interface ProviderPreferences {
  defaultProvider: string | null;
  priorityOrder: string[];
  autoFailover: boolean;
  costThreshold: number | null;
  performanceThreshold: number;
  excludeFromFailover: string[];
}

export interface AdapterConfiguration {
  apiEndpoint: string;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
  rateLimitPerMinute: number;
  defaultModel: string;
  providerSpecific?: Record<string, any>;
}

export interface ProviderHealthStatus {
  providerId: string;
  status: 'healthy' | 'degraded' | 'error' | 'unknown';
  responseTime: number;
  lastChecked: string;
  error?: string;
  uptime?: number;
  totalDowntime?: number;
  firstHealthy?: string;
  successRate?: number;
  additionalInfo?: Record<string, any>;
}

export interface FailoverConfiguration {
  maxRetries: number;
  retryDelay: number;
  healthThreshold: number;
  priorityOrder: string[];
  excludeProviders: string[];
  enableCircuitBreaker: boolean;
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number;
}

export interface FailoverEvent {
  id: string;
  timestamp: string;
  fromProvider: string;
  toProvider: string;
  reason: string;
  success: boolean;
  duration?: number;
  retryCount?: number;
}

// Credential Types
export interface EncryptedCredentials {
  providerId: string;
  encryptedData: string;
  iv: string;
  createdAt: string;
  sessionId: string;
  expiresAt: string;
}

export interface DecryptedCredentials {
  apiKey: string;
  providerId: string;
  metadata?: Record<string, any>;
  createdAt: string;
  sessionId: string;
}

export interface CredentialValidationResult {
  providerId: string;
  isValid: boolean;
  lastValidated: string;
  error?: string;
  warnings?: string[];
  strength?: CredentialStrength;
}

export interface CredentialStrength {
  score: number;
  isStrong: boolean;
  warnings: string[];
  recommendations: string[];
}

// Model Types
export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  capabilities: ModelCapabilities;
  pricing?: ModelPricing;
  recommended: boolean;
  status: 'active' | 'deprecated' | 'beta';
  lastUpdated?: string;
}

export interface ModelCapabilities {
  maxTokens: number;
  supportsChatCompletion: boolean;
  supportsCompletion: boolean;
  supportsCodeAnalysis: boolean;
  supportsFunctionCalling: boolean;
  supportsStreaming: boolean;
  contextWindow: number;
}

export interface ModelPricing {
  costPer1KTokens: number;
  costPer1KOutputTokens?: number;
  currency: string;
  effectiveDate: string;
}

// Request/Response Types
export interface LLMRequest {
  prompt?: string;
  messages?: ChatMessage[];
  model: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
  stream?: boolean;
  functions?: FunctionDefinition[];
  metadata?: Record<string, any>;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string;
  function_call?: FunctionCall;
}

export interface FunctionDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export interface FunctionCall {
  name: string;
  arguments: string;
}

export interface LLMResponse {
  content: string;
  finishReason: string;
  usage: TokenUsage;
  model: string;
  providerId: string;
  requestId?: string;
  processingTime?: number;
  metadata?: Record<string, any>;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

// Error Types
export interface AdapterError extends Error {
  code: string;
  providerId?: string;
  details?: any;
  retryable?: boolean;
  retryAfter?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface HealthCheckResult {
  providerId: string;
  status: 'healthy' | 'degraded' | 'error';
  responseTime: number;
  error?: string;
  testedAt: string;
  additionalInfo?: Record<string, any>;
}

// Configuration Types
export interface ProviderConfigurationOptions {
  enableHealthMonitoring: boolean;
  healthCheckInterval: number;
  enableFailover: boolean;
  credentialExpirationHours: number;
  maxConcurrentRequests: number;
  enableUsageTracking: boolean;
}

export interface RequestOptions {
  requestId?: string;
  priority?: 'low' | 'normal' | 'high';
  maxRetries?: number;
  timeout?: number;
  enableFallback?: boolean;
  fallbackProviders?: string[];
  metadata?: Record<string, any>;
}

// Usage Tracking Types
export interface ProviderUsageMetrics {
  providerId: string;
  requestCount: number;
  totalCost: number;
  averageResponseTime: number;
  successRate: number;
  lastUsed: string;
  totalTokens: number;
  errorCount: number;
  rateLimitExceeded: number;
}

export interface UsageReport {
  period: DateRange;
  providers: ProviderUsageMetrics[];
  totalCost: number;
  totalRequests: number;
  averageResponseTime: number;
  mostUsedProvider: string;
  recommendations: string[];
}

export interface DateRange {
  start: string;
  end: string;
}

// Component Props Types
export interface ProviderManagerProps {
  embedded?: boolean;
  onProviderChange?: (providerId: string, isValid: boolean) => void;
  initialProvider?: string;
  showComparison?: boolean;
  readOnly?: boolean;
}

export interface ProviderConfigurationProps {
  providers: ProviderInfo[];
  configuredProviders: Record<string, ProviderConfiguration>;
  credentials: Record<string, EncryptedCredentials>;
  onProviderSelect: (providerId: string) => void;
  onCredentialUpdate: (providerId: string, apiKey: string) => Promise<void>;
  onConfigureProvider: (providerId: string) => void;
}

export interface CredentialInputProps {
  providerId: string;
  currentCredentials?: EncryptedCredentials;
  onCredentialUpdate: (apiKey: string) => Promise<void>;
  onTestConnection: (apiKey: string) => Promise<boolean>;
  compact?: boolean;
  readOnly?: boolean;
}

// Hook Return Types
export interface UseProviderConfigurationReturn {
  configureProvider: (providerId: string, configuration: AdapterConfiguration) => Promise<void>;
  validateConfiguration: (providerId: string, configuration: AdapterConfiguration) => Promise<ValidationResult>;
  testConnection: (providerId: string, apiKey: string) => Promise<boolean>;
  clearConfiguration: (providerId: string) => Promise<void>;
  isConfiguring: boolean;
  configurationErrors: Record<string, string>;
}

export interface UseProviderHealthReturn {
  healthScores: Record<string, ProviderHealthStatus>;
  isMonitoring: boolean;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  refreshHealth: (providerId?: string) => Promise<void>;
  healthHistory: Record<string, ProviderHealthStatus[]>;
}

export interface UseFailoverCoordinationReturn {
  failoverEnabled: boolean;
  failoverHistory: FailoverEvent[];
  enableFailover: (configuration: FailoverConfiguration) => void;
  disableFailover: () => void;
  configureFailover: (configuration: Partial<FailoverConfiguration>) => void;
  executeFailover: (reason: string) => Promise<string | null>;
  canFailover: boolean;
}

// Utility Types
export type ProviderStatus = 'healthy' | 'degraded' | 'error' | 'unknown';
export type ProviderConfigurationStep = 'discovery' | 'credentials' | 'models' | 'testing' | 'complete';
export type FailoverReason = 'health_check_failed' | 'request_timeout' | 'rate_limit_exceeded' | 'authentication_error' | 'manual_override';
export type CredentialSecurityLevel = 'basic' | 'enhanced' | 'maximum';

// Constants
export interface ProviderConstants {
  DEFAULT_TIMEOUT: number;
  DEFAULT_MAX_RETRIES: number;
  DEFAULT_HEALTH_CHECK_INTERVAL: number;
  CREDENTIAL_EXPIRATION_HOURS: number;
  MAX_FAILOVER_ATTEMPTS: number;
  RATE_LIMIT_WINDOW_MS: number;
}

export interface SecurityConstants {
  ENCRYPTION_ALGORITHM: string;
  KEY_LENGTH: number;
  IV_LENGTH: number;
  SESSION_TIMEOUT_HOURS: number;
  CREDENTIAL_CLEANUP_INTERVAL_MS: number;
}
```

---

## Implementation Summary

This Technical Implementation Document provides comprehensive guidance for implementing the Multi-Provider LLM Integration with the following key characteristics:

**Provider Abstraction Architecture:**
- Unified adapter pattern with provider-specific implementations preserving individual capabilities
- Comprehensive provider registry supporting OpenAI, Anthropic, Gemini, and Ollama from launch
- Intelligent failover coordination with configurable priority, retry logic, and health monitoring
- Dynamic model discovery and selection with capability-based recommendations

**Security-First Implementation:**
- Web Crypto API encryption for credential protection with session-based storage
- Automatic credential cleanup and expiration management
- Memory protection against credential exposure in logs or debugging
- Secure transmission protocols with proper key lifecycle management

**Feature Integration:**
- Embedded mode for seamless job configuration integration
- Real-time health monitoring with hybrid background/on-demand validation
- Provider comparison tools with cost and performance analytics
- Session persistence with cross-tab coordination and cleanup

**Quality and Testing:**
- Comprehensive TypeScript integration with strict typing for all provider interfaces
- Security-focused testing with credential encryption and session management validation
- Multi-provider failover testing with various failure scenarios
- Performance testing with concurrent provider operations and health monitoring

This implementation ensures the Multi-Provider LLM Integration delivers reliable, secure, and flexible provider coordination while maintaining the architectural consistency established across all four core features of the bin2nlp-frontend project.

---

**Document Version:** 1.0  
**Last Updated:** 2025-08-31  
**Next Phase:** Task List Generation (006_generate-tasks.md)  
**Implementation Readiness:** Complete - All 4 TIDs now complete for task breakdown  
**TID Sequence Status:** ✅ COMPLETE (4/4 TIDs created)