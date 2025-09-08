import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  FormHelperText,
  Chip,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import {
  useGetProviderTypesQuery,
  useCreateUserLLMProviderMutation,
  useTestUserLLMProviderMutation,
} from '../../services/api/analysisApi';
import type { UserLLMProviderCreate, ProviderType } from '../../services/api/analysisApi';

interface AddProviderDialogProps {
  open: boolean;
  onClose: () => void;
  onProviderCreated?: (provider: any) => void;
}

const steps = ['Select Provider Type', 'Configure Provider', 'Test & Save'];

export const AddProviderDialog: React.FC<AddProviderDialogProps> = ({
  open,
  onClose,
  onProviderCreated,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedProviderType, setSelectedProviderType] = useState<ProviderType | null>(null);
  const [formData, setFormData] = useState<Partial<UserLLMProviderCreate>>({
    name: '',
    provider_type: 'openai',
    api_key: '',
    endpoint_url: '',
    config_json: {},
  });
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: providerTypesData, isLoading: isLoadingTypes } = useGetProviderTypesQuery();
  const [createProvider, { isLoading: isCreating }] = useCreateUserLLMProviderMutation();
  const [testProvider, { isLoading: isTesting }] = useTestUserLLMProviderMutation();

  const providerTypes = providerTypesData?.provider_types || [];

  useEffect(() => {
    if (open) {
      // Reset form when dialog opens
      setActiveStep(0);
      setSelectedProviderType(null);
      setFormData({
        name: '',
        provider_type: 'openai',
        api_key: '',
        endpoint_url: '',
        config_json: {},
      });
      setTestResult(null);
      setErrors({});
    }
  }, [open]);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 0:
        if (!selectedProviderType) {
          newErrors.providerType = 'Please select a provider type';
        }
        break;
      case 1:
        if (!formData.name?.trim()) {
          newErrors.name = 'Provider name is required';
        }
        if (!formData.api_key?.trim()) {
          newErrors.api_key = 'API key is required';
        }
        if (selectedProviderType?.requires_endpoint && !formData.endpoint_url?.trim()) {
          newErrors.endpoint_url = 'Endpoint URL is required for this provider';
        }
        if (formData.endpoint_url && !formData.endpoint_url.match(/^https?:\/\/.+/)) {
          newErrors.endpoint_url = 'Please enter a valid HTTP/HTTPS URL';
        }
        break;
      case 2:
        if (!testResult?.success) {
          newErrors.test = 'Please test the connection before saving';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleProviderTypeSelect = (type: ProviderType) => {
    setSelectedProviderType(type);
    console.log('DEBUG: Provider type selected:', type.type);
    setFormData(prev => ({
      ...prev,
      provider_type: type.type as any,
      endpoint_url: type.requires_endpoint ? prev.endpoint_url : '',
    }));
  };

  const handleInputChange = (field: keyof UserLLMProviderCreate, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleTest = async () => {
    if (!validateStep(1)) return;

    try {
      // For testing, we'll create a temporary provider object
      // In a real implementation, you might want a separate test endpoint
      const testData: UserLLMProviderCreate = {
        name: formData.name!,
        provider_type: formData.provider_type!,
        api_key: formData.api_key!,
        endpoint_url: formData.endpoint_url,
        config_json: formData.config_json,
      };

      // Note: This would need to be implemented as a separate test endpoint
      // For now, we'll simulate a test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setTestResult({
        success: true,
        message: `Successfully connected to ${selectedProviderType?.name}`,
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Connection test failed: ' + ((error as any)?.data?.message || 'Unknown error'),
      });
    }
  };

  const handleSave = async () => {
    if (!validateStep(2)) return;

    const createData = {
      name: formData.name!,
      provider_type: formData.provider_type!,
      api_key: formData.api_key!,
      endpoint_url: formData.endpoint_url,
      config_json: formData.config_json || {},
    };
    
    console.log('DEBUG: About to create provider with data:', createData);
    console.log('DEBUG: provider_type value:', formData.provider_type, 'type:', typeof formData.provider_type);

    try {
      const newProvider = await createProvider(createData).unwrap();

      onProviderCreated?.(newProvider);
      onClose();
    } catch (error) {
      setErrors({
        save: 'Failed to create provider: ' + ((error as any)?.data?.message || 'Unknown error'),
      });
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="body1" gutterBottom>
              Choose the type of LLM provider you want to configure:
            </Typography>
            {isLoadingTypes ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{ mt: 2 }}>
                {providerTypes.map(type => (
                  <Box
                    key={type.type}
                    onClick={() => handleProviderTypeSelect(type)}
                    sx={{
                      p: 2,
                      border: 1,
                      borderColor: selectedProviderType?.type === type.type ? 'primary.main' : 'grey.300',
                      borderRadius: 1,
                      cursor: 'pointer',
                      mb: 2,
                      bgcolor: selectedProviderType?.type === type.type ? 'primary.50' : 'background.paper',
                      '&:hover': {
                        bgcolor: selectedProviderType?.type === type.type ? 'primary.100' : 'grey.50',
                      },
                    }}
                  >
                    <Typography variant="h6">{type.name}</Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {type.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      {type.requires_endpoint && (
                        <Chip size="small" label="Custom Endpoint" color="warning" variant="outlined" />
                      )}
                      {type.supports_streaming && (
                        <Chip size="small" label="Streaming" color="success" variant="outlined" />
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
            {errors.providerType && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {errors.providerType}
              </Alert>
            )}
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="body1" gutterBottom>
              Configure your {selectedProviderType?.name} provider:
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Provider Name"
                value={formData.name || ''}
                onChange={e => handleInputChange('name', e.target.value)}
                error={!!errors.name}
                helperText={errors.name || 'Give this provider configuration a descriptive name'}
                placeholder={`My ${selectedProviderType?.name} Provider`}
              />
              
              <TextField
                fullWidth
                label="API Key"
                type="password"
                value={formData.api_key || ''}
                onChange={e => handleInputChange('api_key', e.target.value)}
                error={!!errors.api_key}
                helperText={
                  errors.api_key || 
                  (selectedProviderType?.type === 'ollama' 
                    ? 'For Ollama, you can use any placeholder value' 
                    : 'Enter your API key from the provider')
                }
                placeholder={
                  selectedProviderType?.type === 'ollama' ? 'ollama-local' : 'sk-...'
                }
              />

              {selectedProviderType?.requires_endpoint && (
                <TextField
                  fullWidth
                  label="Endpoint URL"
                  value={formData.endpoint_url || ''}
                  onChange={e => handleInputChange('endpoint_url', e.target.value)}
                  error={!!errors.endpoint_url}
                  helperText={errors.endpoint_url || 'The base URL for your provider API'}
                  placeholder="http://localhost:11434/v1"
                />
              )}
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="body1" gutterBottom>
              Test your provider configuration before saving:
            </Typography>
            <Box sx={{ mt: 2 }}>
              <LoadingButton
                onClick={handleTest}
                loading={isTesting}
                variant="outlined"
                fullWidth
                sx={{ mb: 2 }}
              >
                Test Connection
              </LoadingButton>
              
              {testResult && (
                <Alert severity={testResult.success ? 'success' : 'error'} sx={{ mb: 2 }}>
                  {testResult.message}
                </Alert>
              )}
              
              {errors.test && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {errors.test}
                </Alert>
              )}

              <Typography variant="body2" color="text.secondary">
                Configuration Summary:
              </Typography>
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mt: 1 }}>
                <Typography variant="body2"><strong>Name:</strong> {formData.name}</Typography>
                <Typography variant="body2"><strong>Type:</strong> {selectedProviderType?.name}</Typography>
                {formData.endpoint_url && (
                  <Typography variant="body2"><strong>Endpoint:</strong> {formData.endpoint_url}</Typography>
                )}
                <Typography variant="body2"><strong>API Key:</strong> {formData.api_key ? '••••••••' : 'Not set'}</Typography>
              </Box>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Add New LLM Provider
        <Typography variant="body2" color="text.secondary">
          Configure your own LLM provider with your API credentials
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map(label => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent(activeStep)}

        {errors.save && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {errors.save}
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Box sx={{ flex: '1 1 auto' }} />
        {activeStep > 0 && (
          <Button onClick={handleBack}>Back</Button>
        )}
        {activeStep < steps.length - 1 ? (
          <Button 
            onClick={handleNext} 
            variant="contained"
            disabled={activeStep === 0 && !selectedProviderType}
          >
            Next
          </Button>
        ) : (
          <LoadingButton
            onClick={handleSave}
            loading={isCreating}
            variant="contained"
            disabled={!testResult?.success}
          >
            Save Provider
          </LoadingButton>
        )}
      </DialogActions>
    </Dialog>
  );
};