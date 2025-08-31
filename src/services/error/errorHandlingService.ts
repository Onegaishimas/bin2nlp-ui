/**
 * Centralized Error Handling Service
 * Provides error mapping, logging, reporting, and user-friendly error messages
 */

import type { FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import type { ApiError } from '../api/analysisApi';

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  timestamp: string;
  userAgent?: string;
  url?: string;
  additionalData?: Record<string, unknown>;
}

export interface ProcessedError {
  id: string;
  type: 'network' | 'validation' | 'authentication' | 'authorization' | 'server' | 'client' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userMessage: string;
  technicalMessage: string;
  code?: string;
  statusCode?: number;
  canRetry: boolean;
  retryAfter?: number;
  actions?: Array<{
    label: string;
    action: string;
    primary?: boolean;
  }>;
  context?: ErrorContext;
}

export interface ErrorReport {
  errorId: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  error: Error | FetchBaseQueryError | ApiError;
  context: ErrorContext;
  stackTrace?: string;
  breadcrumbs?: Array<{
    timestamp: string;
    category: string;
    message: string;
    data?: Record<string, unknown>;
  }>;
}

class ErrorHandlingService {
  private errorLog: ErrorReport[] = [];
  private breadcrumbs: ErrorReport['breadcrumbs'] = [];
  private maxLogSize = 100;
  private maxBreadcrumbs = 50;
  private sessionId = this.generateSessionId();

  /**
   * Process any error into a user-friendly format
   */
  public processError(
    error: Error | FetchBaseQueryError | ApiError | unknown,
    context?: Partial<ErrorContext>
  ): ProcessedError {
    const errorId = this.generateErrorId();
    const fullContext = this.createContext(context);

    // Determine error type and extract relevant information
    let type: ProcessedError['type'] = 'unknown';
    let statusCode: number | undefined;
    let technicalMessage = 'An unknown error occurred';
    let code: string | undefined;
    let canRetry = false;

    // Handle RTK Query errors
    if (this.isFetchBaseQueryError(error)) {
      statusCode = error.status as number;
      
      if (statusCode === 0 || error.status === 'FETCH_ERROR') {
        type = 'network';
        technicalMessage = 'Network connection failed';
        canRetry = true;
      } else if (statusCode >= 400 && statusCode < 500) {
        type = statusCode === 401 ? 'authentication' : 
              statusCode === 403 ? 'authorization' : 'client';
        technicalMessage = `HTTP ${statusCode}`;
      } else if (statusCode >= 500) {
        type = 'server';
        technicalMessage = `Server error (HTTP ${statusCode})`;
        canRetry = true;
      }

      // Extract API error details
      if (error.data && typeof error.data === 'object') {
        const apiError = error.data as ApiError;
        technicalMessage = apiError.message || technicalMessage;
        code = apiError.code;
      }
    }
    // Handle standard JavaScript errors
    else if (error instanceof Error) {
      technicalMessage = error.message;
      
      // Categorize by error type or message
      if (error.name === 'ValidationError' || error.message.includes('validation')) {
        type = 'validation';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        type = 'network';
        canRetry = true;
      } else if (error.message.includes('unauthorized') || error.message.includes('authentication')) {
        type = 'authentication';
      } else {
        type = 'client';
      }
    }
    // Handle API error objects
    else if (error && typeof error === 'object' && 'message' in error) {
      const apiError = error as ApiError;
      technicalMessage = apiError.message;
      code = apiError.code;
      type = 'server';
    }

    // Generate user-friendly message
    const userMessage = this.getUserMessage(type, statusCode, technicalMessage);
    
    // Determine severity
    const severity = this.getSeverity(type, statusCode);

    // Generate suggested actions
    const actions = this.getSuggestedActions(type, canRetry);

    const processedError: ProcessedError = {
      id: errorId,
      type,
      severity,
      userMessage,
      technicalMessage,
      code,
      statusCode,
      canRetry,
      actions,
      context: fullContext,
    };

    // Log the error
    this.logError(processedError, error);

    return processedError;
  }

  /**
   * Get user-friendly error message based on error type
   */
  private getUserMessage(type: ProcessedError['type'], statusCode?: number, technical?: string): string {
    switch (type) {
      case 'network':
        return 'Unable to connect to the server. Please check your internet connection and try again.';
      
      case 'authentication':
        return 'Your session has expired. Please refresh the page and try again.';
      
      case 'authorization':
        return 'You don\'t have permission to perform this action.';
      
      case 'validation':
        return technical || 'The information provided is invalid. Please check your input and try again.';
      
      case 'server':
        if (statusCode === 429) {
          return 'Too many requests. Please wait a moment and try again.';
        }
        if (statusCode === 503) {
          return 'The service is temporarily unavailable. Please try again later.';
        }
        return 'A server error occurred. Our team has been notified and is working on a fix.';
      
      case 'client':
        if (technical?.includes('file') || technical?.includes('upload')) {
          return 'There was a problem with your file. Please check that it\'s a valid binary executable and try again.';
        }
        return 'Something went wrong. Please try again or contact support if the problem persists.';
      
      default:
        return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
    }
  }

  /**
   * Determine error severity
   */
  private getSeverity(type: ProcessedError['type'], statusCode?: number): ProcessedError['severity'] {
    if (type === 'network' && statusCode === 0) return 'high';
    if (type === 'server' && statusCode && statusCode >= 500) return 'high';
    if (type === 'authentication') return 'medium';
    if (type === 'authorization') return 'medium';
    if (type === 'validation') return 'low';
    if (statusCode === 429) return 'medium'; // Rate limiting
    return 'medium';
  }

