/**
 * Local Storage Utilities for Persistent Configuration
 * 
 * Provides type-safe local storage for LLM provider configurations
 * and other user preferences that should persist between sessions.
 */

export interface LLMProviderConfig {
  provider: string;
  model?: string;
  apiKey?: string;
  endpointUrl?: string;
  temperature?: number;
  maxTokens?: number;
  isDefault?: boolean;
}

export interface UserPreferences {
  llmProviders: LLMProviderConfig[];
  defaultProvider?: string;
  analysisDepth: 'basic' | 'standard' | 'comprehensive';
  enableLLMTranslation: boolean;
  autoSaveConfigurations: boolean;
}

const STORAGE_KEYS = {
  USER_PREFERENCES: 'bin2nlp:userPreferences',
  LLM_PROVIDERS: 'bin2nlp:llmProviders',
  LAST_SESSION: 'bin2nlp:lastSession',
} as const;

// Default configurations
const DEFAULT_PREFERENCES: UserPreferences = {
  llmProviders: [
    {
      provider: 'ollama',
      model: 'llama3.1:8b',
      endpointUrl: 'http://localhost:11434/v1',
      apiKey: '', // Ollama doesn't need API key
      temperature: 0.1,
      maxTokens: 2048,
      isDefault: true,
    }
  ],
  defaultProvider: 'ollama',
  analysisDepth: 'standard',
  enableLLMTranslation: false,
  autoSaveConfigurations: true,
};

/**
 * Generic localStorage wrapper with JSON serialization
 */
function getStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    return JSON.parse(item);
  } catch (error) {
    console.warn(`Failed to parse localStorage item ${key}:`, error);
    return defaultValue;
  }
}

function setStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to save to localStorage ${key}:`, error);
  }
}

function removeStorageItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove from localStorage ${key}:`, error);
  }
}

/**
 * User Preferences Management
 */
export const userPreferencesStorage = {
  get(): UserPreferences {
    return getStorageItem(STORAGE_KEYS.USER_PREFERENCES, DEFAULT_PREFERENCES);
  },

  set(preferences: Partial<UserPreferences>): void {
    const current = this.get();
    const updated = { ...current, ...preferences };
    setStorageItem(STORAGE_KEYS.USER_PREFERENCES, updated);
  },

  reset(): void {
    setStorageItem(STORAGE_KEYS.USER_PREFERENCES, DEFAULT_PREFERENCES);
  },

  clear(): void {
    removeStorageItem(STORAGE_KEYS.USER_PREFERENCES);
  },
};

/**
 * LLM Provider Configuration Management
 */
export const llmProviderStorage = {
  getAll(): LLMProviderConfig[] {
    return getStorageItem(STORAGE_KEYS.LLM_PROVIDERS, DEFAULT_PREFERENCES.llmProviders);
  },

  set(providers: LLMProviderConfig[]): void {
    setStorageItem(STORAGE_KEYS.LLM_PROVIDERS, providers);
  },

  add(config: LLMProviderConfig): void {
    const providers = this.getAll();
    const existingIndex = providers.findIndex(p => p.provider === config.provider);
    
    if (existingIndex >= 0) {
      // Update existing provider
      providers[existingIndex] = config;
    } else {
      // Add new provider
      providers.push(config);
    }
    
    this.set(providers);
  },

  remove(provider: string): void {
    const providers = this.getAll().filter(p => p.provider !== provider);
    this.set(providers);
  },

  get(provider: string): LLMProviderConfig | null {
    return this.getAll().find(p => p.provider === provider) || null;
  },

  getDefault(): LLMProviderConfig | null {
    const providers = this.getAll();
    return providers.find(p => p.isDefault) || providers[0] || null;
  },

  setDefault(provider: string): void {
    const providers = this.getAll();
    providers.forEach(p => {
      p.isDefault = p.provider === provider;
    });
    this.set(providers);
  },

  clear(): void {
    removeStorageItem(STORAGE_KEYS.LLM_PROVIDERS);
  },
};

/**
 * Session Management
 */
export interface SessionData {
  lastAnalysisConfig?: {
    analysisDepth: string;
    enableLLM: boolean;
    provider?: string;
  };
  recentJobs?: string[];
  timestamp: number;
}

export const sessionStorage = {
  get(): SessionData | null {
    return getStorageItem<SessionData | null>(STORAGE_KEYS.LAST_SESSION, null);
  },

  set(data: Partial<SessionData>): void {
    const current = this.get() || { timestamp: Date.now() };
    const updated = { ...current, ...data, timestamp: Date.now() };
    setStorageItem(STORAGE_KEYS.LAST_SESSION, updated);
  },

  clear(): void {
    removeStorageItem(STORAGE_KEYS.LAST_SESSION);
  },
};

/**
 * Utility functions
 */
export const storageUtils = {
  /**
   * Check if localStorage is available
   */
  isAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Get storage usage information
   */
  getUsage(): { used: number; total: number; available: number } {
    if (!this.isAvailable()) {
      return { used: 0, total: 0, available: 0 };
    }

    let used = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage[key].length;
      }
    }

    // Most browsers have 5MB limit for localStorage
    const total = 5 * 1024 * 1024; // 5MB in bytes
    const available = total - used;

    return { used, total, available };
  },

  /**
   * Clear all bin2nlp related storage
   */
  clearAll(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      removeStorageItem(key);
    });
  },

  /**
   * Export all data as JSON
   */
  export(): string {
    const data: Record<string, any> = {};
    Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
      const value = localStorage.getItem(key);
      if (value !== null) {
        try {
          data[name] = JSON.parse(value);
        } catch {
          data[name] = value;
        }
      }
    });
    return JSON.stringify(data, null, 2);
  },

  /**
   * Import data from JSON
   */
  import(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
        if (data[name] !== undefined) {
          setStorageItem(key, data[name]);
        }
      });
      return true;
    } catch (error) {
      console.error('Failed to import storage data:', error);
      return false;
    }
  },
};