/**
 * Enhanced logging utility for debugging API calls and application behavior
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  component?: string;
  action?: string;
  jobId?: string;
  endpoint?: string;
  requestId?: string;
  [key: string]: unknown;
}

class Logger {
  private isDevelopment: boolean;
  private enableVerbose: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.MODE === 'development';
    this.enableVerbose = this.isDevelopment || import.meta.env.VITE_VERBOSE_LOGGING === 'true';
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context
      ? ` [${Object.entries(context)
          .map(([k, v]) => `${k}:${v}`)
          .join(', ')}]`
      : '';
    return `[${timestamp}] [${level.toUpperCase()}]${contextStr} ${message}`;
  }

  private log(level: LogLevel, message: string, context?: LogContext, ...args: unknown[]) {
    if (!this.enableVerbose && level === 'debug') return;

    const formattedMessage = this.formatMessage(level, message, context);

    switch (level) {
      case 'debug':
        console.info(formattedMessage, ...args);
        break;
      case 'info':
        console.info(formattedMessage, ...args);
        break;
      case 'warn':
        console.warn(formattedMessage, ...args);
        break;
      case 'error':
        console.error(formattedMessage, ...args);
        break;
    }
  }

  debug(message: string, context?: LogContext, ...args: unknown[]) {
    this.log('debug', message, context, ...args);
  }

  info(message: string, context?: LogContext, ...args: unknown[]) {
    this.log('info', message, context, ...args);
  }

  warn(message: string, context?: LogContext, ...args: unknown[]) {
    this.log('warn', message, context, ...args);
  }

  error(message: string, context?: LogContext, ...args: unknown[]) {
    this.log('error', message, context, ...args);
  }

  // API-specific logging helpers
  apiRequest(method: string, url: string, data?: unknown, context?: LogContext) {
    this.debug(`API Request: ${method} ${url}`, { ...context, endpoint: url }, data);
  }

  apiResponse(method: string, url: string, status: number, data?: unknown, context?: LogContext) {
    this.info(
      `API Response: ${method} ${url} ${status}`,
      { ...context, endpoint: url, status },
      data
    );
  }

  apiError(method: string, url: string, error: unknown, context?: LogContext) {
    this.error(`API Error: ${method} ${url}`, { ...context, endpoint: url }, error);
  }

  // Job polling specific logging
  jobPolling(jobId: string, status: string, progress?: number) {
    this.debug(`Job Polling`, { jobId, status, progress });
  }

  jobStatusChange(jobId: string, oldStatus: string, newStatus: string) {
    this.info(`Job Status Change: ${oldStatus} → ${newStatus}`, { jobId });
  }

  // Component lifecycle logging
  componentMount(componentName: string, props?: unknown) {
    this.debug(`Component Mount: ${componentName}`, { component: componentName }, props);
  }

  componentUpdate(componentName: string, changes?: unknown) {
    this.debug(`Component Update: ${componentName}`, { component: componentName }, changes);
  }

  // User action logging
  userAction(action: string, context?: LogContext, data?: unknown) {
    this.info(`User Action: ${action}`, { ...context, action }, data);
  }
}

// Export singleton instance
export const logger = new Logger();

// Helper for enabling verbose logging in browser console
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).__enableVerboseLogging = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (logger as any).enableVerbose = true;
  console.info('Verbose logging enabled. Disable with __disableVerboseLogging()');
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).__disableVerboseLogging = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (logger as any).enableVerbose = false;
  console.info('Verbose logging disabled.');
};
