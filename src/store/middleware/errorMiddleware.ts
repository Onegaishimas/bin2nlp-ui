import { isRejectedWithValue, type MiddlewareAPI, type Middleware } from '@reduxjs/toolkit';

/**
 * Error handling middleware for RTK Query and other async actions
 * Logs errors and provides centralized error handling
 */
export const errorMiddleware: Middleware = (_api: MiddlewareAPI) => next => action => {
  // Check if action was rejected by RTK Query
  if (isRejectedWithValue(action)) {
    const { error, meta } = action;

    // Log API errors with context
    console.error('API Error:', {
      endpoint: (meta?.arg as any)?.endpointName || 'unknown',
      status: (error as any)?.status,
      message: (error as any)?.data?.message || error?.message,
      originalArgs: (meta?.arg as any)?.originalArgs,
    });

    // You could dispatch a global error action here
    // or show toast notifications
  }

  return next(action);
};
