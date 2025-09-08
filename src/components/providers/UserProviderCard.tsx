import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Button,
  Alert,
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as TestIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  useDeleteUserLLMProviderMutation,
  useTestUserLLMProviderMutation,
} from '../../services/api/analysisApi';
import type { UserLLMProvider } from '../../services/api/analysisApi';

interface UserProviderCardProps {
  provider: UserLLMProvider;
  onEdit: (provider: UserLLMProvider) => void;
  onProviderDeleted?: () => void;
}

export const UserProviderCard: React.FC<UserProviderCardProps> = ({
  provider,
  onEdit,
  onProviderDeleted,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [deleteProvider, { isLoading: isDeleting }] = useDeleteUserLLMProviderMutation();
  const [testProvider, { isLoading: isTesting }] = useTestUserLLMProviderMutation();

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    onEdit(provider);
    handleMenuClose();
  };

  const handleDelete = async () => {
    try {
      await deleteProvider(provider.id).unwrap();
      onProviderDeleted?.();
    } catch (error) {
      console.error('Failed to delete provider:', error);
    }
    handleMenuClose();
  };

  const handleTest = async () => {
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

  const getProviderTypeName = (type: string): string => {
    const typeNames: Record<string, string> = {
      openai: 'OpenAI',
      anthropic: 'Anthropic',
      gemini: 'Google Gemini',
      ollama: 'Ollama (Local)',
    };
    return typeNames[type] || type.toUpperCase();
  };

  const getProviderTypeColor = (type: string) => {
    const colors: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'> = {
      openai: 'success',
      anthropic: 'warning',
      gemini: 'info',
      ollama: 'secondary',
    };
    return colors[type] || 'primary';
  };

  return (
    <Card>
      <CardHeader
        avatar={
          provider.is_active ? (
            <ActiveIcon color="success" />
          ) : (
            <InactiveIcon color="disabled" />
          )
        }
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6">{provider.name}</Typography>
            <Chip
              size="small"
              label={getProviderTypeName(provider.provider_type)}
              color={getProviderTypeColor(provider.provider_type)}
            />
            {!provider.is_active && (
              <Chip size="small" label="INACTIVE" color="error" variant="outlined" />
            )}
          </Box>
        }
        subheader={
          <Box>
            <Typography variant="body2" color="text.secondary">
              Created: {new Date(provider.created_at).toLocaleDateString()}
            </Typography>
            {provider.endpoint_url && (
              <Typography variant="body2" color="text.secondary" noWrap>
                Endpoint: {provider.endpoint_url}
              </Typography>
            )}
          </Box>
        }
        action={
          <IconButton onClick={handleMenuOpen} disabled={isDeleting}>
            <MoreIcon />
          </IconButton>
        }
      />

      <CardContent>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <LoadingButton
            size="small"
            variant="outlined"
            startIcon={<TestIcon />}
            loading={isTesting}
            onClick={handleTest}
            disabled={!provider.is_active}
          >
            Test Connection
          </LoadingButton>
        </Box>

        {/* Configuration Details */}
        {Object.keys(provider.config_json || {}).length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Configuration:
            </Typography>
            <Box sx={{ p: 1, bgcolor: 'grey.50', borderRadius: 1, fontSize: '0.75rem' }}>
              {Object.entries(provider.config_json || {}).map(([key, value]) => (
                <Typography key={key} variant="caption" display="block">
                  <strong>{key}:</strong> {typeof value === 'string' ? value : JSON.stringify(value)}
                </Typography>
              ))}
            </Box>
          </Box>
        )}

        {/* Test Results */}
        {testResult && (
          <Alert severity={testResult.success ? 'success' : 'error'} sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Test Result:</strong> {testResult.message}
            </Typography>
          </Alert>
        )}
      </CardContent>

      {/* Action Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Card>
  );
};