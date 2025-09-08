# Mini-Feature PRD: User-Configurable LLM Providers

## Feature Overview

**Feature Name:** User-Configurable LLM Provider Management  
**Priority:** Core/Critical - Essential for user autonomy and security  
**Target:** Full-stack implementation (Backend + Frontend)

**Problem Statement:** Currently, LLM providers are pre-configured in the backend with static settings, forcing users to work with hardcoded providers and potentially exposing API keys in configuration files. Users need complete control over their LLM provider configurations with secure, persistent storage that survives application restarts.

**Feature Goals:**

- Eliminate pre-configured LLM providers from backend
- Enable users to create custom LLM provider configurations
- Provide secure, persistent storage for user configurations (excluding API keys from codebase)
- Support multiple provider types with appropriate configuration interfaces
- Maintain configuration across application/container restarts

## User Stories & Scenarios

### Primary User Stories

**US1: Clean Slate Provider Management**

- As a user, I want to start with no pre-configured LLM providers
- So that I have complete control over my provider ecosystem
- Acceptance: Application starts with empty provider list

**US2: Provider Type Selection**

- As a user, I want to choose from provider types (OpenAI, Anthropic, Gemini, Ollama)
- So that I get the appropriate configuration interface for each provider
- Acceptance: UI shows 4 provider type options with type-specific forms

**US3: Cloud Provider Configuration (OpenAI/Anthropic/Gemini)**

- As a user, I want to configure cloud providers with just name, type, and API key
- So that I can quickly set up commercial LLM services
- Acceptance: Simple form with Name + API Key fields only

**US4: Local Provider Configuration (Ollama)**

- As a user, I want to configure Ollama with name, placeholder API key, and endpoint URL
- So that I can use local LLM infrastructure
- Acceptance: Form with Name + Fake API Key + Endpoint URL fields

**US5: Persistent Configuration**

- As a user, I want my provider configurations to persist across restarts
- So that I don't lose my setup when containers/services restart
- Acceptance: Providers remain configured after backend/frontend restarts

**US6: Secure API Key Handling**

- As a user, I want my API keys to never appear in source code or containers
- So that my credentials remain secure during development and deployment
- Acceptance: API keys stored only in runtime memory/user storage, never in codebase

### User Journey Flows

1. **Initial Setup Flow:**
   - User opens LLM Providers page → sees empty list
   - Clicks "Add Provider" → selects provider type
   - Fills configuration form → saves provider
   - Provider appears in dropdown lists for analysis jobs

2. **Configuration Management Flow:**
   - User views configured providers → edits/deletes as needed
   - Changes persist across application restarts
   - Provider configurations available in upload interface

## Functional Requirements

### Backend Requirements (API)

1. **Provider Configuration API**
   - `GET /api/v1/user-llm-providers` - List user-configured providers
   - `POST /api/v1/user-llm-providers` - Create new provider configuration
   - `PUT /api/v1/user-llm-providers/{id}` - Update provider configuration
   - `DELETE /api/v1/user-llm-providers/{id}` - Delete provider configuration
   - `POST /api/v1/user-llm-providers/{id}/test` - Test provider connectivity

2. **Provider Type Support**
   - OpenAI provider type with API key validation
   - Anthropic provider type with API key validation
   - Gemini provider type with API key validation
   - Ollama provider type with endpoint URL validation

3. **Storage and Persistence**
   - User configurations stored in database (not filesystem)
   - API keys encrypted in database storage
   - No API keys or configurations in environment files or Docker images

4. **Integration with Analysis Jobs**
   - Analysis jobs accept user-provider-id instead of pre-configured provider types
   - Job execution uses user-configured provider settings
   - Provider credentials passed securely to LLM services

### Frontend Requirements (UI)

1. **Provider Management Interface**
   - Empty providers list on initial load
   - "Add Provider" button with provider type selection modal
   - Provider type-specific configuration forms
   - Providers list with edit/delete/test actions

2. **Configuration Forms**
   - **OpenAI/Anthropic/Gemini:** Name + API Key fields
   - **Ollama:** Name + Placeholder API Key + Endpoint URL fields
   - Form validation with real-time feedback
   - Secure API key input (password fields, no auto-complete)

3. **Integration with Upload Interface**
   - Provider dropdown populated from user-configured providers
   - Selected provider passed to analysis job submission
   - Provider status/health indication in dropdown

4. **Persistence and Security**
   - Provider configurations stored in localStorage/sessionStorage
   - API keys stored in memory during session
   - No credentials persisted in browser storage permanently

## Technical Constraints

