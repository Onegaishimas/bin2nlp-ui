/**
 * Configuration utility for environment variables
 * Provides type-safe access to Vite environment variables
 */

export interface AppConfig {
  apiBaseUrl: string;
  appName: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  pollingInterval: number;
}

/**
 * Get environment variable value with fallback
 */
const getEnvVar = (key: string, fallback: string): string => {
  // Use Vite's import.meta.env for environment variables
  return import.meta.env[key] || fallback;
};

/**
 * Application configuration object
 */
export const config: AppConfig = {
  apiBaseUrl: getEnvVar('VITE_API_BASE_URL', 'http://localhost:8000'),
  appName: getEnvVar('VITE_APP_NAME', 'bin2nlp UI'),
  logLevel: getEnvVar('VITE_LOG_LEVEL', 'info') as 'debug' | 'info' | 'warn' | 'error',
  pollingInterval: parseInt(getEnvVar('VITE_POLLING_INTERVAL', '1000'), 10),
};

/**
 * Check if we're in development mode
 */
export const isDevelopment = (): boolean => {
  return import.meta.env.MODE === 'development';
};

/**
 * Check if we're in production mode
 */
export const isProduction = (): boolean => {
  return import.meta.env.MODE === 'production';
};
