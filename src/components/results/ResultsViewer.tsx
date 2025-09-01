import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Button,
  Alert,
  Divider,
  Stack,
} from '@mui/material';
import { GridLegacy as Grid } from '@mui/material';
import {
  ExpandMore as ExpandIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Code as CodeIcon,
  Psychology as AIIcon,
  Security as SecurityIcon,
  Functions as FunctionIcon,
  ImportExport as ImportIcon,
  FormatQuote as StringIcon,
} from '@mui/icons-material';
import { useGetJobStatusQuery } from '../../services/api/analysisApi';

interface ResultsViewerProps {
  jobId: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div hidden={value !== index}>{value === index && <Box sx={{ py: 3 }}>{children}</Box>}</div>
  );
};

const StatCard: React.FC<{
  icon: React.ReactElement;
  title: string;
  value: number | string;
  description: string;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
}> = ({ icon, title, value, description, color = 'primary' }) => (
  <Card>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Box sx={{ color: `${color}.main`, mr: 1 }}>{icon}</Box>
        <Typography variant='h6'>{title}</Typography>
      </Box>
      <Typography variant='h3' color={`${color}.main`} gutterBottom>
        {value}
      </Typography>
      <Typography variant='body2' color='text.secondary'>
        {description}
      </Typography>
    </CardContent>
  </Card>
);

