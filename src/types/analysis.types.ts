/**
 * Core analysis domain types
 * Contains all TypeScript interfaces and types for the analysis feature
 */

// Job status and phase enums for better type safety
export const JobStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing', 
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

export const JobPhase = {
  QUEUED: 'queued',
  DECOMPILING: 'decompiling',
  TRANSLATING: 'translating', 
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export const AnalysisDepth = {
  BASIC: 'basic',
  DETAILED: 'detailed',
  COMPREHENSIVE: 'comprehensive',
} as const;

// Core types
export type JobStatusType = (typeof JobStatus)[keyof typeof JobStatus];
export type JobPhaseType = (typeof JobPhase)[keyof typeof JobPhase];
export type AnalysisDepthType = (typeof AnalysisDepth)[keyof typeof AnalysisDepth];

// Job configuration interface
export interface JobConfig {
  analysisDepth: AnalysisDepthType;
  includeComments: boolean;
  decompilerOptions: Record<string, unknown>;
  llmProvider?: string;
  llmApiKey?: string;
}

// Job results interface
export interface JobResults {
  decompilation?: {
    code: string;
    functions: Array<{
      name: string;
      address: string;
      size: number;
      complexity?: number;
    }>;
    metadata: {
      architecture: string;
      entryPoint: string;
      imports: string[];
      exports: string[];
    };
  };
  translation?: {
    summary: string;
    keyFindings: string[];
    securityConcerns: string[];
    codeQuality: {
      score: number;
      issues: Array<{
        type: 'warning' | 'error' | 'info';
        message: string;
        location?: string;
      }>;
    };
    llmProvider: string;
    model: string;
    tokensUsed: {
      input: number;
      output: number;
      cost?: number;
    };
  };
}

// Main job interface
export interface AnalysisJob {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  status: JobStatusType;
  progress: number;
  phase: JobPhaseType;
  submittedAt: string;
  completedAt?: string;
  config: JobConfig;
  results?: JobResults;
  error?: string;
  estimatedCost?: number;
  actualCost?: number;
}

// UI state interfaces
export interface JobFilters {
  status?: JobStatusType;
  dateRange?: {
    start: string;
    end: string;
  };
  fileType?: string;
  llmProvider?: string;
}

export interface AnalysisUIState {
  currentView: 'submission' | 'tracking' | 'history';
  selectedJobId?: string;
  submissionPanelExpanded: boolean;
  trackingPanelExpanded: boolean;  
  historyPanelExpanded: boolean;
  filters: JobFilters;
}

// Polling state interface
export interface PollingState {
  isPolling: boolean;
  interval: number;
  jobsBeingPolled: string[];
  lastUpdated?: string;
}

// Main state interface
export interface AnalysisState {
  activeJobs: Record<string, AnalysisJob>;
  jobHistory: AnalysisJob[];
  ui: AnalysisUIState;
  polling: PollingState;
  isLoading: boolean;
  error?: string;
}

// Action payload types
export interface AddJobPayload {
  job: AnalysisJob;
}

export interface UpdateJobPayload {
  id: string;
  updates: Partial<Omit<AnalysisJob, 'id'>>;
}

export interface SetFiltersPayload {
  filters: Partial<JobFilters>;
}

export interface StartPollingPayload {
  jobIds: string[];
  interval?: number;
}

// File upload types
export interface FileUploadState {
  file?: File;
  uploadProgress: number;
  isUploading: boolean;
  error?: string;
}

// LLM Provider types (for integration)
export interface LLMProvider {
  provider_id: string;
  name: string;
  description: string;
  status: 'healthy' | 'error' | 'unknown';
  models: string[];
  require_auth: boolean;
  error_message?: string;
  costEstimate?: {
    inputTokenCost: number;
    outputTokenCost: number;
    currency: string;
  };
}