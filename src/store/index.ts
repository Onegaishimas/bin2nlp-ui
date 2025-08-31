import { configureStore } from '@reduxjs/toolkit';
import { type TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { persistStore, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import { analysisApi } from '../services/api/analysisApi';
import analysisReducer from './slices/analysisSlice';
import { errorMiddleware } from './middleware';
import { isDevelopment } from '../utils/config';
import { createPersistedAnalysisReducer } from './persistConfig';

// Create the store with analysis slice and RTK Query
export const store = configureStore({
  reducer: {
    // Analysis domain slice with persistence for job history
    analysis: createPersistedAnalysisReducer(analysisReducer),
    // RTK Query API slice for server state management
    [analysisApi.reducerPath]: analysisApi.reducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore redux-persist actions for serialization checks
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        ignoredActionsPaths: ['meta.arg', 'payload.timestamp'],
      },
    })
      .concat(analysisApi.middleware)
      .concat(errorMiddleware),
  devTools: isDevelopment() && {
    name: 'bin2nlp-ui',
    trace: true,
    traceLimit: 25,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Create persistor for persistence management
export const persistor = persistStore(store);

// Create typed hooks for use throughout the app
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
