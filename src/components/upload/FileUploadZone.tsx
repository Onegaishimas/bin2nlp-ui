import React, { useCallback, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  LinearProgress,
  Alert,
  Chip,
  Stack,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  InsertDriveFile as FileIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
} from '@mui/icons-material';
import { fileUploadService } from '../../services/upload';
import type { FileValidationResult, UploadProgress } from '../../services/upload';

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  selectedFile: File | null;
  disabled?: boolean;
  uploadProgress?: UploadProgress;
}

const SUPPORTED_FORMATS = ['PE', 'ELF', 'Mach-O', 'JAR'];
const MAX_FILE_SIZE = '100MB';

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onFileSelect,
  onFileRemove,
  selectedFile,
  disabled = false,
  uploadProgress,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [validationResult, setValidationResult] = useState<FileValidationResult | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleFileValidation = useCallback((file: File) => {
    const result = fileUploadService.validateFile(file);
    setValidationResult(result);

    if (result.isValid) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled || e.dataTransfer.files.length === 0) return;

    const file = e.dataTransfer.files[0];
    handleFileValidation(file);
  }, [disabled, handleFileValidation]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled || !e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    handleFileValidation(file);
    
    // Reset input value to allow selecting same file again
    e.target.value = '';
  }, [disabled, handleFileValidation]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getUploadStatusColor = (status: UploadProgress['status']) => {
    switch (status) {
      case 'uploading': return 'primary';
      case 'completed': return 'success';
      case 'error': return 'error';
      case 'cancelled': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Paper
        elevation={dragActive ? 4 : 1}
        sx={{
          p: 4,
          textAlign: 'center',
          border: dragActive ? 2 : 1,
          borderColor: dragActive ? 'primary.main' : 'divider',
          borderStyle: 'dashed',
          backgroundColor: dragActive ? 'action.hover' : 'background.paper',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease-in-out',
          opacity: disabled ? 0.6 : 1,
        }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept=".exe,.dll,.bin,.elf,.so,.dylib,.jar"
          style={{ display: 'none' }}
          onChange={handleFileInput}
          disabled={disabled}
        />

        {!selectedFile ? (
          <Box>
            <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Drop your binary file here
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              or click to browse files
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Supported formats: {SUPPORTED_FORMATS.join(', ')} • Max size: {MAX_FILE_SIZE}
            </Typography>
          </Box>
        ) : (
          <Box>
            <FileIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {selectedFile.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {formatFileSize(selectedFile.size)}
            </Typography>
            
            {uploadProgress && (
              <Box sx={{ mt: 2, mb: 2 }}>
                <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                  <Chip
                    size="small"
                    label={uploadProgress.status}
                    color={getUploadStatusColor(uploadProgress.status)}
                    icon={uploadProgress.status === 'completed' ? <SuccessIcon /> : undefined}
                  />
                  <Typography variant="caption">
                    {uploadProgress.percentComplete}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={uploadProgress.percentComplete}
                  sx={{ mt: 1 }}
                />
              </Box>
            )}
            
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onFileRemove();
                setValidationResult(null);
              }}
              disabled={disabled}
              sx={{ mt: 1 }}
            >
              Remove File
            </Button>
          </Box>
        )}
      </Paper>

      {validationResult && !validationResult.isValid && (
        <Alert 
          severity="error" 
          icon={<ErrorIcon />}
          sx={{ mt: 2 }}
        >
          <Typography variant="body2">
            <strong>File validation failed:</strong>
          </Typography>
          <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
            {validationResult.errors.map((error, index) => (
              <li key={index}>
                <Typography variant="body2">{error}</Typography>
              </li>
            ))}
          </ul>
        </Alert>
      )}

      {validationResult && validationResult.isValid && validationResult.warnings.length > 0 && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Warnings:</strong>
          </Typography>
          <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
            {validationResult.warnings.map((warning, index) => (
              <li key={index}>
                <Typography variant="body2">{warning}</Typography>
              </li>
            ))}
          </ul>
        </Alert>
      )}
    </Box>
  );
};