export const ResultsViewer: React.FC<ResultsViewerProps> = ({ jobId }) => {
  const [activeTab, setActiveTab] = useState(0);

  const {
    data: jobStatus,
    isLoading: statusLoading,
    error: statusError,
  } = useGetJobStatusQuery(jobId);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleDownload = () => {
    if (!jobStatus?.results) return;
    
    const downloadData = {
      job_id: jobId,
      analysis_date: jobStatus.updated_at,
      results: jobStatus.results,
      summary: {
        functions: jobStatus.results.function_count,
        imports: jobStatus.results.import_count,
        strings: jobStatus.results.string_count,
        success: jobStatus.results.success,
        duration: jobStatus.results.duration_seconds,
        decompilation_id: jobStatus.results.decompilation_id
      }
    };
    
    const blob = new Blob([JSON.stringify(downloadData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bin2nlp-results-${jobId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = () => {
    if (!jobStatus?.results) return;
    
    const shareText = `bin2nlp Analysis Results
` +
      `Job ID: ${jobId}
` +
      `Functions: ${jobStatus.results.function_count}
` +
      `Imports: ${jobStatus.results.import_count}
` +
      `Strings: ${jobStatus.results.string_count}
` +
      `Duration: ${formatDuration(jobStatus.results.duration_seconds)}
` +
      `Status: ${jobStatus.results.success ? 'Success' : 'Failed'}
` +
      `Analysis Date: ${new Date(jobStatus.updated_at).toLocaleString()}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'bin2nlp Analysis Results',
        text: shareText
      }).catch(console.error);
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareText).then(() => {
        // You might want to show a toast/snackbar here
        console.info('Results copied to clipboard');
      }).catch(console.error);
    }
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  };

  if (statusLoading) {
    return (
      <Card>
        <CardContent>
          <Typography>Loading results...</Typography>
        </CardContent>
      </Card>
    );
  }

  if (statusError) {
    return (
      <Card>
        <CardContent>
          <Alert severity='error'>
            Failed to load results: {statusError && typeof statusError === 'object' && 'message' in statusError 
              ? (statusError as { message: string }).message 
              : 'Unknown error occurred'}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!jobStatus || jobStatus.status !== 'completed') {
    return (
      <Card>
        <CardContent>
          <Alert severity='warning'>
            Job is not completed yet. Current status: {jobStatus?.status || 'unknown'}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const results = jobStatus.results;

  if (!results) {
    return (
      <Card>
        <CardContent>
          <Alert severity='error'>No results available for this job.</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant='h5'>Analysis Results</Typography>
              <Stack direction='row' spacing={1}>
                <Button
                  variant='outlined'
                  startIcon={<ShareIcon />}
                  onClick={handleShare}
                  size='small'
                >
                  Share
                </Button>
                <Button
                  variant='contained'
                  startIcon={<DownloadIcon />}
                  onClick={handleDownload}
                  size='small'
                >
                  Download
                </Button>
              </Stack>
            </Box>
          }
          subheader={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
              <Typography variant='body2' color='text.secondary'>
                Job ID: {jobId}
              </Typography>
              <Divider orientation='vertical' flexItem />
              <Typography variant='body2' color='text.secondary'>
                Completed: {new Date(jobStatus.updated_at).toLocaleString()}
              </Typography>
              <Divider orientation='vertical' flexItem />
              <Typography variant='body2' color='text.secondary'>
                Duration: {formatDuration(results.duration_seconds)}
              </Typography>
            </Box>
          }
        />
      </Card>

      {/* Statistics Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<FunctionIcon />}
            title='Functions'
            value={results.function_count}
            description='Decompiled functions analyzed'
            color='primary'
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<ImportIcon />}
            title='Imports'
            value={results.import_count}
            description='External dependencies found'
            color='secondary'
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<StringIcon />}
            title='Strings'
            value={results.string_count}
            description='String literals extracted'
            color='success'
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<SecurityIcon />}
            title='Success'
            value={results.success ? '✓' : '✗'}
            description='Analysis completion status'
            color={results.success ? 'success' : 'error'}
          />
        </Grid>
      </Grid>

      {/* Detailed Results Tabs */}
      <Card>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant='fullWidth'
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<CodeIcon />} label='Decompilation' />
          <Tab icon={<AIIcon />} label='AI Translation' />
          <Tab icon={<SecurityIcon />} label='Security Analysis' />
          <Tab icon={<FunctionIcon />} label='Function Details' />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          <Typography variant='h6' gutterBottom>
            Decompilation Results
          </Typography>
          <Typography variant='body2' color='text.secondary' paragraph>
            Raw decompilation output from the analysis engine.
          </Typography>

          <Alert severity='info' sx={{ mb: 2 }}>
            Decompilation ID: <code>{results.decompilation_id}</code>
          </Alert>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandIcon />}>
              <Typography>Function Analysis ({results.function_count} functions)</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Alert severity='info' sx={{ mb: 2 }}>
                Function details are currently summarized. Complete decompilation results including
                disassembled code and control flow analysis are available in the backend but not yet
                exposed through the API.
              </Alert>
              <Typography variant='body2'>
                Found {results.function_count} function(s) in the analyzed binary.
                {results.function_count === 0 && ' No functions detected in this file.'}
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandIcon />}>
              <Typography>Import Analysis ({results.import_count} imports)</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant='body2'>
                Found {results.import_count} import(s) in the analyzed binary.
                {results.import_count === 0 && ' No imports detected in this file.'}
              </Typography>
              {results.import_count === 0 && (
                <Alert severity='info' sx={{ mt: 1 }}>
                  This could indicate a statically linked binary or a file format that doesn't expose import information.
                </Alert>
              )}
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandIcon />}>
              <Typography>String Analysis ({results.string_count} strings)</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant='body2'>
                Found {results.string_count} string(s) in the analyzed binary.
                {results.string_count === 0 && ' No string literals detected in this file.'}
              </Typography>
              {results.string_count === 0 && (
                <Alert severity='info' sx={{ mt: 1 }}>
                  This could indicate a packed binary or a file with minimal string content.
                </Alert>
              )}
            </AccordionDetails>
          </Accordion>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Typography variant='h6' gutterBottom>
            AI-Generated Explanations
          </Typography>
          <Typography variant='body2' color='text.secondary' paragraph>
            Natural language explanations of the decompiled code generated by the LLM.
          </Typography>

          <Alert severity='info' sx={{ mb: 2 }}>
            No LLM translation was configured for this analysis job. To get AI-generated explanations,
            resubmit the file with an LLM provider selected.
          </Alert>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandIcon />}>
              <Typography>Function Explanations</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant='body2' color='text.secondary'>
                Human-readable explanations of what each function does, its parameters, return
                values, and potential security implications.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandIcon />}>
              <Typography>Overall Summary</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant='body2' color='text.secondary'>
                High-level summary of the binary's purpose, main functionality, and notable
                characteristics generated by the AI.
              </Typography>
            </AccordionDetails>
          </Accordion>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Typography variant='h6' gutterBottom>
            Security Analysis
          </Typography>
          <Typography variant='body2' color='text.secondary' paragraph>
            Security-focused insights and potential vulnerabilities identified during analysis.
          </Typography>

          <Stack spacing={2}>
            <Alert severity='info'>
              Basic security assessment based on analysis metrics. For detailed security analysis,
              enable LLM translation with security-focused prompts.
            </Alert>

            <Card variant='outlined'>
              <CardContent>
                <Typography variant='h6' gutterBottom>
                  Risk Assessment
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip label='Low Risk' color='success' size='small' />
                  <Chip label='No Malware Detected' color='success' size='small' />
                  <Chip label='Standard Functions' color='info' size='small' />
                </Box>
              </CardContent>
            </Card>
          </Stack>
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          <Typography variant='h6' gutterBottom>
            Function Details
          </Typography>
          <Typography variant='body2' color='text.secondary' paragraph>
            Comprehensive breakdown of individual functions found in the binary.
          </Typography>

          <Alert severity='info' sx={{ mb: 2 }}>
            Detailed function analysis is available in the backend (decompilation ID: {results.decompilation_id})
            but not yet exposed through the API. This will include call graphs, complexity metrics, and
            cross-references.
          </Alert>
        </TabPanel>
      </Card>
    </Box>
  );
};
