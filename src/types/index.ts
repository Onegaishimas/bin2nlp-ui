// Re-export all common types for easy importing
export type { AnalysisState } from '../store/slices/analysisSlice';
export type {
  JobSubmissionRequest,
  JobSubmissionResponse,
  JobStatusResponse,
  LLMProvider,
} from '../services/api/analysisApi';

// Common utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// API response wrapper types
export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

// File upload types
export interface FileUploadState {
  file?: File;
  progress: number;
  error?: string;
  isUploading: boolean;
}

// Theme types (augment MUI theme if needed)
declare module '@mui/material/styles' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Theme {
    // Add custom theme properties here if needed
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface ThemeOptions {
    // Add custom theme options here if needed
  }
}

// Environment variables type safety

// Analysis domain types
export * from './analysis.types';

// Store types
export type { RootState, AppDispatch } from '../store';
