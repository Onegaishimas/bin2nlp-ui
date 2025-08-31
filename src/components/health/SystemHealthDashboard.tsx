import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Chip,
  Button,
  Grid,
  Alert,
  LinearProgress,
  Stack,
  Divider,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  CheckCircle as HealthyIcon,
  Warning as DegradedIcon,
  Error as DownIcon,
  Storage as DatabaseIcon,
  Folder as StorageIcon,
  Psychology as LLMIcon,
  Speed as ResponseTimeIcon,
} from '@mui/icons-material';
import { useGetSystemHealthQuery } from '../../services/api/analysisApi';

interface ServiceStatusProps {
  name: string;
  status: string;
  type?: string;
  responseTime?: number;
  message?: string;
  note?: string;
  icon: React.ReactElement;
}

const ServiceStatus: React.FC<ServiceStatusProps> = ({
  name,
  status,
  type,
  responseTime,
  message,
  note,
  icon,
}) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
        return 'success';
      case 'degraded':
        return 'warning';
      case 'down':
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
        return <HealthyIcon color="success" />;
      case 'degraded':
        return <DegradedIcon color="warning" />;
      case 'down':
      case 'error':
        return <DownIcon color="error" />;
      default:
        return <DownIcon color="disabled" />;
    }
  };

  const formatResponseTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <Card>
      <CardHeader
        avatar={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {icon}
            {getStatusIcon(status)}
          </Box>
        }
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6">{name}</Typography>
            <Chip
              size="small"
              label={status.toUpperCase()}
              color={getStatusColor(status) as 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'}
            />
          </Box>
        }
        subheader={type && `Type: ${type}`}
      />
      <CardContent>
        <Stack spacing={2}>
          {responseTime !== undefined && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ResponseTimeIcon color="action" />
              <Typography variant="body2">
                Response Time: {formatResponseTime(responseTime)}
              </Typography>
            </Box>
          )}

          {message && (
            <Alert severity="info" size="small">
              {message}
            </Alert>
          )}

          {note && (
            <Typography variant="body2" color="text.secondary">
              {note}
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export const SystemHealthDashboard: React.FC = () => {
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  
  const {
    data: healthData,
    isLoading,
    error,
    refetch,
  } = useGetSystemHealthQuery(undefined, {
    pollingInterval: 30000, // Poll every 30 seconds
    refetchOnFocus: true,
  });

  useEffect(() => {
    if (healthData) {
      setLastRefresh(new Date());
    }
  }, [healthData]);

  const handleRefresh = () => {
    refetch();
  };

  const getOverallStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
        return 'success';
      case 'degraded':
        return 'warning';
      case 'down':
        return 'error';
      default:
        return 'default';
    }
  };

  const getOverallStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
        return <HealthyIcon color="success" />;
      case 'degraded':
        return <DegradedIcon color="warning" />;
      case 'down':
        return <DownIcon color="error" />;
      default:
        return <DownIcon color="disabled" />;
    }
  };

  if (isLoading && !healthData) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          System Health Monitor
        </Typography>
        <Card>
          <CardContent>
            <LinearProgress />
            <Typography sx={{ mt: 2 }}>Loading system health status...</Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          System Health Monitor
        </Typography>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              Retry
            </Button>
          }
        >
          Failed to load system health: {(error as { message?: string })?.message || 'Unknown error'}
        </Alert>
      </Box>
    );
  }

  if (!healthData) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          System Health Monitor
        </Typography>
        <Alert severity="warning">
          No health data available.
        </Alert>
      </Box>
    );
  }

  const { status, timestamp, version, environment, services } = healthData;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        System Health Monitor
      </Typography>

      <Typography variant="body1" color="text.secondary" paragraph>
        Real-time monitoring of system components and services. 
        Updates automatically every 30 seconds.
      </Typography>

      {/* Overall System Status */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          avatar={getOverallStatusIcon(status)}
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h5">
                System Status: {status.charAt(0).toUpperCase() + status.slice(1)}
              </Typography>
              <Chip
                size="medium"
                label={status.toUpperCase()}
                color={getOverallStatusColor(status) as 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'}
              />
            </Box>
          }
          action={
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={isLoading}
              size="small"
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </Button>
          }
        />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="text.secondary">
                Version
              </Typography>
              <Typography variant="body1">
                {version}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="text.secondary">
                Environment
              </Typography>
              <Typography variant="body1">
                {environment}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="text.secondary">
                Last Updated
              </Typography>
              <Typography variant="body1">
                {new Date(timestamp).toLocaleString()}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Service Status Cards */}
      <Typography variant="h6" gutterBottom>
        Service Health Status
      </Typography>

      <Grid container spacing={3}>
        {/* Database Service */}
        <Grid item xs={12} md={4}>
          <ServiceStatus
            name="Database"
            status={services.database.status}
            type={services.database.type}
            responseTime={services.database.response_time_ms}
            icon={<DatabaseIcon />}
          />
        </Grid>

        {/* Storage Service */}
        <Grid item xs={12} md={4}>
          <ServiceStatus
            name="Storage"
            status={services.storage.status}
            type={services.storage.type}
            responseTime={services.storage.response_time_ms}
            icon={<StorageIcon />}
          />
        </Grid>

        {/* LLM Providers Service */}
        <Grid item xs={12} md={4}>
          <ServiceStatus
            name="LLM Providers"
            status={services.llm_providers.status}
            message={services.llm_providers.message}
            note={services.llm_providers.note}
            icon={<LLMIcon />}
          />
        </Grid>
      </Grid>

      {/* Additional Service Information */}
      <Card sx={{ mt: 3 }}>
        <CardHeader title="LLM Provider Details" />
        <CardContent>
          <Stack spacing={2}>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Supported Providers
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {services.llm_providers.supported_providers.map((provider) => (
                  <Chip
                    key={provider}
                    label={provider}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>

            <Divider />

            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Operation Mode
              </Typography>
              <Typography variant="body1">
                {services.llm_providers.mode}
              </Typography>
            </Box>

            {services.llm_providers.note && (
              <Alert severity="info" size="small">
                {services.llm_providers.note}
              </Alert>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Auto-refresh indicator */}
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Auto-refreshing every 30 seconds • Last refresh: {lastRefresh.toLocaleTimeString()}
        </Typography>
      </Box>
    </Box>
  );
};