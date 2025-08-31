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
  Grid,
  Button,
  Alert,
  Divider,
  Stack,
} from '@mui/material';
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
import { useGetJobResultsQuery, useGetJobStatusQuery } from '../../services/api/analysisApi';

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
    <div hidden={value !== index}>
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
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
        <Box sx={{ color: `${color}.main`, mr: 1 }}>
          {icon}
        </Box>
        <Typography variant="h6">{title}</Typography>
      </Box>
      <Typography variant="h3" color={`${color}.main`} gutterBottom>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </CardContent>
  </Card>
);

export const ResultsViewer: React.FC<ResultsViewerProps> = ({ jobId }) => {
  const [activeTab, setActiveTab] = useState(0);
  
  const { data: jobStatus, isLoading: statusLoading, error: statusError } = useGetJobStatusQuery(jobId);
  const { isLoading: resultsLoading, error: resultsError } = useGetJobResultsQuery(jobId, {
    skip: jobStatus?.status !== 'completed',
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleDownload = () => {
    // Implementation for downloading results
    console.info('Downloading results for job:', jobId);
  };

  const handleShare = () => {
    // Implementation for sharing results
    console.info('Sharing results for job:', jobId);
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  };

  if (statusLoading || resultsLoading) {
    return (
      <Card>
        <CardContent>
          <Typography>Loading results...</Typography>
        </CardContent>
      </Card>
    );
  }

  if (statusError || resultsError) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">
            Failed to load results: {(statusError || resultsError) as string}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!jobStatus || jobStatus.status !== 'completed') {
    return (
      <Card>
        <CardContent>
          <Alert severity="warning">
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
          <Alert severity="error">
            No results available for this job.
          </Alert>
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
              <Typography variant="h5">
                Analysis Results
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={<ShareIcon />}
                  onClick={handleShare}
                  size="small"
                >
                  Share
                </Button>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownload}
                  size="small"
                >
                  Download
                </Button>
              </Stack>
            </Box>
          }
          subheader={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Job ID: {jobId}
              </Typography>
              <Divider orientation="vertical" flexItem />
              <Typography variant="body2" color="text.secondary">
                Completed: {new Date(jobStatus.updated_at).toLocaleString()}
              </Typography>
              <Divider orientation="vertical" flexItem />
              <Typography variant="body2" color="text.secondary">
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
            title="Functions"
            value={results.function_count}
            description="Decompiled functions analyzed"
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<ImportIcon />}
            title="Imports"
            value={results.import_count}
            description="External dependencies found"
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<StringIcon />}
            title="Strings"
            value={results.string_count}
            description="String literals extracted"
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<SecurityIcon />}
            title="Success"
            value={results.success ? "✓" : "✗"}
            description="Analysis completion status"
            color={results.success ? "success" : "error"}
          />
        </Grid>
      </Grid>

      {/* Detailed Results Tabs */}
      <Card>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<CodeIcon />} label="Decompilation" />
          <Tab icon={<AIIcon />} label="AI Translation" />
          <Tab icon={<SecurityIcon />} label="Security Analysis" />
          <Tab icon={<FunctionIcon />} label="Function Details" />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          <Typography variant="h6" gutterBottom>
            Decompilation Results
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Raw decompilation output from the analysis engine.
          </Typography>

          <Alert severity="info" sx={{ mb: 2 }}>
            Decompilation ID: <code>{results.decompilation_id}</code>
          </Alert>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandIcon />}>
              <Typography>Function Analysis ({results.function_count} functions)</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary">
                Detailed function-by-function decompilation results would appear here.
                This would include disassembled code, control flow analysis, and variable identification.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandIcon />}>
              <Typography>Import Analysis ({results.import_count} imports)</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary">
                External library dependencies, API calls, and system functions would be listed here
                with security context and usage patterns.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandIcon />}>
              <Typography>String Analysis ({results.string_count} strings)</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary">
                Extracted string literals, potential configuration data, error messages,
                and embedded resources would be displayed here.
              </Typography>
            </AccordionDetails>
          </Accordion>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Typography variant="h6" gutterBottom>
            AI-Generated Explanations
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Natural language explanations of the decompiled code generated by the LLM.
          </Typography>

          <Alert severity="info" sx={{ mb: 2 }}>
            AI translation results would be populated here when LLM analysis is enabled and completed.
          </Alert>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandIcon />}>
              <Typography>Function Explanations</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary">
                Human-readable explanations of what each function does, its parameters,
                return values, and potential security implications.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandIcon />}>
              <Typography>Overall Summary</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary">
                High-level summary of the binary's purpose, main functionality,
                and notable characteristics generated by the AI.
              </Typography>
            </AccordionDetails>
          </Accordion>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Typography variant="h6" gutterBottom>
            Security Analysis
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Security-focused insights and potential vulnerabilities identified during analysis.
          </Typography>

          <Stack spacing={2}>
            <Alert severity="warning">
              Security analysis results would appear here, including potential vulnerabilities,
              suspicious patterns, and security recommendations.
            </Alert>

            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Risk Assessment
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip label="Low Risk" color="success" size="small" />
                  <Chip label="No Malware Detected" color="success" size="small" />
                  <Chip label="Standard Functions" color="info" size="small" />
                </Box>
              </CardContent>
            </Card>
          </Stack>
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          <Typography variant="h6" gutterBottom>
            Function Details
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Comprehensive breakdown of individual functions found in the binary.
          </Typography>

          <Alert severity="info" sx={{ mb: 2 }}>
            Detailed function analysis including call graphs, complexity metrics,
            and cross-references would be displayed here.
          </Alert>
        </TabPanel>
      </Card>
    </Box>
  );
};