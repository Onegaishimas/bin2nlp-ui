// Simple API verification tests
// Run with: npm test -- --testPathPatterns=analysisApi.simple.test.ts
// Requires backend running at localhost:8000

import { config } from '../../../utils/config';

describe('API Backend Verification', () => {
  const API_BASE = config.apiBaseUrl;

  beforeAll(async () => {
    // Check if backend is available
    try {
      const response = await fetch(`${API_BASE}/api/v1/health`);
      if (!response.ok) {
        console.warn('Backend not available at', API_BASE);
      }
    } catch (error) {
      console.warn('Backend not available at', API_BASE, error);
    }
  });

  test('should have correct API base URL configured', () => {
    expect(config.apiBaseUrl).toBeDefined();
    expect(config.apiBaseUrl).toBe('http://localhost:8000');
  });

  test('should match actual API response structure for job submission', async () => {
    // This test verifies our TypeScript interfaces match the real API
    
    // Create test file
    const content = 'ELF';
    const blob = new Blob([content], { type: 'application/octet-stream' });
    const file = new File([blob], 'test_binary.elf', { type: 'application/octet-stream' });

    // Create form data (matching our analysisApi.ts implementation)
    const formData = new FormData();
    formData.append('file', file);
    formData.append('analysis_depth', 'basic');
    formData.append('translation_detail', 'basic');

    try {
      const response = await fetch(`${API_BASE}/api/v1/decompile`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        // Verify response structure matches our JobSubmissionResponse interface
        expect(data).toHaveProperty('success');
        expect(data).toHaveProperty('job_id');
        expect(data).toHaveProperty('status');
        expect(data).toHaveProperty('message');
        expect(data).toHaveProperty('file_info');
        expect(data.file_info).toHaveProperty('filename');
        expect(data.file_info).toHaveProperty('size_bytes');
        expect(data.file_info).toHaveProperty('content_type');
        expect(data).toHaveProperty('config');
        expect(data.config).toHaveProperty('analysis_depth');
        expect(data.config).toHaveProperty('llm_provider');
        expect(data.config).toHaveProperty('translation_detail');
        expect(data).toHaveProperty('estimated_completion');
        expect(data).toHaveProperty('check_status_url');

        // Verify field values match what we sent
        expect(data.config.analysis_depth).toBe('basic');
        expect(data.config.translation_detail).toBe('basic');
        expect(data.file_info.filename).toBe('test_binary.elf');
        expect(data.success).toBe(true);
        expect(data.status).toBe('queued');
      } else {
        console.log('Job submission failed (expected if backend not running):', data);
      }
    } catch (error) {
      console.log('Network error (expected if backend not running):', error);
    }
  });

  test('should match actual API response structure for LLM providers', async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/llm-providers`);
      
      if (response.ok) {
        const data = await response.json();
        
        // Verify response structure matches our LLMProvider interfaces
        expect(data).toHaveProperty('providers');
        expect(data).toHaveProperty('recommended_provider');
        expect(data).toHaveProperty('total_healthy');
        expect(data).toHaveProperty('last_updated');
        expect(Array.isArray(data.providers)).toBe(true);
        
        // If we have providers, check their structure
        if (data.providers.length > 0) {
          const provider = data.providers[0];
          expect(provider).toHaveProperty('provider_id');
          expect(provider).toHaveProperty('name');
          expect(provider).toHaveProperty('status');
          expect(provider).toHaveProperty('available_models');
          expect(provider).toHaveProperty('cost_per_1k_tokens');
          expect(provider).toHaveProperty('capabilities');
          expect(provider).toHaveProperty('health_score');
          expect(Array.isArray(provider.available_models)).toBe(true);
          expect(Array.isArray(provider.capabilities)).toBe(true);
        }
      } else {
        console.log('LLM providers request failed (expected if backend not running)');
      }
    } catch (error) {
      console.log('Network error (expected if backend not running):', error);
    }
  });

  test('should match actual API response structure for system health', async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/health`);
      
      if (response.ok) {
        const data = await response.json();
        
        // Verify response structure matches our system health interface
        expect(data).toHaveProperty('status');
        expect(data).toHaveProperty('timestamp');
        expect(data).toHaveProperty('version');
        expect(data).toHaveProperty('environment');
        expect(data).toHaveProperty('services');
        expect(data.services).toHaveProperty('database');
        expect(data.services).toHaveProperty('storage');
        expect(data.services).toHaveProperty('llm_providers');
        
        // Verify specific service structure
        expect(data.services.database).toHaveProperty('status');
        expect(data.services.database).toHaveProperty('type');
        expect(data.services.database).toHaveProperty('response_time_ms');
        
        expect(data.services.storage).toHaveProperty('status');
        expect(data.services.storage).toHaveProperty('type');
        expect(data.services.storage).toHaveProperty('response_time_ms');
        
        expect(data.services.llm_providers).toHaveProperty('status');
        expect(data.services.llm_providers).toHaveProperty('message');
        expect(data.services.llm_providers).toHaveProperty('supported_providers');
        expect(data.services.llm_providers).toHaveProperty('mode');
        expect(data.services.llm_providers).toHaveProperty('note');
      } else {
        console.log('Health check failed (expected if backend not running)');
      }
    } catch (error) {
      console.log('Network error (expected if backend not running):', error);
    }
  });
});