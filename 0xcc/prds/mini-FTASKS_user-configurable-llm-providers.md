# Task List: User-Configurable LLM Providers

## Implementation Overview

Based on the mini-TID, this task list implements a complete user-configurable LLM provider system that eliminates hardcoded providers and enables users to manage their own provider configurations securely. The implementation follows a backend-first approach with database persistence and secure API key handling.

## Relevant Files

### Backend Files
- `src/core/security.py` - New encryption utility for API key security
- `src/models/database/user_llm_providers.py` - New database model for user providers
- `src/repositories/user_llm_providers.py` - New repository layer for provider CRUD operations
- `src/api/routes/user_llm_providers.py` - New API routes for provider management
- `src/llm/providers/user_provider_factory.py` - Enhanced factory for user-configured providers
- `src/api/routes/llm_providers.py` - Modified to use user providers instead of hardcoded
- `src/api/routes/decompile.py` - Modified to accept user provider IDs
- `database/migrations/add_user_llm_providers.sql` - Database migration script
- `.env` - Remove hardcoded LLM provider configurations
- `requirements.txt` - Add cryptography dependency

### Frontend Files
- `src/components/llm-providers/UserLLMProviderDashboard.tsx` - Main provider management interface
- `src/components/llm-providers/ProviderConfigModal.tsx` - Add/Edit provider modal
- `src/components/llm-providers/ProviderTypeSelector.tsx` - Provider type selection component
- `src/components/llm-providers/ProviderConfigForm.tsx` - Type-specific configuration forms
- `src/components/llm-providers/ProviderCard.tsx` - Individual provider display card
- `src/components/llm-providers/EmptyProvidersState.tsx` - Empty state guidance component
- `src/services/api/userLLMProvidersApi.ts` - RTK Query API for provider management
- `src/store/slices/userLLMProvidersSlice.ts` - Redux slice for provider state
- `src/pages/ProvidersPage.tsx` - Main providers management page
- `src/components/upload/ProviderSelector.tsx` - Modified provider selection in upload
- `src/types/UserLLMProvider.types.ts` - TypeScript types for user providers

### Notes
- API key encryption uses Fernet cipher with runtime-generated or environment-provided key
- Database migrations must be run before deploying new version
- Frontend provider selection integrates with existing upload interface
- All API keys stored encrypted in database, never in codebase or containers

## Tasks

- [ ] 1.0 Backend Infrastructure Setup
  - [ ] 1.1 Create encryption utility class for API key security in `src/core/security.py`
  - [ ] 1.2 Add cryptography dependency to requirements.txt
  - [ ] 1.3 Create database model for user_llm_providers table
  - [ ] 1.4 Create and test database migration script
  - [ ] 1.5 Create repository layer for user provider CRUD operations

- [ ] 2.0 Backend API Implementation
  - [ ] 2.1 Create Pydantic models for user provider requests/responses
  - [ ] 2.2 Implement user provider API routes (CRUD + test endpoints)
  - [ ] 2.3 Create enhanced LLM provider factory for user configurations
  - [ ] 2.4 Modify existing llm_providers route to use user providers
  - [ ] 2.5 Update decompile route to accept user provider IDs instead of types

- [ ] 3.0 Frontend State Management Setup
  - [ ] 3.1 Create TypeScript types for user LLM providers
  - [ ] 3.2 Create RTK Query API definitions for provider management
  - [ ] 3.3 Create Redux slice for user provider state management
  - [ ] 3.4 Set up provider management routing

- [ ] 4.0 Frontend Provider Management Interface
  - [ ] 4.1 Create empty providers state component with guidance
  - [ ] 4.2 Create provider type selector modal component
  - [ ] 4.3 Create type-specific configuration forms (OpenAI/Anthropic/Gemini/Ollama)
  - [ ] 4.4 Create provider card component with edit/delete/test actions
  - [ ] 4.5 Create main provider dashboard component
  - [ ] 4.6 Create provider configuration modal with form validation

- [ ] 5.0 Frontend Integration with Existing Features
  - [ ] 5.1 Modify upload interface to use user-configured providers
  - [ ] 5.2 Update provider selector component in upload form
  - [ ] 5.3 Integrate provider health status in upload interface
  - [ ] 5.4 Update job submission to use user provider IDs

- [ ] 6.0 Security and Migration Implementation
  - [ ] 6.1 Implement secure API key handling in forms (no persistence)
  - [ ] 6.2 Add environment variable for encryption key
  - [ ] 6.3 Create migration strategy for existing hardcoded providers
  - [ ] 6.4 Remove hardcoded provider configurations from .env
  - [ ] 6.5 Update Docker configuration for new encryption key environment variable

- [ ] 7.0 Testing and Quality Assurance
  - [ ] 7.1 Create unit tests for encryption utility and repository layer
  - [ ] 7.2 Create API integration tests for provider CRUD operations
  - [ ] 7.3 Create frontend component tests for provider management
  - [ ] 7.4 Create end-to-end test for complete provider configuration workflow
  - [ ] 7.5 Test security measures (API key encryption, no credential exposure)

- [ ] 8.0 Documentation and Deployment
  - [ ] 8.1 Update API documentation for new provider endpoints
  - [ ] 8.2 Create user documentation for provider configuration
  - [ ] 8.3 Update deployment documentation for encryption key setup
  - [ ] 8.4 Create migration instructions for existing installations
  - [ ] 8.5 Validate complete system with fresh installation