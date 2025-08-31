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
      endpoint: (meta?.arg as { endpointName?: string })?.endpointName || 'unknown',
      status: (error as { status?: unknown })?.status,
      message: (error as { data?: { message?: string }; message?: string })?.data?.message || (error as Error)?.message,
      originalArgs: (meta?.arg as { originalArgs?: unknown })?.originalArgs,
    });

    // You could dispatch a global error action here
    // or show toast notifications
  }

  return next(action);
};