  /**
   * Get suggested actions for error type
   */
  private getSuggestedActions(type: ProcessedError['type'], canRetry: boolean): ProcessedError['actions'] {
    const actions: ProcessedError['actions'] = [];

    if (canRetry) {
      actions.push({
        label: 'Try Again',
        action: 'retry',
        primary: true,
      });
    }

    switch (type) {
      case 'network':
        actions.push({
          label: 'Check Connection',
          action: 'check-connection',
        });
        break;
      
      case 'authentication':
        actions.push({
          label: 'Refresh Page',
          action: 'refresh',
          primary: !canRetry,
        });
        break;
      
      case 'validation':
        actions.push({
          label: 'Review Input',
          action: 'review-input',
          primary: true,
        });
        break;
      
      case 'server':
        actions.push({
          label: 'Contact Support',
          action: 'contact-support',
        });
        break;
    }

    if (actions.length === 0) {
      actions.push({
        label: 'Dismiss',
        action: 'dismiss',
        primary: true,
      });
    }

    return actions;
  }

  /**
   * Log error for debugging and analytics
   */
  private logError(processedError: ProcessedError, originalError: unknown): void {
    const report: ErrorReport = {
      errorId: processedError.id,
      timestamp: new Date().toISOString(),
      level: this.mapSeverityToLevel(processedError.severity),
      message: processedError.userMessage,
      error: originalError,
      context: processedError.context!,
      stackTrace: originalError instanceof Error ? originalError.stack : undefined,
      breadcrumbs: [...this.breadcrumbs],
    };

    // Add to error log
    this.errorLog.push(report);
    
    // Maintain log size
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }

    // Console logging for development
    if (process.env.NODE_ENV === 'development') {
      const logMethod = report.level === 'fatal' || report.level === 'error' ? 'error' : 
                       report.level === 'warn' ? 'warn' : 'info';
      
      const consoleMethod = logMethod === 'error' ? console.error : 
                        logMethod === 'warn' ? console.warn : console.info;
      consoleMethod(`[${report.level.toUpperCase()}] ${report.message}`, {
        errorId: report.errorId,
        error: originalError,
        context: report.context,
      });
    }
  }

  /**
   * Add breadcrumb for error context
   */
  public addBreadcrumb(category: string, message: string, data?: Record<string, unknown>): void {
    this.breadcrumbs.push({
      timestamp: new Date().toISOString(),
      category,
      message,
      data,
    });

    // Maintain breadcrumb size
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.maxBreadcrumbs);
    }
  }

  /**
   * Get error logs for debugging
   */
  public getErrorLogs(level?: ErrorReport['level']): ErrorReport[] {
    if (level) {
      return this.errorLog.filter(log => log.level === level);
    }
    return [...this.errorLog];
  }

  /**
   * Clear error logs
   */
  public clearLogs(): void {
    this.errorLog = [];
  }

  /**
   * Check if error is a network connectivity issue
   */
  public isNetworkError(error: unknown): boolean {
    const processed = this.processError(error);
    return processed.type === 'network';
  }

  /**
   * Check if error is retryable
   */
  public isRetryable(error: unknown): boolean {
    const processed = this.processError(error);
    return processed.canRetry;
  }

  /**
   * Create error context
   */
  private createContext(partial?: Partial<ErrorContext>): ErrorContext {
    return {
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      ...partial,
    };
  }

  /**
   * Check if error is RTK Query FetchBaseQueryError
   */
  private isFetchBaseQueryError(error: unknown): error is FetchBaseQueryError {
    return error && typeof error === 'object' && 'status' in error;
  }

  /**
   * Map severity to log level
   */
  private mapSeverityToLevel(severity: ProcessedError['severity']): ErrorReport['level'] {
    switch (severity) {
      case 'low': return 'info';
      case 'medium': return 'warn';
      case 'high': return 'error';
      case 'critical': return 'fatal';
      default: return 'error';
    }
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get error statistics
   */
  public getStats(): {
    totalErrors: number;
    errorsByType: Record<ProcessedError['type'], number>;
    errorsByLevel: Record<ErrorReport['level'], number>;
    recentErrorRate: number; // errors per hour in last 24 hours
  } {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);

    const veryRecentErrors = this.errorLog.filter(log => 
      new Date(log.timestamp).getTime() > oneHourAgo
    );

    const errorsByType: Record<string, number> = {};
    const errorsByLevel: Record<string, number> = {};

    this.errorLog.forEach(log => {
      // Count by level
      errorsByLevel[log.level] = (errorsByLevel[log.level] || 0) + 1;
    });

    return {
      totalErrors: this.errorLog.length,
      errorsByType,
      errorsByLevel,
      recentErrorRate: veryRecentErrors.length, // Simplified: errors in last hour
    };
  }

  /**
   * Export logs for external reporting
   */
  public exportLogs(): string {
    return JSON.stringify({
      sessionId: this.sessionId,
      exportedAt: new Date().toISOString(),
      logs: this.errorLog,
      breadcrumbs: this.breadcrumbs,
      stats: this.getStats(),
    }, null, 2);
  }
}

// Export singleton instance
export const errorService = new ErrorHandlingService();

// Export types for external use
export type { ErrorHandlingService };