/**
 * LLM Provider Management Service
 * Handles provider discovery, API key management, and health checking
 */

import { analysisApi, type LLMProvider } from '../api/analysisApi';
import { store } from '../../store';

export interface ProviderCredentials {
  providerId: string;
  apiKey: string;
  model?: string;
  expiresAt?: number;
}

export interface ProviderHealthStatus {
  providerId: string;
  status: 'healthy' | 'error' | 'testing' | 'unknown';
  lastChecked: number;
  responseTime?: number;
  error?: string;
}

export interface CostEstimate {
  providerId: string;
  model: string;
  estimatedTokens: number;
  estimatedCost: number;
  currency: string;
}

class LLMProviderManager {
  private credentials = new Map<string, ProviderCredentials>();
  private healthStatus = new Map<string, ProviderHealthStatus>();
  private providerCache: { data: LLMProvider[]; timestamp: number } | null = null;
  private readonly SESSION_STORAGE_KEY = 'llm-credentials';
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.loadCredentialsFromSession();
    this.setupSessionCleanup();
  }

  /**
   * Get available LLM providers with caching
   */
  public async getProviders(): Promise<LLMProvider[]> {
    // Check cache first
    if (this.providerCache && Date.now() - this.providerCache.timestamp < this.CACHE_DURATION) {
      return this.providerCache.data;
    }

    try {
      const result = await store
        .dispatch(analysisApi.endpoints.getLLMProviders.initiate())
        .unwrap();

      const providers = result.providers || [];

      // Update cache
      this.providerCache = {
        data: providers,
        timestamp: Date.now(),
      };

      return providers;
    } catch (error) {
      console.error('Failed to fetch LLM providers:', error);
      return this.providerCache?.data || [];
    }
  }

  /**
   * Get healthy providers only
   */
  public async getHealthyProviders(): Promise<LLMProvider[]> {
    const providers = await this.getProviders();
    return providers.filter(provider => provider.status === 'healthy');
  }

  /**
   * Set API key for a provider (session only)
   */
  public setProviderCredentials(providerId: string, apiKey: string, model?: string): void {
    if (!apiKey.trim()) {
      throw new Error('API key cannot be empty');
    }

    const credentials: ProviderCredentials = {
      providerId,
      apiKey: apiKey.trim(),
      expiresAt: Date.now() + 8 * 60 * 60 * 1000, // 8 hours
      ...(model && { model }),
    };

    this.credentials.set(providerId, credentials);
    this.saveCredentialsToSession();

    // Clear any previous health status to force recheck
    this.healthStatus.delete(providerId);
  }

  /**
   * Get credentials for a provider
   */
  public getProviderCredentials(providerId: string): ProviderCredentials | undefined {
    const credentials = this.credentials.get(providerId);

    // Check if credentials are expired
    if (credentials && credentials.expiresAt && Date.now() > credentials.expiresAt) {
      this.removeProviderCredentials(providerId);
      return undefined;
    }

    return credentials;
  }

  /**
   * Remove credentials for a provider
   */
  public removeProviderCredentials(providerId: string): void {
    this.credentials.delete(providerId);
    this.healthStatus.delete(providerId);
    this.saveCredentialsToSession();
  }

  /**
   * Check if provider has valid credentials
   */
  public hasValidCredentials(providerId: string): boolean {
    const credentials = this.getProviderCredentials(providerId);
    return !!credentials && !!credentials.apiKey;
  }

  /**
   * Test provider connection and API key
   */
  public async testProvider(providerId: string, apiKey?: string): Promise<ProviderHealthStatus> {
    const testApiKey = apiKey || this.getProviderCredentials(providerId)?.apiKey;

    if (!testApiKey) {
      const status: ProviderHealthStatus = {
        providerId,
        status: 'error',
        lastChecked: Date.now(),
        error: 'No API key provided',
      };
      this.healthStatus.set(providerId, status);
      return status;
    }

    // Set testing status
    const testingStatus: ProviderHealthStatus = {
      providerId,
      status: 'testing',
      lastChecked: Date.now(),
    };
    this.healthStatus.set(providerId, testingStatus);

    try {
      const startTime = Date.now();

      const result = await store
        .dispatch(
          analysisApi.endpoints.testLLMProvider.initiate({
            providerId,
          })
        )
        .unwrap();

      const responseTime = Date.now() - startTime;

      const status: ProviderHealthStatus = {
        providerId,
        status: result.status === 'success' ? 'healthy' : 'error',
        lastChecked: Date.now(),
        ...(responseTime && { responseTime }),
        ...(result.status === 'error' && result.message && { error: result.message }),
      };

      this.healthStatus.set(providerId, status);
      return status;
    } catch (error) {
      const status: ProviderHealthStatus = {
        providerId,
        status: 'error',
        lastChecked: Date.now(),
        error: error instanceof Error ? error.message : 'Test failed',
      };
      this.healthStatus.set(providerId, status);
      return status;
    }
  }

  /**
   * Get health status for a provider
   */
  public getProviderHealth(providerId: string): ProviderHealthStatus | undefined {
    return this.healthStatus.get(providerId);
  }

  /**
   * Get all provider health statuses
   */
  public getAllProviderHealthStatus(): Record<string, ProviderHealthStatus> {
    const result: Record<string, ProviderHealthStatus> = {};
    this.healthStatus.forEach((status, providerId) => {
      result[providerId] = status;
    });
    return result;
  }

  /**
   * Test all providers with credentials
   */
  public async testAllProviders(): Promise<Record<string, ProviderHealthStatus>> {
    const results: Record<string, ProviderHealthStatus> = {};

    const testPromises = Array.from(this.credentials.keys()).map(async providerId => {
      const status = await this.testProvider(providerId);
      results[providerId] = status;
      return status;
    });

    await Promise.allSettled(testPromises);
    return results;
  }

  /**
   * Get cost estimate for analysis
   */
  public async getCostEstimate(
    providerId: string,
    fileSize: number,
    analysisDepth: 'basic' | 'detailed' | 'comprehensive'
  ): Promise<CostEstimate | null> {
    const provider = (await this.getProviders()).find(p => p.provider_id === providerId);
    if (!provider) return null;

    // Simple cost estimation based on file size and analysis depth
    const baseTokens = Math.ceil(fileSize / 100); // Rough estimate: 1 token per 100 bytes

    const depthMultipliers = {
      basic: 1,
      detailed: 2.5,
      comprehensive: 5,
    };

    const estimatedTokens = Math.ceil(baseTokens * depthMultipliers[analysisDepth]);

    // Provider-specific pricing (rough estimates)
    const pricingPer1KTokens: Record<string, number> = {
      openai: 0.002, // GPT-4
      anthropic: 0.008, // Claude
      gemini: 0.001, // Gemini Pro
      ollama: 0, // Local/free
    };

    const pricePerToken = pricingPer1KTokens[providerId] || 0.002;
    const estimatedCost = (estimatedTokens / 1000) * pricePerToken;

    return {
      providerId,
      model: provider.available_models[0] || 'default',
      estimatedTokens,
      estimatedCost: Math.round(estimatedCost * 100) / 100, // Round to 2 decimal places
      currency: 'USD',
    };
  }

  /**
   * Get providers sorted by preference (healthy first, with credentials first)
   */
  public async getPreferredProviders(): Promise<{
    withCredentials: LLMProvider[];
    withoutCredentials: LLMProvider[];
    unhealthy: LLMProvider[];
  }> {
    const providers = await this.getProviders();

    const withCredentials: LLMProvider[] = [];
    const withoutCredentials: LLMProvider[] = [];
    const unhealthy: LLMProvider[] = [];

    providers.forEach(provider => {
      if (provider.status !== 'healthy') {
        unhealthy.push(provider);
      } else if (this.hasValidCredentials(provider.provider_id)) {
        withCredentials.push(provider);
      } else {
        withoutCredentials.push(provider);
      }
    });

    return {
      withCredentials,
      withoutCredentials,
      unhealthy,
    };
  }

  /**
   * Load credentials from session storage
   */
  private loadCredentialsFromSession(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = sessionStorage.getItem(this.SESSION_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);

        // Validate and filter expired credentials
        Object.entries(data).forEach(([providerId, creds]) => {
          const credentials = creds as ProviderCredentials;
          if (!credentials.expiresAt || Date.now() < credentials.expiresAt) {
            this.credentials.set(providerId, credentials);
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load credentials from session storage:', error);
      // Clear corrupted data
      sessionStorage.removeItem(this.SESSION_STORAGE_KEY);
    }
  }

  /**
   * Save credentials to session storage
   */
  private saveCredentialsToSession(): void {
    if (typeof window === 'undefined') return;

    try {
      const data: Record<string, ProviderCredentials> = {};
      this.credentials.forEach((credentials, providerId) => {
        data[providerId] = credentials;
      });
      sessionStorage.setItem(this.SESSION_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save credentials to session storage:', error);
    }
  }

  /**
   * Setup session cleanup on page unload
   */
  private setupSessionCleanup(): void {
    if (typeof window === 'undefined') return;

    // Clean up expired credentials periodically
    const cleanupInterval = setInterval(() => {
      let hasExpired = false;

      this.credentials.forEach((credentials, providerId) => {
        if (credentials.expiresAt && Date.now() > credentials.expiresAt) {
          this.credentials.delete(providerId);
          this.healthStatus.delete(providerId);
          hasExpired = true;
        }
      });

      if (hasExpired) {
        this.saveCredentialsToSession();
      }
    }, 60000); // Check every minute

    // Clear interval on page unload
    window.addEventListener('beforeunload', () => {
      clearInterval(cleanupInterval);
    });
  }

  /**
   * Clear all data (for logout/reset)
   */
  public clearAll(): void {
    this.credentials.clear();
    this.healthStatus.clear();
    this.providerCache = null;

    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(this.SESSION_STORAGE_KEY);
    }
  }

  /**
   * Get summary of current state
   */
  public getSummary(): {
    totalProviders: number;
    healthyProviders: number;
    providersWithCredentials: number;
    credentialsExpiringSoon: number;
  } {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    let credentialsExpiringSoon = 0;
    this.credentials.forEach(creds => {
      if (creds.expiresAt && creds.expiresAt - now < oneHour) {
        credentialsExpiringSoon++;
      }
    });

    return {
      totalProviders: this.providerCache?.data.length || 0,
      healthyProviders: this.providerCache?.data.filter(p => p.status === 'healthy').length || 0,
      providersWithCredentials: this.credentials.size,
      credentialsExpiringSoon,
    };
  }
}

// Export singleton instance
export const llmProviderManager = new LLMProviderManager();

// Export types for external use
export type { LLMProviderManager };
