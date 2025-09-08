# Mini-Technical Design Document: User-Configurable LLM Providers

## System Architecture Overview

**Design Philosophy:** Full-stack transformation from hardcoded to user-managed LLM providers with secure credential handling and seamless persistence across both backend and frontend.

### Architecture Components

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   Frontend (React)  │    │  Backend (FastAPI)  │    │  Database (SQLite)  │
│                     │    │                     │    │                     │
│ • Provider UI       │◄──►│ • Provider CRUD API │◄──►│ • user_llm_providers│
│ • Configuration     │    │ • Encryption Layer │    │ • Encrypted API keys│
│ • Secure Storage    │    │ • LLM Integration   │    │ • Provider configs  │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
```

## Backend System Design

### Database Schema Design

```sql
-- New table for user-configured LLM providers
CREATE TABLE user_llm_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    provider_type VARCHAR(50) NOT NULL CHECK (provider_type IN ('openai', 'anthropic', 'gemini', 'ollama')),
    encrypted_api_key TEXT NOT NULL,
    endpoint_url VARCHAR(500), -- nullable, only used for ollama
    config_json JSONB DEFAULT '{}', -- additional provider-specific settings
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Ensure unique provider names per user (future-proofing)
    CONSTRAINT unique_provider_name UNIQUE (name)
);

-- Index for performance
CREATE INDEX idx_user_llm_providers_active ON user_llm_providers (is_active);
CREATE INDEX idx_user_llm_providers_type ON user_llm_providers (provider_type);
```

### API Design

#### Core Provider Management Endpoints

```python
# New API routes in /src/api/routes/user_llm_providers.py

GET    /api/v1/user-llm-providers           # List user providers
POST   /api/v1/user-llm-providers           # Create new provider  
GET    /api/v1/user-llm-providers/{id}      # Get specific provider
PUT    /api/v1/user-llm-providers/{id}      # Update provider
DELETE /api/v1/user-llm-providers/{id}      # Delete provider
POST   /api/v1/user-llm-providers/{id}/test # Test provider connectivity

# Provider types endpoint
GET    /api/v1/user-llm-providers/types     # Get available provider types
```

#### Request/Response Models

```python
# Pydantic models in /src/models/api/user_llm_providers.py