### Backend Constraints

- Remove all hardcoded LLM provider configurations from environment files
- Implement database schema for user provider configurations
- Secure API key encryption/decryption for database storage
- Maintain backward compatibility during migration

### Frontend Constraints

- Follow existing Material-UI design patterns
- Use Redux Toolkit for state management consistency
- Implement secure credential handling (no localStorage for API keys)
- Support existing routing and authentication patterns

### Security Requirements

- API keys never stored in codebase, containers, or version control
- Database encryption for stored credentials
- Secure transmission of credentials (HTTPS only)
- Session-based credential management in frontend

## User Experience Requirements

### UI/UX Specifications

- Clean, empty state with clear "Get Started" guidance
- Intuitive provider type selection with visual indicators
- Type-specific forms that hide complexity for simple providers
- Immediate feedback on configuration validation
- Clear success/error states for provider testing

### Interaction Patterns

- Modal-based provider configuration to maintain context
- Inline editing for provider name/non-sensitive fields
- Confirmation dialogs for provider deletion
- Progress indicators for provider testing/validation

## Data Requirements

### Backend Data Models

```sql
user_llm_providers:
- id (uuid, primary key)
- name (string, user-defined)
- provider_type (enum: openai, anthropic, gemini, ollama)
- encrypted_api_key (text, encrypted)
- endpoint_url (string, nullable, for ollama)
- config_json (jsonb, additional provider-specific settings)
- created_at, updated_at timestamps
- is_active boolean
```

### Frontend Data Models

```typescript
interface UserLLMProvider {
  id: string;
  name: string;
  providerType: 'openai' | 'anthropic' | 'gemini' | 'ollama';
  endpointUrl?: string; // for ollama only
  isActive: boolean;
  createdAt: string;
  // Note: API key never stored in frontend models
}

interface ProviderConfiguration {
  name: string;
  providerType: string;
  apiKey: string; // memory only
  endpointUrl?: string;
}
```

## API/Integration Specifications

### New Backend Endpoints

- User Provider CRUD operations
- Provider type validation and testing
- Integration with existing job submission endpoints

### Frontend API Integration

- RTK Query definitions for provider management
- Secure credential handling in API calls
- Integration with existing analysis job submission flow

## Success Criteria

### Quantitative Measures

- Zero pre-configured providers on fresh installation
- 100% of user configurations persist across restarts
- API key security validation (no keys in codebase/containers)
- Sub-2-second provider configuration save/load times

### Qualitative Measures

- Users can configure any supported provider type without technical knowledge
- Clean, empty initial state provides clear guidance
- Provider testing provides immediate feedback on configuration validity
- Secure credential handling gives users confidence in API key safety

## Feature Boundaries (Non-Goals)

### Explicitly Out of Scope

- User authentication/authorization (assume single user for now)
- Provider auto-discovery or API key validation during setup
- Advanced provider settings (temperature, max tokens) - use defaults
- Provider sharing between users
- Import/export of provider configurations
- Provider usage analytics or cost tracking

## Dependencies

### Backend Dependencies

- Database migration system for new user_llm_providers table
- Encryption/decryption utilities for API key storage
- Updated job submission logic to use user providers

### Frontend Dependencies

- Updated Redux store structure for user providers
- Modified upload interface to use user provider dropdown
- New provider management routes and components

## Implementation Considerations

### Migration Strategy

1. Implement new user provider system alongside existing system
2. Migrate existing hardcoded providers to user-configurable format
3. Remove hardcoded provider configurations after migration testing
4. Update documentation and deployment guides

### Risk Factors

- **API Key Security:** Critical to implement proper encryption and never expose keys
- **Data Migration:** Existing users may need provider migration assistance
- **Backward Compatibility:** Analysis jobs must work during transition period
- **User Experience:** Empty initial state must be welcoming, not confusing

### Testing Requirements

- Unit tests for provider CRUD operations (backend/frontend)
- Integration tests for secure API key handling
- E2E tests for complete provider configuration workflow
- Security tests to verify no credential exposure

## Open Questions

1. **Database Choice:** Should user providers be stored in existing PostgreSQL or separate secure store?
2. **Migration Path:** How should existing analysis jobs reference new user provider system?
3. **Provider Templates:** Should we provide example configurations for common providers?
4. **Error Handling:** How should we handle provider configuration errors during analysis jobs?
5. **Performance:** Should we cache user provider configurations for faster job execution?

---

**Document Created:** 2025-09-06  
**Next Phase:** Technical Design Document (TDD)  
**Estimated Implementation:** 1-2 weeks full-stack development
