import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Chip,
  Button,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  LinearProgress,
} from '@mui/material';
import { GridLegacy as Grid } from '@mui/material';
import {
  Refresh as RefreshIcon,
  CheckCircle as HealthyIcon,
  Error as ErrorIcon,
  Help as UnknownIcon,
  PlayArrow as TestIcon,
} from '@mui/icons-material';
import {
  useGetLLMProvidersQuery,
  useTestLLMProviderMutation,
} from '../../services/api/analysisApi';
import type { LLMProvider } from '../../services/api/analysisApi';

interface ProviderCardProps {
  provider: LLMProvider;
  onTest: (providerId: string) => void;
  isTestingProvider: string | null;
}

const ProviderCard: React.FC<ProviderCardProps> = ({ provider, onTest, isTestingProvider }) => {
  const getStatusIcon = (status: LLMProvider['status']) => {
    switch (status) {
      case 'healthy':
        return <HealthyIcon color='success' />;
      case 'unhealthy':
        return <ErrorIcon color='error' />;
      case 'error':
        return <ErrorIcon color='error' />;
      case 'unknown':
        return <UnknownIcon color='disabled' />;
      default:
        return <UnknownIcon color='disabled' />;
    }
  };

  const getStatusColor = (status: LLMProvider['status']) => {
    switch (status) {
      case 'healthy':
        return 'success';
      case 'unhealthy':
        return 'error';
      case 'error':
        return 'error';
      case 'unknown':
        return 'default';
      default:
        return 'default';
    }
  };

  const getHealthScoreColor = (score: number | null): string => {
    if (score === null) return 'text.disabled';
    if (score >= 0.8) return 'success.main';
    if (score >= 0.6) return 'warning.main';
    return 'error.main';
  };

  const isTestingThisProvider = isTestingProvider === provider.provider_id;

  return (
    <Card>
      <CardHeader
        avatar={getStatusIcon(provider.status)}
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant='h6'>{provider.name}</Typography>
            <Chip
              size='small'
              label={provider.status.toUpperCase()}
              color={
                getStatusColor(provider.status) as
                  | 'primary'
                  | 'secondary'
                  | 'error'
                  | 'info'
                  | 'success'
                  | 'warning'
              }
            />
          </Box>
        }
        subheader={`Provider ID: ${provider.provider_id}`}
        action={
          <IconButton
            onClick={() => onTest(provider.provider_id)}
            disabled={isTestingThisProvider}
            color='primary'
          >
            {isTestingThisProvider ? <RefreshIcon className='spin' /> : <TestIcon />}
          </IconButton>
        }
      />
      <CardContent>
        <Stack spacing={2}>
          {/* Health Score */}
          {provider.health_score !== null && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant='body2' color='text.secondary'>
                  Health Score
                </Typography>
                <Typography variant='body2' color={getHealthScoreColor(provider.health_score)}>
                  {(provider.health_score * 100).toFixed(0)}%
                </Typography>
              </Box>
              <LinearProgress
                variant='determinate'
                value={provider.health_score * 100}
                color={
                  provider.health_score >= 0.8
                    ? 'success'
                    : provider.health_score >= 0.6
                      ? 'warning'
                      : 'error'
                }
              />
            </Box>
          )}

          {/* Cost Information */}
          <Box>
            <Typography variant='body2' color='text.secondary' gutterBottom>
              Pricing
            </Typography>
            <Typography variant='body1'>
              ${provider.cost_per_1k_tokens.toFixed(4)} per 1K tokens
            </Typography>
          </Box>

          {/* Available Models */}
          <Box>
            <Typography variant='body2' color='text.secondary' gutterBottom>
              Available Models ({provider.available_models.length})
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {provider.available_models.slice(0, 3).map(model => (
                <Chip key={model} label={model} size='small' variant='outlined' />
              ))}
              {provider.available_models.length > 3 && (
                <Chip
                  label={`+${provider.available_models.length - 3} more`}
                  size='small'
                  variant='outlined'
                  color='primary'
                />
              )}
            </Box>
          </Box>

          {/* Capabilities */}
          <Box>
            <Typography variant='body2' color='text.secondary' gutterBottom>
              Capabilities
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {provider.capabilities.map(capability => (
                <Chip
                  key={capability}
                  label={capability.replace(/_/g, ' ')}
                  size='small'
                  color='primary'
                />
              ))}
            </Box>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

