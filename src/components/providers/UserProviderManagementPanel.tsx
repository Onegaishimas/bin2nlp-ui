import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  Fab,
  Grid,
  Card,
  CardContent,
  LinearProgress,
} from '@mui/material';
import { GridLegacy as GridLegacy } from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import {
  useGetUserLLMProvidersQuery,
} from '../../services/api/analysisApi';
import type { UserLLMProvider } from '../../services/api/analysisApi';
import { AddProviderDialog } from './AddProviderDialog';
import { EditProviderDialog } from './EditProviderDialog';
import { UserProviderCard } from './UserProviderCard';

export const UserProviderManagementPanel: React.FC = () => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingProvider, setEditingProvider] = useState<UserLLMProvider | null>(null);

  const { 
    data: providersData, 
    isLoading, 
    error, 
    refetch 
  } = useGetUserLLMProvidersQuery({});

  const handleAddProvider = () => {
    setShowAddDialog(true);
  };

  const handleEditProvider = (provider: UserLLMProvider) => {
    setEditingProvider(provider);
  };

  const handleProviderCreated = () => {
    refetch(); // Refresh the provider list
  };

  const handleProviderUpdated = () => {
    refetch(); // Refresh the provider list
  };

  const handleProviderDeleted = () => {
    refetch(); // Refresh the provider list
  };

  const handleCloseAddDialog = () => {
    setShowAddDialog(false);
  };

  const handleCloseEditDialog = () => {
    setEditingProvider(null);
  };

  if (isLoading) {
    return (
      <Box>
        <Typography variant="h5" gutterBottom>
          Your LLM Providers
        </Typography>
        <Card>
          <CardContent>
            <LinearProgress />
            <Typography sx={{ mt: 2 }}>Loading your provider configurations...</Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h5" gutterBottom>
          Your LLM Providers
        </Typography>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              Retry
            </Button>
          }
        >
          Failed to load your providers:{' '}
          {(error as { message?: string })?.message || 'Unknown error'}
        </Alert>
      </Box>
    );
  }

  const providers = providersData?.providers || [];
  const activeProviders = providers.filter(p => p.is_active);
  const totalProviders = providersData?.total || 0;
  const activeCount = providersData?.active_count || activeProviders.length;

  return (
    <Box sx={{ position: 'relative' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          Your LLM Providers
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => refetch()}
            size="small"
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddProvider}
          >
            Add Provider
          </Button>
        </Box>
      </Box>

      <Typography variant="body1" color="text.secondary" paragraph>
        Configure your own LLM providers with your API credentials. Keep your API keys secure and 
        manage multiple providers for different use cases.
      </Typography>

      {/* Summary Statistics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="primary.main">
                {totalProviders}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Providers
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="success.main">
                {activeCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Providers
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="info.main">
                {providers.filter(p => p.provider_type === 'ollama').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Local (Ollama)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Provider List */}
      {providers.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" gutterBottom>
              No providers configured
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              You haven't configured any LLM providers yet. Add your first provider to get started 
              with AI-powered binary analysis.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddProvider}
              size="large"
            >
              Add Your First Provider
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {providers.map(provider => (
            <Grid item xs={12} md={6} lg={4} key={provider.id}>
              <UserProviderCard
                provider={provider}
                onEdit={handleEditProvider}
                onProviderDeleted={handleProviderDeleted}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Floating Action Button for adding providers when list exists */}
      {providers.length > 0 && (
        <Fab
          color="primary"
          aria-label="add provider"
          onClick={handleAddProvider}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Dialogs */}
      <AddProviderDialog
        open={showAddDialog}
        onClose={handleCloseAddDialog}
        onProviderCreated={handleProviderCreated}
      />

      <EditProviderDialog
        open={Boolean(editingProvider)}
        provider={editingProvider}
        onClose={handleCloseEditDialog}
        onProviderUpdated={handleProviderUpdated}
      />
    </Box>
  );
};