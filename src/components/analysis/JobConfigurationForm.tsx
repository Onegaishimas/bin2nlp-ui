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
import { useGetLLMProvidersQuery } from '../../services/api/analysisApi';
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
  const [analysisDepth, setAnalysisDepth] = useState<'basic' | 'standard' | 'comprehensive'>('standard');
  const [translationDetail, setTranslationDetail] = useState<'basic' | 'standard' | 'detailed'>('standard');
  const [useLLM, setUseLLM] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [customEndpoint, setCustomEndpoint] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Fetch LLM providers
  const { data: providersData, isLoading: providersLoading, error: providersError } = useGetLLMProvidersQuery();

  // Update parent component when config changes
  useEffect(() => {
    const config: Partial<JobSubmissionRequest> = {
      analysis_depth: analysisDepth,
      translation_detail: translationDetail,
    };

    if (useLLM && selectedProvider) {
      config.llm_provider = selectedProvider;
      if (selectedModel) config.llm_model = selectedModel;
      if (apiKey) config.llm_api_key = apiKey;
      if (customEndpoint) config.llm_endpoint_url = customEndpoint;
    }

    onConfigChange(config);
  }, [analysisDepth, translationDetail, useLLM, selectedProvider, selectedModel, apiKey, customEndpoint, onConfigChange]);

  const selectedDepthOption = ANALYSIS_DEPTH_OPTIONS.find(opt => opt.value === analysisDepth);
  const selectedProvider = providersData?.providers.find(p => p.provider_id === selectedProvider);

  return (
    <Card>
      <CardHeader 
        title="Analysis Configuration" 
        subheader="Configure how your binary will be analyzed"
      />
      <CardContent>
        <Stack spacing={3}>
          {/* Analysis Depth */}
          <FormControl fullWidth>
            <InputLabel>Analysis Depth</InputLabel>
            <Select
              value={analysisDepth}
              label="Analysis Depth"
              onChange={(e) => setAnalysisDepth(e.target.value as typeof analysisDepth)}
              disabled={disabled}
            >
              {ANALYSIS_DEPTH_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {option.icon}
                    <Box>
                      <Typography variant="body1">{option.label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.description} • Est. {option.estimatedTime}
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedDepthOption && (
            <Alert severity="info">
              <Typography variant="body2">
                <strong>{selectedDepthOption.label} Analysis:</strong> {selectedDepthOption.description}
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
                onChange={(e) => setUseLLM(e.target.checked)}
                disabled={disabled}
              />
            }
            label={
              <Box>
                <Typography variant="body1">Enable AI Translation</Typography>
                <Typography variant="caption" color="text.secondary">
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
                  label="Translation Detail Level"
                  onChange={(e) => setTranslationDetail(e.target.value as typeof translationDetail)}
                  disabled={disabled}
                >
                  {TRANSLATION_DETAIL_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box>
                        <Typography variant="body1">{option.label}</Typography>
                        <Typography variant="caption" color="text.secondary">
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
                  label="LLM Provider"
                  onChange={(e) => {
                    setSelectedProvider(e.target.value);
                    setSelectedModel(''); // Reset model selection
                  }}
                  disabled={disabled || providersLoading}
                >
                  {providersData?.providers.map((provider) => (
                    <MenuItem key={provider.provider_id} value={provider.provider_id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        <Typography variant="body1">{provider.name}</Typography>
                        <Box sx={{ ml: 'auto' }}>
                          <Chip 
                            size="small" 
                            label={provider.status}
                            color={provider.status === 'healthy' ? 'success' : 'error'}
                          />
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {providersError && (
                <Alert severity="error">
                  Failed to load LLM providers. Please check system health.
                </Alert>
              )}

              {/* Model Selection */}
              {selectedProvider && (
                <FormControl fullWidth>
                  <InputLabel>Model</InputLabel>
                  <Select
                    value={selectedModel}
                    label="Model"
                    onChange={(e) => setSelectedModel(e.target.value)}
                    disabled={disabled}
                  >
                    {selectedProvider?.available_models.map((model) => (
                      <MenuItem key={model} value={model}>
                        <Typography variant="body1">{model}</Typography>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {/* API Key */}
              <TextField
                fullWidth
                type="password"
                label="API Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={disabled}
                placeholder="Enter your LLM provider API key"
                helperText="API key is stored only for this session and never persisted"
              />

              {/* Advanced Options */}
              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={showAdvanced}
                      onChange={(e) => setShowAdvanced(e.target.checked)}
                      size="small"
                    />
                  }
                  label="Advanced Options"
                />

                <Collapse in={showAdvanced}>
                  <Box sx={{ mt: 2 }}>
                    <TextField
                      fullWidth
                      label="Custom Endpoint URL"
                      value={customEndpoint}
                      onChange={(e) => setCustomEndpoint(e.target.value)}
                      disabled={disabled}
                      placeholder="https://api.custom-llm.com/v1"
                      helperText="Override the default API endpoint (optional)"
                    />
                  </Box>
                </Collapse>
              </Box>

              {/* Cost Estimation */}
              {selectedProvider && (
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>Estimated Cost:</strong> ~${selectedProvider.cost_per_1k_tokens.toFixed(4)} per 1K tokens
                    <br />
                    <strong>Capabilities:</strong> {selectedProvider.capabilities.join(', ')}
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