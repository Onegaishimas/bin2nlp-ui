import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Typography,
  Box,
  Chip,
  Alert,
  Collapse,
  Switch,
  FormControlLabel,
  Divider,
  Stack,
} from '@mui/material';
import {
  Psychology as AIIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import { useGetLLMProvidersQuery, useGetUserLLMProvidersQuery } from '../../services/api/analysisApi';
import type { JobSubmissionRequest } from '../../services/api/analysisApi';

interface JobConfigurationFormProps {
  onConfigChange: (config: Partial<JobSubmissionRequest>) => void;
  disabled?: boolean;
}

const ANALYSIS_DEPTH_OPTIONS = [
  {
    value: 'basic',
    label: 'Basic',
    description: 'Quick analysis with essential decompilation',
    icon: <SpeedIcon />,
    estimatedTime: '1-2 minutes',
  },
  {
    value: 'standard',
    label: 'Standard',
    description: 'Comprehensive analysis with detailed decompilation',
    icon: <SecurityIcon />,
    estimatedTime: '3-5 minutes',
  },
  {
    value: 'comprehensive',
    label: 'Comprehensive',
    description: 'Deep analysis with advanced techniques',
    icon: <AIIcon />,
    estimatedTime: '5-10 minutes',
  },
] as const;

const TRANSLATION_DETAIL_OPTIONS = [
  {
    value: 'basic',
    label: 'Basic',
    description: 'Essential function explanations',
  },
  {
    value: 'standard',
    label: 'Standard',
    description: 'Detailed explanations with context',
  },
  {
    value: 'detailed',
    label: 'Detailed',
    description: 'Comprehensive analysis with security insights',
  },
] as const;

export const JobConfigurationForm: React.FC<JobConfigurationFormProps> = ({
  onConfigChange,
  disabled = false,
}) => {
  const [analysisDepth, setAnalysisDepth] = useState<'basic' | 'standard' | 'comprehensive'>(
    'standard'
  );
  const [translationDetail, setTranslationDetail] = useState<'basic' | 'standard' | 'detailed'>(
    'standard'
  );
  const [useLLM, setUseLLM] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [customEndpoint, setCustomEndpoint] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Fetch user LLM providers
  const {
    data: userProvidersData,
    isLoading: userProvidersLoading,
    error: userProvidersError,
  } = useGetUserLLMProvidersQuery({});

  // Also fetch system providers as fallback/reference
  const {
    data: systemProvidersData,
    isLoading: systemProvidersLoading,
    error: systemProvidersError,
  } = useGetLLMProvidersQuery();

  // Use user providers primarily, with fallback to system if needed
  const providersData = userProvidersData;
  const providersLoading = userProvidersLoading;
  const providersError = userProvidersError;

  // Auto-expand advanced options for Ollama
  useEffect(() => {
    if (selectedProvider === 'ollama') {
      setShowAdvanced(true);
    }
  }, [selectedProvider]);

  // Update parent component when config changes
  useEffect(() => {
    const config: Partial<JobSubmissionRequest> = {
      analysis_depth: analysisDepth,
      translation_detail: translationDetail,
    };

    if (useLLM && selectedProvider) {
      // For user providers, we send the user provider ID
      config.llm_provider = selectedProvider; // This will be the user provider ID
      // API key and other configs are handled by the user provider configuration
    }

    onConfigChange(config);
  }, [
    analysisDepth,
    translationDetail,
    useLLM,
    selectedProvider,
    onConfigChange,
  ]);

  const selectedDepthOption = ANALYSIS_DEPTH_OPTIONS.find(opt => opt.value === analysisDepth);
  const selectedProviderData = providersData?.providers.find(
    p => p.id === selectedProvider
  );

  return (
    <Card>
      <CardHeader
        title='Analysis Configuration'
        subheader='Configure how your binary will be analyzed'
      />
      <CardContent>
        <Stack spacing={3}>
          {/* Analysis Depth */}
          <FormControl fullWidth>
            <InputLabel>Analysis Depth</InputLabel>
            <Select
              value={analysisDepth}
              label='Analysis Depth'
              onChange={e => setAnalysisDepth(e.target.value as typeof analysisDepth)}
              disabled={disabled}
            >
              {ANALYSIS_DEPTH_OPTIONS.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {option.icon}
                    <Box>
                      <Typography variant='body1'>{option.label}</Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {option.description} • Est. {option.estimatedTime}
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedDepthOption && (
            <Alert severity='info'>
              <Typography variant='body2'>
                <strong>{selectedDepthOption.label} Analysis:</strong>{' '}
                {selectedDepthOption.description}
                <br />
                <strong>Estimated time:</strong> {selectedDepthOption.estimatedTime}
              </Typography>
            </Alert>
          )}

          <Divider />

          {/* LLM Translation Toggle */}
          <FormControlLabel
            control={
              <Switch
                checked={useLLM}
                onChange={e => setUseLLM(e.target.checked)}
                disabled={disabled}
              />
            }
            label={
              <Box>
                <Typography variant='body1'>Enable AI Translation</Typography>
                <Typography variant='caption' color='text.secondary'>
                  Use LLM to translate decompiled code into natural language explanations
                </Typography>
              </Box>
            }
          />

          <Collapse in={useLLM}>
            <Stack spacing={2}>
              {/* Translation Detail */}
              <FormControl fullWidth>
                <InputLabel>Translation Detail Level</InputLabel>
                <Select
                  value={translationDetail}
                  label='Translation Detail Level'
                  onChange={e => setTranslationDetail(e.target.value as typeof translationDetail)}
                  disabled={disabled}
                >
                  {TRANSLATION_DETAIL_OPTIONS.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box>
                        <Typography variant='body1'>{option.label}</Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {option.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* LLM Provider Selection */}
              <FormControl fullWidth>
                <InputLabel>LLM Provider</InputLabel>
                <Select
                  value={selectedProvider}
                  label='LLM Provider'
                  onChange={e => {
                    setSelectedProvider(e.target.value);
                    setSelectedModel(''); // Reset model selection
                  }}
                  disabled={disabled || providersLoading}
                >
                  {providersData?.providers?.filter(p => p.is_active)?.map(provider => (
                    <MenuItem key={provider.id} value={provider.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        <Typography variant='body1'>{provider.name}</Typography>
                        <Box sx={{ ml: 'auto' }}>
                          <Chip
                            size='small'
                            label={provider.provider_type}
                            color='primary'
                            variant='outlined'
                          />
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {providersError && (
                <Alert severity='error'>
                  Failed to load LLM providers. Please check system health.
                </Alert>
              )}

              {/* Model Selection - For user providers, models are pre-configured */}
              {selectedProviderData && (
                <Alert severity='info'>
                  <Typography variant='body2'>
                    <strong>Provider Type:</strong> {selectedProviderData.provider_type}
                    <br />
                    <strong>Configuration:</strong> Models and settings are pre-configured for this provider
                    {selectedProviderData.endpoint_url && (
                      <>
                        <br />
                        <strong>Endpoint:</strong> {selectedProviderData.endpoint_url}
                      </>
                    )}
                  </Typography>
                </Alert>
              )}

              {/* API Key - For user providers, API keys are already configured */}
              {selectedProviderData && (
                <Alert severity='success'>
                  <Typography variant='body2'>
                    <strong>✅ API Key Configured:</strong> This provider is ready to use with your pre-configured API key
                    <br />
                    <strong>Provider:</strong> {selectedProviderData.name} ({selectedProviderData.provider_type})
                    <br />
                    <strong>Status:</strong> {selectedProviderData.is_active ? 'Active' : 'Inactive'}
                  </Typography>
                </Alert>
              )}

              {!selectedProvider && (
                <Alert severity='warning'>
                  <Typography variant='body2'>
                    <strong>No Provider Selected:</strong> Please select a user-configured provider above.
                    <br />
                    If you don't see any providers, <strong>add a provider</strong> in the LLM Providers section first.
                  </Typography>
                </Alert>
              )}

            </Stack>
          </Collapse>
        </Stack>
      </CardContent>
    </Card>
  );
};
