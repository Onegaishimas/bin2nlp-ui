import { useEffect } from 'react';
import { Container, Typography, Box, Button, Alert, CircularProgress } from '@mui/material';
import { useAppSelector, useAppDispatch } from '@/store';
import { setCurrentView } from '@/store/slices/analysisSlice';
import { useGetSystemHealthQuery } from '@/services/api/analysisApi';
import { config } from '@/utils/config';

function App() {
  const dispatch = useAppDispatch();
  const currentView = useAppSelector(state => state.analysis.ui.currentView);

  // Check system health on app start
  const {
    data: healthData,
    error: healthError,
    isLoading: healthLoading,
  } = useGetSystemHealthQuery();

  const handleGetStarted = () => {
    dispatch(setCurrentView('submission'));
  };

  useEffect(() => {
    // Log app initialization
    console.info('bin2nlp UI initialized', {
      version: __APP_VERSION__,
      buildTime: __BUILD_TIME__,
      apiUrl: config.apiBaseUrl,
      environment: config.logLevel,
    });
  }, []);

  return (
    <Container maxWidth='lg'>
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Typography
          variant='h1'
          component='h1'
          gutterBottom
          align='center'
          sx={{ fontSize: { xs: '2.5rem', md: '3.5rem' } }}
        >
          bin2nlp
        </Typography>
        <Typography variant='h5' component='h2' gutterBottom align='center' color='text.secondary'>
          Binary-to-Natural-Language Processing Platform
        </Typography>

        {/* System Status */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
          {healthLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={20} />
              <Typography variant='body2' color='text.secondary'>
                Connecting to bin2nlp API...
              </Typography>
            </Box>
          ) : healthError ? (
            <Alert severity='warning' sx={{ maxWidth: 600 }}>
              Unable to connect to bin2nlp API at {config.apiBaseUrl}. Some features may not work.
            </Alert>
          ) : healthData ? (
            <Alert severity='success' sx={{ maxWidth: 600 }}>
              Connected to bin2nlp API v{healthData.version} ({healthData.status})
            </Alert>
          ) : null}
        </Box>

        {/* App Description */}
        <Typography
          variant='body1'
          align='center'
          color='text.secondary'
          sx={{ mb: 4, maxWidth: 800, mx: 'auto' }}
        >
          Upload binary files for decompilation and natural language translation using advanced AI
          models. Support for PE, ELF, Mach-O, and JAR formats with multi-provider LLM integration.
        </Typography>

        {/* Debug Info */}
        <Typography variant='body2' align='center' color='text.disabled' sx={{ mb: 2 }}>
          Current View: {currentView} | API: {config.apiBaseUrl}
        </Typography>

        {/* Action Button */}
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <Button
            variant='contained'
            size='large'
            onClick={handleGetStarted}
            disabled={healthLoading || !!healthError}
          >
            {healthLoading ? 'Connecting...' : healthError ? 'API Unavailable' : 'Get Started'}
          </Button>
        </Box>
      </Box>
    </Container>
  );
}

export default App;
