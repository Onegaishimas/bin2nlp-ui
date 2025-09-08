import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import {
  useUpdateUserLLMProviderMutation,
  useTestUserLLMProviderMutation,
} from '../../services/api/analysisApi';
import type { UserLLMProvider, UserLLMProviderUpdate } from '../../services/api/analysisApi';

interface EditProviderDialogProps {
  open: boolean;
  provider: UserLLMProvider | null;
  onClose: () => void;
  onProviderUpdated?: (provider: UserLLMProvider) => void;
}

export const EditProviderDialog: React.FC<EditProviderDialogProps> = ({
  open,
  provider,
  onClose,
  onProviderUpdated,
}) => {
  const [formData, setFormData] = useState<UserLLMProviderUpdate>({
    name: '',
    api_key: '',
    endpoint_url: '',
    config_json: {},
    is_active: true,
  });
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [updateProvider, { isLoading: isUpdating }] = useUpdateUserLLMProviderMutation();
  const [testProvider, { isLoading: isTesting }] = useTestUserLLMProviderMutation();

  useEffect(() => {
    if (open && provider) {
      // Populate form with current provider data
      setFormData({
        name: provider.name,
        api_key: '', // Don't pre-fill API key for security
        endpoint_url: provider.endpoint_url || '',
        config_json: provider.config_json || {},
        is_active: provider.is_active,
      });
      setTestResult(null);
      setErrors({});
    } else if (!open) {
      // Reset form when dialog closes
      setFormData({
        name: '',
        api_key: '',
        endpoint_url: '',
        config_json: {},
        is_active: true,
      });
      setTestResult(null);
      setErrors({});
    }
  }, [open, provider]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Provider name is required';
    }

    // API key is optional for updates (only required if changing it)
    
    if (provider?.provider_type === 'ollama' && formData.endpoint_url && 
        !formData.endpoint_url.match(/^https?:\/\/.+/)) {
      newErrors.endpoint_url = 'Please enter a valid HTTP/HTTPS URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof UserLLMProviderUpdate, value: string | boolean | Record<string, any>) => {
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
    if (!provider || !validateForm()) return;

    try {
      const result = await testProvider(provider.id).unwrap();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        message: (error as { data?: { message?: string } })?.data?.message || 'Test failed',
      });
    }
  };

  const handleSave = async () => {
    if (!provider || !validateForm()) return;

    try {
      // Filter out empty values to avoid overwriting with empty strings
      const updateData: UserLLMProviderUpdate = {};
      
      if (formData.name && formData.name !== provider.name) {
        updateData.name = formData.name;
      }
      
      if (formData.api_key) {
        updateData.api_key = formData.api_key;
      }
      
      if (formData.endpoint_url !== provider.endpoint_url) {
        updateData.endpoint_url = formData.endpoint_url;
      }
      
      if (JSON.stringify(formData.config_json) !== JSON.stringify(provider.config_json)) {
        updateData.config_json = formData.config_json;
      }
      
      if (formData.is_active !== provider.is_active) {
        updateData.is_active = formData.is_active;
      }

      const updatedProvider = await updateProvider({
        id: provider.id,
        data: updateData,
      }).unwrap();

      onProviderUpdated?.(updatedProvider);
      onClose();
    } catch (error) {
      setErrors({
        save: 'Failed to update provider: ' + ((error as any)?.data?.message || 'Unknown error'),
      });
    }
  };

  const getProviderTypeName = (type: string): string => {
    const typeNames: Record<string, string> = {
      openai: 'OpenAI',
      anthropic: 'Anthropic',
      gemini: 'Google Gemini',
      ollama: 'Ollama (Local)',
    };
    return typeNames[type] || type.toUpperCase();
  };

  const requiresEndpoint = provider?.provider_type === 'ollama';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Edit {provider ? getProviderTypeName(provider.provider_type) : 'Provider'}
        <Typography variant="body2" color="text.secondary">
          Update your provider configuration and credentials
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            fullWidth
            label="Provider Name"
            value={formData.name || ''}
            onChange={e => handleInputChange('name', e.target.value)}
            error={!!errors.name}
            helperText={errors.name || 'Give this provider configuration a descriptive name'}
            placeholder={provider ? `My ${getProviderTypeName(provider.provider_type)} Provider` : ''}
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
              (provider?.provider_type === 'ollama' 
                ? 'For Ollama, you can use any placeholder value' 
                : 'Leave empty to keep current API key, or enter new one to update')
            }
            placeholder={
              provider?.provider_type === 'ollama' ? 'ollama-local' : 'Enter new API key to update...'
            }
          />

          {requiresEndpoint && (
            <TextField
              fullWidth
              label="Endpoint URL"
              value={formData.endpoint_url || ''}
              onChange={e => handleInputChange('endpoint_url', e.target.value)}
              error={!!errors.endpoint_url}
              helperText={errors.endpoint_url || 'The base URL for your Ollama server'}
              placeholder="http://localhost:11434/v1"
            />
          )}

          <FormControlLabel
            control={
              <Switch
                checked={formData.is_active}
                onChange={e => handleInputChange('is_active', e.target.checked)}
                color="primary"
              />
            }
            label="Active"
            sx={{ mt: 1 }}
          />

          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <LoadingButton
              variant="outlined"
              onClick={handleTest}
              loading={isTesting}
              disabled={!provider || !formData.is_active}
              size="small"
            >
              Test Connection
            </LoadingButton>
          </Box>

          {testResult && (
            <Alert severity={testResult.success ? 'success' : 'error'}>
              {testResult.message}
            </Alert>
          )}

          {errors.save && (
            <Alert severity="error">
              {errors.save}
            </Alert>
          )}

          {provider && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Current Configuration:
              </Typography>
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2"><strong>Type:</strong> {getProviderTypeName(provider.provider_type)}</Typography>
                <Typography variant="body2"><strong>Created:</strong> {new Date(provider.created_at).toLocaleString()}</Typography>
                <Typography variant="body2"><strong>Last Updated:</strong> {new Date(provider.updated_at).toLocaleString()}</Typography>
                {provider.endpoint_url && (
                  <Typography variant="body2"><strong>Current Endpoint:</strong> {provider.endpoint_url}</Typography>
                )}
                <Typography variant="body2"><strong>Status:</strong> {provider.is_active ? 'Active' : 'Inactive'}</Typography>
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <LoadingButton
          onClick={handleSave}
          loading={isUpdating}
          variant="contained"
        >
          Save Changes
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};