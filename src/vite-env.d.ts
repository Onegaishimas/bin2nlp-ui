/// <reference types="vite/client" />

// Global constants defined by Vite
declare const __APP_VERSION__: string;
declare const __BUILD_TIME__: string;

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  readonly VITE_POLLING_INTERVAL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