class ProviderTypeEnum(str, Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic" 
    GEMINI = "gemini"
    OLLAMA = "ollama"

class UserLLMProviderCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    provider_type: ProviderTypeEnum
    api_key: str = Field(..., min_length=1)  # Will be encrypted before storage
    endpoint_url: Optional[str] = None  # Required for ollama, ignored for others
    
    @validator('endpoint_url')
    def validate_endpoint_url(cls, v, values):
        if values.get('provider_type') == ProviderTypeEnum.OLLAMA:
            if not v:
                raise ValueError('endpoint_url is required for ollama providers')
        return v

class UserLLMProviderResponse(BaseModel):
    id: str
    name: str
    provider_type: ProviderTypeEnum
    endpoint_url: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    # Note: api_key never returned in responses

class ProviderTestResult(BaseModel):
    success: bool
    message: str
    latency_ms: Optional[float]
```

### Security Architecture

#### API Key Encryption System

```python
# New encryption utility in /src/core/security.py

from cryptography.fernet import Fernet
import os
import base64

class ProviderCredentialManager:
    def __init__(self):
        # Encryption key from environment or generated at runtime
        self.encryption_key = self._get_or_create_encryption_key()
        self.cipher_suite = Fernet(self.encryption_key)
    
    def _get_or_create_encryption_key(self) -> bytes:
        # Use environment variable or generate ephemeral key
        key_b64 = os.getenv('LLM_PROVIDER_ENCRYPTION_KEY')
        if key_b64:
            return base64.urlsafe_b64decode(key_b64)
        else:
            # Generate ephemeral key (only for development)
            return Fernet.generate_key()
    
    def encrypt_api_key(self, api_key: str) -> str:
        encrypted_bytes = self.cipher_suite.encrypt(api_key.encode())
        return base64.urlsafe_b64encode(encrypted_bytes).decode()
    
    def decrypt_api_key(self, encrypted_api_key: str) -> str:
        encrypted_bytes = base64.urlsafe_b64decode(encrypted_api_key.encode())
        decrypted_bytes = self.cipher_suite.decrypt(encrypted_bytes)
        return decrypted_bytes.decode()
```

#### LLM Provider Integration

```python
# Enhanced LLM factory in /src/llm/providers/user_provider_factory.py

class UserLLMProviderFactory:
    """Factory for user-configured LLM providers"""
    
    def __init__(self, credential_manager: ProviderCredentialManager):
        self.credential_manager = credential_manager
        self.provider_cache = {}
    
    async def create_provider_from_config(self, provider_config: UserLLMProviderResponse) -> LLMProvider:
        """Create LLM provider instance from user configuration"""
        
        # Decrypt API key
        decrypted_api_key = self.credential_manager.decrypt_api_key(
            provider_config.encrypted_api_key
        )
        
        # Create provider configuration
        llm_config = LLMConfig(
            provider_id=provider_config.provider_type,
            api_key=decrypted_api_key,
            endpoint_url=provider_config.endpoint_url,  # None for cloud providers
            default_model=self._get_default_model(provider_config.provider_type)
        )
        
        # Create provider instance
        provider_class = PROVIDER_CLASSES[provider_config.provider_type]
        return provider_class(llm_config)
```

### Migration Strategy

#### Phase 1: Parallel Implementation
```python
# Update existing /src/api/routes/llm_providers.py to support both systems

@router.get("/llm-providers", response_model=LLMProvidersResponse)
async def list_llm_providers(
    include_user_providers: bool = Query(True, description="Include user-configured providers")
):
    """Enhanced endpoint supporting both hardcoded and user providers"""
    
    providers = []
    
    if include_user_providers:
        # Load user-configured providers
        user_providers = await get_user_llm_providers()
        for user_provider in user_providers:
            provider_info = await convert_user_provider_to_info(user_provider)
            providers.append(provider_info)
    
    # TODO: Remove hardcoded providers after migration
    # hardcoded_providers = await get_hardcoded_providers()
    # providers.extend(hardcoded_providers)
    
    return LLMProvidersResponse(
        providers=providers,
        recommended_provider=None,  # Let user choose
        total_healthy=len([p for p in providers if p.status == "healthy"])
    )
```

## Frontend System Design

### Component Architecture

```
src/components/llm-providers/
├── UserLLMProviderDashboard.tsx     # Main provider management interface
├── ProviderConfigModal.tsx          # Add/Edit provider modal
├── ProviderTypeSelector.tsx         # Provider type selection
├── ProviderConfigForm.tsx           # Type-specific configuration forms
├── ProviderCard.tsx                 # Individual provider display
├── ProviderTestResult.tsx           # Test connectivity results
└── EmptyProvidersState.tsx          # Guidance for empty state
```

### State Management Design

#### Redux Store Structure

```typescript
// Enhanced store structure in /src/store/slices/userLLMProvidersSlice.ts

interface UserLLMProvidersState {
  providers: UserLLMProvider[];
  loading: boolean;
  error: string | null;
  
  // UI state
  configModal: {
    isOpen: boolean;
    mode: 'create' | 'edit' | null;
    editingProvider: UserLLMProvider | null;
  };
  
  // Test state
  testing: {
    providerId: string | null;
    inProgress: boolean;
    results: Record<string, ProviderTestResult>;
  };
}

const userLLMProvidersSlice = createSlice({
  name: 'userLLMProviders',
  initialState,
  reducers: {
    openConfigModal: (state, action) => {
      state.configModal.isOpen = true;
      state.configModal.mode = action.payload.mode;
      state.configModal.editingProvider = action.payload.provider || null;
    },
    closeConfigModal: (state) => {
      state.configModal.isOpen = false;
      state.configModal.mode = null;
      state.configModal.editingProvider = null;
    },
    startProviderTest: (state, action) => {
      state.testing.providerId = action.payload;
      state.testing.inProgress = true;
    },
    completeProviderTest: (state, action) => {
      state.testing.inProgress = false;
      state.testing.results[action.payload.providerId] = action.payload.result;
    }
  },
  extraReducers: (builder) => {
    // RTK Query integration
    builder
      .addMatcher(userLLMProvidersApi.endpoints.getUserProviders.matchPending, (state) => {
        state.loading = true;
      })
      .addMatcher(userLLMProvidersApi.endpoints.getUserProviders.matchFulfilled, (state, action) => {
        state.loading = false;
        state.providers = action.payload;
      });
  }
});
```

#### RTK Query API Definition

```typescript
// API definitions in /src/services/api/userLLMProvidersApi.ts

export const userLLMProvidersApi = createApi({
  reducerPath: 'userLLMProvidersApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/v1/user-llm-providers',
    // Add auth headers if needed
  }),
  tagTypes: ['UserLLMProvider'],
  endpoints: (builder) => ({
    getUserProviders: builder.query<UserLLMProvider[], void>({
      query: () => '',
      providesTags: ['UserLLMProvider'],
    }),
    
    createUserProvider: builder.mutation<UserLLMProvider, UserLLMProviderCreate>({
      query: (provider) => ({
        url: '',
        method: 'POST',
        body: provider,
      }),
      invalidatesTags: ['UserLLMProvider'],
    }),
    
    updateUserProvider: builder.mutation<UserLLMProvider, { id: string; updates: Partial<UserLLMProviderCreate> }>({
      query: ({ id, updates }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: ['UserLLMProvider'],
    }),
    
    deleteUserProvider: builder.mutation<void, string>({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['UserLLMProvider'],
    }),
    
    testUserProvider: builder.mutation<ProviderTestResult, string>({
      query: (id) => ({
        url: `/${id}/test`,
        method: 'POST',
      }),
    }),
  }),
});
```

### UI Design Patterns

#### Main Dashboard Component

```typescript
// UserLLMProviderDashboard.tsx - Main interface component

