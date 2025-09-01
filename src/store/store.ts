import { configureStore } from '@reduxjs/toolkit';
import { analysisApi } from '../services/api/analysisApi';
import { createPersistedAnalysisReducer } from './persistConfig';
import analysisReducer from './slices/analysisSlice';

// Configure store with RTK Query and persistent analysis state
export const store = configureStore({
  reducer: {
    // API slice
    [analysisApi.reducerPath]: analysisApi.reducer,
    // Analysis slice with persistence
    analysis: createPersistedAnalysisReducer(analysisReducer),
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        ignoredActionsPaths: ['meta.arg', 'payload.timestamp'],
        ignoredPaths: ['analysis._persist'],
      },
    }).concat(analysisApi.middleware),
  devTools: import.meta.env.MODE === 'development',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;
