import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Grid,
  Alert,
  Snackbar,
  Paper,
} from '@mui/material';
import {
  Upload as UploadIcon,
} from '@mui/icons-material';
import { FileUploadZone } from '../components/upload/FileUploadZone';
import { JobConfigurationForm } from '../components/analysis/JobConfigurationForm';
import { useSubmitJobMutation } from '../services/api/analysisApi';
import { useAppDispatch } from '../store/hooks';
import { addJob } from '../store/slices/analysisSlice';
import type { JobSubmissionRequest } from '../services/api/analysisApi';

export const UploadPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jobConfig, setJobConfig] = useState<Partial<JobSubmissionRequest>>({});
  const [submitJob, { isLoading: isSubmitting, error: submitError }] = useSubmitJobMutation();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const dispatch = useAppDispatch();

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
  };

  const handleConfigChange = (config: Partial<JobSubmissionRequest>) => {
    setJobConfig(config);
  };

  const handleSubmitJob = async () => {
    if (!selectedFile) {
      return;
    }

    const request: JobSubmissionRequest = {
      file: selectedFile,
      analysis_depth: jobConfig.analysis_depth || 'standard',
      translation_detail: jobConfig.translation_detail || 'standard',
      ...(jobConfig.llm_provider && { llm_provider: jobConfig.llm_provider }),
      ...(jobConfig.llm_model && { llm_model: jobConfig.llm_model }),
      ...(jobConfig.llm_api_key && { llm_api_key: jobConfig.llm_api_key }),
      ...(jobConfig.llm_endpoint_url && { llm_endpoint_url: jobConfig.llm_endpoint_url }),
    };

    try {
      const result = await submitJob(request).unwrap();
      
      // Add job to Redux store for tracking
      dispatch(addJob({
        jobId: result.job_id,
        filename: selectedFile.name,
        fileSize: selectedFile.size,
        status: result.status as 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled',
        progress: 0,
        submittedAt: new Date().toISOString(),
        config: {
          analysisDepth: request.analysis_depth,
          translationDetail: request.translation_detail,
          llmProvider: request.llm_provider || null,
          llmModel: request.llm_model || null,
        },
      }));

      setSuccessMessage(`Job submitted successfully! Job ID: ${result.job_id.slice(0, 8)}...`);
      
      // Clear form
      setSelectedFile(null);
      setJobConfig({});

    } catch (error) {
      console.error('Failed to submit job:', error);
    }
  };

  const isConfigValid = () => {
    // If LLM is enabled, require API key
    if (jobConfig.llm_provider && !jobConfig.llm_api_key) {
      return false;
    }
    return true;
  };

  const canSubmit = selectedFile && isConfigValid() && !isSubmitting;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Upload & Analyze Binary
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Upload your binary file and configure the analysis parameters. 
        The system will decompile your binary and optionally translate it to natural language using AI.
      </Typography>

      <Grid container spacing={3}>
        {/* File Upload */}
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2, height: 'fit-content' }}>
            <Typography variant="h6" gutterBottom>
              1. Select Binary File
            </Typography>
            <FileUploadZone
              onFileSelect={handleFileSelect}
              onFileRemove={handleFileRemove}
              selectedFile={selectedFile}
              disabled={isSubmitting}
            />
          </Paper>
        </Grid>

        {/* Configuration */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            2. Configure Analysis
          </Typography>
          <JobConfigurationForm
            onConfigChange={handleConfigChange}
            disabled={isSubmitting}
          />
        </Grid>

        {/* Submit Button */}
        <Grid item xs={12}>
          <Paper elevation={1} sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              3. Start Analysis
            </Typography>
            
            {!isConfigValid() && jobConfig.llm_provider && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                API key is required when LLM translation is enabled.
              </Alert>
            )}

            {submitError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Failed to submit job: {(submitError as { data?: { message?: string } })?.data?.message || 'Unknown error'}
              </Alert>
            )}

            <Button
              variant="contained"
              size="large"
              onClick={handleSubmitJob}
              disabled={!canSubmit}
              loading={isSubmitting}
              startIcon={<UploadIcon />}
              sx={{ minWidth: 200 }}
            >
              {isSubmitting ? 'Submitting...' : 'Start Analysis'}
            </Button>

            {selectedFile && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>File:</strong> {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  <br />
                  <strong>Analysis:</strong> {jobConfig.analysis_depth || 'standard'} depth
                  {jobConfig.llm_provider && (
                    <>
                      <br />
                      <strong>AI Translation:</strong> {jobConfig.llm_provider} ({jobConfig.translation_detail || 'standard'} detail)
                    </>
                  )}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Success notification */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};