export const UserLLMProviderDashboard: React.FC = () => {
  const { data: providers = [], isLoading } = useGetUserProvidersQuery();
  const dispatch = useAppDispatch();
  const { configModal } = useAppSelector(state => state.userLLMProviders);

  const handleAddProvider = () => {
    dispatch(openConfigModal({ mode: 'create' }));
  };

  if (isLoading) return <LoadingState />;
  
  if (providers.length === 0) {
    return <EmptyProvidersState onAddProvider={handleAddProvider} />;
  }

  return (
    <Box>
      <Typography variant="h4">Your LLM Providers</Typography>
      <Button 
        variant="contained" 
        startIcon={<AddIcon />}
        onClick={handleAddProvider}
      >
        Add Provider
      </Button>
      
      <Grid container spacing={3}>
        {providers.map(provider => (
          <Grid item xs={12} md={6} lg={4} key={provider.id}>
            <ProviderCard provider={provider} />
          </Grid>
        ))}
      </Grid>
      
      <ProviderConfigModal 
        open={configModal.isOpen}
        mode={configModal.mode}
        provider={configModal.editingProvider}
      />
    </Box>
  );
};
```

#### Empty State Component

```typescript
// EmptyProvidersState.tsx - Welcoming empty state

export const EmptyProvidersState: React.FC<{ onAddProvider: () => void }> = ({ 
  onAddProvider 
}) => (
  <Box sx={{ textAlign: 'center', py: 8 }}>
    <img src="/empty-providers.svg" alt="No providers" width={200} />
    <Typography variant="h5" gutterBottom>
      No LLM Providers Configured
    </Typography>
    <Typography variant="body1" color="text.secondary" paragraph>
      Get started by adding your first LLM provider. Choose from OpenAI, 
      Anthropic, Gemini, or set up a local Ollama server.
    </Typography>
    <Button 
      variant="contained" 
      size="large"
      onClick={onAddProvider}
      startIcon={<AddIcon />}
    >
      Add Your First Provider
    </Button>
  </Box>
);
```

### Security Considerations

#### Frontend Security Patterns

```typescript
// Secure credential handling in forms
export const ProviderConfigForm: React.FC<Props> = ({ providerType, onSubmit }) => {
  const [credentials, setCredentials] = useState({
    name: '',
    apiKey: '', // Never persisted to localStorage
    endpointUrl: ''
  });

  // API key input with security attributes
  const ApiKeyField = (
    <TextField
      label="API Key"
      type="password"
      value={credentials.apiKey}
      onChange={(e) => setCredentials(prev => ({ ...prev, apiKey: e.target.value }))}
      autoComplete="new-password" // Prevent browser password saving
      spellCheck={false}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton edge="end">
              <VisibilityOffIcon />
            </IconButton>
          </InputAdornment>
        )
      }}
    />
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    // Submit credentials (will be encrypted by backend)
    onSubmit(credentials);
    
    // Clear sensitive data from memory immediately
    setCredentials(prev => ({ ...prev, apiKey: '' }));
  };
