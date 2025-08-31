import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  LinearProgress,
  Chip,
  Box,
  Stack,
  IconButton,
  Alert,
  Divider,
  Grid,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Cancel as CancelIcon,
  CheckCircle as CompleteIcon,
  Error as ErrorIcon,
  Schedule as QueuedIcon,
  PlayArrow as ProcessingIcon,
  GetApp as DownloadIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useGetJobStatusQuery, useCancelJobMutation } from '../../services/api/analysisApi';
import { selectActiveJobs, selectActiveJobsCount } from '../../store/selectors/analysisSelectors';

interface JobStatusCardProps {
  jobId: string;
  onCancel?: (jobId: string) => void;
  onViewResults?: (jobId: string) => void;
}

const JobStatusCard: React.FC<JobStatusCardProps> = ({ 
  jobId, 
  onCancel, 
  onViewResults 
}) => {
  const { 
    data: jobStatus, 
    error, 
    isLoading,
    refetch 
  } = useGetJobStatusQuery(jobId, {
    pollingInterval: jobStatus?.isActive ? 2000 : 0, // Poll every 2 seconds for active jobs
    skipPollingIfUnfocused: true,
  });

  const [cancelJob, { isLoading: isCancelling }] = useCancelJobMutation();

  const handleCancel = async () => {
    if (!jobStatus?.isActive) return;
    
    try {
      await cancelJob(jobId).unwrap();
      onCancel?.(jobId);
    } catch (error) {
      console.error('Failed to cancel job:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'queued':
        return <QueuedIcon color="info" />;
      case 'processing':
        return <ProcessingIcon color="primary" />;
      case 'completed':
        return <CompleteIcon color="success" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      case 'cancelled':
        return <CancelIcon color="warning" />;
      default:
        return <QueuedIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'queued':
        return 'info';
      case 'processing':
        return 'primary';
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'cancelled':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  };

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">
            Failed to load job status: {(error as { message?: string })?.message || 'Unknown error'}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (isLoading && !jobStatus) {
    return (
      <Card>
        <CardContent>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 1 }}>
            Loading job status...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (!jobStatus) {
    return (
      <Card>
        <CardContent>
          <Alert severity="warning">
            Job not found or has been removed.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        avatar={getStatusIcon(jobStatus.status)}
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" component="span">
              Job {jobId.slice(0, 8)}...
            </Typography>
            <Chip
              size="small"
              label={jobStatus.status.toUpperCase()}
              color={getStatusColor(jobStatus.status) as 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'}
            />
          </Box>
        }
        subheader={`Updated: ${new Date(jobStatus.updated_at).toLocaleString()}`}
        action={
          <Box>
            <IconButton onClick={() => refetch()} disabled={isLoading}>
              <RefreshIcon />
            </IconButton>
            {jobStatus.isActive && (
              <IconButton 
                onClick={handleCancel}
                disabled={isCancelling}
                color="error"
              >
                <CancelIcon />
              </IconButton>
            )}
            {jobStatus.status === 'completed' && onViewResults && (
              <IconButton 
                onClick={() => onViewResults(jobId)}
                color="primary"
              >
                <DownloadIcon />
              </IconButton>
            )}
          </Box>
        }
      />
      <CardContent>
        <Stack spacing={2}>
          {/* Progress */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Progress
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {jobStatus.progress_percentage.toFixed(1)}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={jobStatus.progress_percentage}
              color={getStatusColor(jobStatus.status) as 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'}
            />
          </Box>

          {/* Current Stage */}
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Current Stage
            </Typography>
            <Typography variant="body1">
              {jobStatus.current_stage || 'Waiting to start...'}
            </Typography>
          </Box>

          {/* Worker Info */}
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Worker
            </Typography>
            <Typography variant="body1">
              {jobStatus.worker_id}
            </Typography>
          </Box>

          {/* Results Summary (if completed) */}
          {jobStatus.results && (
            <>
              <Divider />
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Results Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      Functions: <strong>{jobStatus.results.function_count}</strong>
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      Imports: <strong>{jobStatus.results.import_count}</strong>
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      Strings: <strong>{jobStatus.results.string_count}</strong>
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      Duration: <strong>{formatDuration(jobStatus.results.duration_seconds)}</strong>
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </>
          )}

          {/* Message */}
          {jobStatus.message && (
            <Alert severity={jobStatus.status === 'failed' ? 'error' : 'info'}>
              {jobStatus.message}
            </Alert>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export const JobStatusDashboard: React.FC = () => {
  const activeJobs = useSelector(selectActiveJobs);
  const activeJobCount = useSelector(selectActiveJobsCount);

  const handleCancelJob = (jobId: string) => {
    console.info(`Job ${jobId} cancelled`);
    // Job status will update automatically through polling
  };

  const handleViewResults = (jobId: string) => {
    console.info(`Viewing results for job ${jobId}`);
    // Navigate to results page - will be implemented with routing
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Job Status Dashboard
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Monitor your analysis jobs in real-time. Active jobs update automatically every 2 seconds.
      </Typography>

      {activeJobCount === 0 ? (
        <Alert severity="info">
          No active jobs. Upload a binary file to start analysis.
        </Alert>
      ) : (
        <Stack spacing={2}>
          <Typography variant="h6">
            Active Jobs ({activeJobCount})
          </Typography>
          
          {Object.entries(activeJobs).map(([jobId]) => (
            <JobStatusCard
              key={jobId}
              jobId={jobId}
              onCancel={handleCancelJob}
              onViewResults={handleViewResults}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
};