export const LLMProviderDashboard: React.FC = () => {
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<
    Record<string, { status: string; message: string }>
  >({});
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testDialogProvider, setTestDialogProvider] = useState<LLMProvider | null>(null);
  const [testApiKey, setTestApiKey] = useState('');

  const { data: providersData, isLoading, error, refetch } = useGetLLMProvidersQuery();

  const [testProvider, { isLoading: isTestingConnection }] = useTestLLMProviderMutation();

  const handleTestProvider = async (providerId: string) => {
    const provider = providersData?.providers.find(p => p.provider_id === providerId);
    if (!provider) return;

    setTestDialogProvider(provider);
    setShowTestDialog(true);
  };

  const handleRunTest = async () => {
    if (!testDialogProvider) return;

    setTestingProvider(testDialogProvider.provider_id);
    setShowTestDialog(false);

    try {
      const result = await testProvider({
        providerId: testDialogProvider.provider_id,
      }).unwrap();

      setTestResults(prev => ({
        ...prev,
        [testDialogProvider.provider_id]: result,
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [testDialogProvider.provider_id]: {
          status: 'error',
          message: (error as { data?: { message?: string } })?.data?.message || 'Test failed',
        },
      }));
    } finally {
      setTestingProvider(null);
    }
  };

  const handleCloseTestDialog = () => {
    setShowTestDialog(false);
    setTestDialogProvider(null);
    setTestApiKey('');
  };

  if (isLoading) {
    return (
      <Box>
        <Typography variant='h4' gutterBottom>
          LLM Provider Management
        </Typography>
        <Card>
          <CardContent>
            <LinearProgress />
            <Typography sx={{ mt: 2 }}>Loading provider information...</Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant='h4' gutterBottom>
          LLM Provider Management
        </Typography>
        <Alert
          severity='error'
          action={
            <Button color='inherit' size='small' onClick={() => refetch()}>
              Retry
            </Button>
          }
        >
          Failed to load LLM providers:{' '}
          {(error as { message?: string })?.message || 'Unknown error'}
        </Alert>
      </Box>
    );
  }

  if (!providersData) {
    return (
      <Box>
        <Typography variant='h4' gutterBottom>
          LLM Provider Management
        </Typography>
        <Alert severity='warning'>No provider data available.</Alert>
      </Box>
    );
  }

  const { providers, recommended_provider, total_healthy, last_updated } = providersData;

  return (
    <Box>
      <Typography variant='h4' gutterBottom>
        LLM Provider Management
      </Typography>

      <Typography variant='body1' color='text.secondary' paragraph>
        Manage and monitor LLM providers for AI-powered binary analysis translation. Test
        connectivity and view real-time health status.
      </Typography>

      {/* Summary Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant='h3' color='primary.main'>
                {providers.length}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Total Providers
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant='h3' color='success.main'>
                {total_healthy}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Healthy Providers
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant='h6' color='text.primary'>
                {recommended_provider || 'None'}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Recommended Provider
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Provider List */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant='h6'>Providers ({providers.length})</Typography>
        <Box>
          <Typography variant='caption' color='text.secondary' sx={{ mr: 2 }}>
            Last updated: {new Date(last_updated).toLocaleString()}
          </Typography>
          <Button
            variant='outlined'
            startIcon={<RefreshIcon />}
            onClick={() => refetch()}
            size='small'
          >
            Refresh
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {providers.map(provider => (
          <Grid item xs={12} md={6} lg={4} key={provider.provider_id}>
            <ProviderCard
              provider={provider}
              onTest={handleTestProvider}
              isTestingProvider={testingProvider}
            />

            {/* Test Results */}
            {testResults[provider.provider_id] && (
              <Alert
                severity={
                  testResults[provider.provider_id]?.status === 'success' ? 'success' : 'error'
                }
                sx={{ mt: 1 }}
              >
                <Typography variant='body2'>
                  <strong>Test Result:</strong>{' '}
                  {testResults[provider.provider_id]?.message || 'Unknown result'}
                </Typography>
              </Alert>
            )}
          </Grid>
        ))}
      </Grid>

      {/* Test Connection Dialog */}
      <Dialog open={showTestDialog} onClose={handleCloseTestDialog} maxWidth='sm' fullWidth>
        <DialogTitle>Test Provider Connection: {testDialogProvider?.name}</DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary' paragraph>
            Test the connection to {testDialogProvider?.name} to verify it's working correctly. This
            will make a simple API call to check connectivity and authentication.
          </Typography>

          <TextField
            fullWidth
            label='API Key (Optional)'
            type='password'
            value={testApiKey}
            onChange={e => setTestApiKey(e.target.value)}
            helperText='Provide API key for authenticated testing (not stored)'
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTestDialog}>Cancel</Button>
          <Button onClick={handleRunTest} variant='contained' disabled={isTestingConnection}>
            {isTestingConnection ? 'Testing...' : 'Run Test'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