```

## Data Flow Architecture

### Provider Configuration Flow

```
User Input → Form Validation → API Call → Backend Encryption → Database Storage
    ↓
Provider List Update ← UI State Update ← API Response ← Encrypted Storage
```

### Analysis Job Integration Flow

```
User Selects Provider → Provider ID Passed to Job → Backend Decrypts Credentials → LLM Service Call
```

## Performance Considerations

### Backend Performance
- **Database Indexing:** Indexes on active providers and provider types
- **Encryption Caching:** Cache decrypted credentials during job execution
- **Connection Pooling:** Reuse LLM provider connections where possible

### Frontend Performance  
- **Provider Caching:** Cache provider list in Redux store
- **Lazy Loading:** Load provider management components on demand
- **Form Optimization:** Debounced validation and optimistic updates

## Testing Strategy

### Backend Testing
```python
# Test coverage for provider CRUD operations
class TestUserLLMProviders:
    async def test_create_provider_encrypts_api_key(self):
        # Verify API key is encrypted in database
        pass
    
    async def test_provider_test_connection(self):
        # Verify provider connectivity testing
        pass
    
    async def test_provider_deletion_cleanup(self):
        # Verify proper cleanup on provider deletion
        pass
```

### Frontend Testing
```typescript
// Test coverage for provider management UI
describe('UserLLMProviderDashboard', () => {
  test('shows empty state for new users', () => {
    // Verify empty state guidance
  });
  
  test('creates provider with secure credential handling', () => {
    // Verify credentials never persisted in browser
  });
  
  test('integrates with upload interface', () => {
    // Verify provider selection in upload flow
  });
});
```

## Migration and Deployment

### Database Migration
```sql
-- Migration script: add_user_llm_providers.sql
-- Run before deploying new version

-- Create new table
CREATE TABLE user_llm_providers (...);

-- Migrate existing hardcoded providers (optional)
-- INSERT INTO user_llm_providers (name, provider_type, encrypted_api_key) 
-- SELECT 'Default ' || provider_type, provider_type, encrypt_api_key(api_key)
-- FROM current_provider_configs;
```

### Deployment Checklist
- [ ] Database migration applied
- [ ] Encryption key environment variable set
- [ ] Frontend build includes new provider management routes
- [ ] Backend API endpoints tested
- [ ] Security scan for credential exposure
- [ ] User documentation updated

---

**Document Created:** 2025-09-06  
**Next Phase:** Technical Implementation Document (TID)  
**Implementation Complexity:** High (Full-stack with security considerations)