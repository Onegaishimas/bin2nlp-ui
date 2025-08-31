import React, { type ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { theme } from '@/theme/theme';
import { analysisApi } from '@/services/api/analysisApi';
import analysisReducer, { type AnalysisState } from '@/store/slices/analysisSlice';
import type { RootState } from '@/store';

// Test store configuration
interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  preloadedState?: Partial<RootState>;
  store?: ReturnType<typeof createTestStore>;
}

// Create a test store with optional preloaded state
export function createTestStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: {
      analysis: analysisReducer,
      [analysisApi.reducerPath]: analysisApi.reducer,
    },
    preloadedState,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
          ignoredActionsPaths: ['meta.arg', 'payload.timestamp'],
        },
      }).concat(analysisApi.middleware),
  });
}

// Wrapper component that provides all necessary contexts
function AllTheProviders({
  children,
  store,
}: {
  children: React.ReactNode;
  store?: ReturnType<typeof createTestStore>;
}) {
  const testStore = store || createTestStore();

  return (
    <Provider store={testStore}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </Provider>
  );
}

// Custom render function that includes providers
export function renderWithProviders(
  ui: ReactElement,
  {
    preloadedState,
    store = createTestStore(preloadedState),
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <AllTheProviders store={store}>{children}</AllTheProviders>;
  }

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

// Mock data factories for testing
export const mockAnalysisJob = (overrides: Partial<any> = {}) => ({
  id: 'test-job-123',
  fileName: 'test-binary.exe',
  fileSize: 1024,
  fileType: 'application/x-executable',
  status: 'pending' as const,
  progress: 0,
  phase: 'queued' as const,
  submittedAt: new Date().toISOString(),
  config: {
    analysisDepth: 'basic' as const,
    includeComments: true,
    decompilerOptions: {},
  },
  ...overrides,
});

export const mockLLMProvider = (overrides: Partial<any> = {}) => ({
  id: 'openai',
  name: 'OpenAI',
  description: 'OpenAI GPT models for natural language translation',
  requiresApiKey: true,
  supportedModels: ['gpt-4', 'gpt-3.5-turbo'],
  costEstimate: {
    inputTokenCost: 0.03,
    outputTokenCost: 0.06,
    currency: 'USD',
  },
  ...overrides,
});

// Helper to create initial analysis state for testing
export const mockAnalysisState = (overrides: Partial<AnalysisState> = {}): AnalysisState => ({
  activeJobs: {},
  jobHistory: [],
  ui: {
    currentView: 'submission',
    selectedJobId: undefined,
    submissionPanelExpanded: true,
    trackingPanelExpanded: true,
    historyPanelExpanded: false,
    filters: {},
  },
  polling: {
    isPolling: false,
    interval: 2000,
    jobsBeingPolled: [],
  },
  isLoading: false,
  error: undefined,
  ...overrides,
});

// User event utility with proper setup
import userEvent from '@testing-library/user-event';

export const user = userEvent.setup();

// Helper for async utilities
export const waitForLoadingToFinish = () => new Promise(resolve => setTimeout(resolve, 0));

// File upload test helpers
export const createMockFile = (
  filename = 'test.exe',
  size = 1024,
  type = 'application/x-executable'
) => {
  const file = new File(['mock file content'], filename, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

// Re-export everything from testing-library
export * from '@testing-library/react';
export { renderWithProviders as render };
