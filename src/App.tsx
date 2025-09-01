import React from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { UploadPage } from './pages/UploadPage';
import { JobStatusDashboard } from './components/jobs/JobStatusDashboard';
import { LLMProviderDashboard } from './components/providers/LLMProviderDashboard';
import { SystemHealthDashboard } from './components/health/SystemHealthDashboard';
import { ResultsViewer } from './components/results/ResultsViewer';
import { Box, Typography, Alert, Card, CardContent } from '@mui/material';
import { useGetSystemHealthQuery } from './services/api/analysisApi';

// Simple routing state for demo (in production you'd use React Router)
const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = React.useState('dashboard');
  const [selectedJobId, setSelectedJobId] = React.useState<string | null>(null);

  // Check system health
  const { data: healthData, error: healthError, isLoading } = useGetSystemHealthQuery();

  const handleNavigate = (path: string) => {
    const pageMap: Record<string, string> = {
      '/': 'dashboard',
      '/upload': 'upload',
      '/jobs': 'jobs',
      '/results': 'results',
      '/providers': 'providers',
      '/health': 'health',
    };
    setCurrentPage(pageMap[path] || 'dashboard');
  };

  const handleViewResults = (jobId: string) => {
    setSelectedJobId(jobId);
    setCurrentPage('results');
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'upload':
        return <UploadPage />;
      case 'jobs':
        return <JobStatusDashboard onViewResults={handleViewResults} />;
      case 'providers':
        return <LLMProviderDashboard />;
      case 'health':
        return <SystemHealthDashboard />;
      case 'results':
        return selectedJobId ? (
          <ResultsViewer jobId={selectedJobId} />
        ) : (
          <Box>
            <Typography variant='h4' gutterBottom>
              Results
            </Typography>
            <Typography variant='body1' color='text.secondary'>
              Select a completed job from the Job Status dashboard to view its results.
            </Typography>
          </Box>
        );
      default:
        return (
          <Box>
            <Typography variant='h4' gutterBottom>
              Welcome to bin2nlp
            </Typography>
            <Typography variant='body1' color='text.secondary' paragraph>
              Binary-to-Natural-Language Processing Platform
            </Typography>
            <Typography variant='body2' paragraph>
              Upload binary files for decompilation and natural language translation using advanced
              AI models. Support for PE, ELF, Mach-O, and JAR formats with multi-provider LLM
              integration.
            </Typography>

            {/* System Status */}
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant='h6' gutterBottom>
                  System Status
                </Typography>
                {isLoading ? (
                  <Alert severity='info'>Connecting to bin2nlp API...</Alert>
                ) : healthError ? (
                  <Alert severity='warning'>
                    Unable to connect to bin2nlp API at http://localhost:8000. Please ensure the
                    backend is running.
                  </Alert>
                ) : healthData ? (
                  <Alert severity='success'>
                    Connected to bin2nlp API v{healthData.version} ({healthData.status})
                  </Alert>
                ) : null}
              </CardContent>
            </Card>

            {/* Navigation Help */}
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant='h6' gutterBottom>
                  Getting Started
                </Typography>
                <Typography variant='body2'>
                  • Use the <strong>Upload & Analyze</strong> section to submit binary files for
                  analysis
                  <br />• Monitor job progress in the <strong>Job Status</strong> dashboard
                  <br />• View analysis results in the <strong>Results</strong> section
                  <br />• Configure LLM providers in the <strong>LLM Providers</strong> settings
                  <br />• Check system health in the <strong>System Health</strong> monitor
                </Typography>
              </CardContent>
            </Card>
          </Box>
        );
    }
  };

  return <AppLayout onNavigate={handleNavigate}>{renderContent()}</AppLayout>;
};

const App: React.FC = () => {
  return <AppContent />;
};

export default App;
