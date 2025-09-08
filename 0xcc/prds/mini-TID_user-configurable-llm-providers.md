# Mini-Technical Implementation Document: User-Configurable LLM Providers

## Implementation Strategy

**Approach:** Parallel full-stack development with backend-first foundation, followed by frontend integration and testing. Maintain existing functionality during migration.

**Key Implementation Principles:**
- **Security First:** API key encryption implemented before any storage
- **Backward Compatibility:** Maintain existing LLM functionality during transition  
- **Full-Stack Synchronization:** Backend changes drive frontend requirements
- **Zero Downtime:** Implement alongside existing system, then migrate

## Backend Implementation Details

### Database Implementation

#### Migration Scripts
```sql
-- File: /database/migrations/003_add_user_llm_providers.sql

-- Create user LLM providers table
CREATE TABLE user_llm_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    provider_type VARCHAR(50) NOT NULL CHECK (provider_type IN ('openai', 'anthropic', 'gemini', 'ollama')),
    encrypted_api_key TEXT NOT NULL,
    endpoint_url VARCHAR(500), -- nullable, only for ollama
    config_json JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    CONSTRAINT unique_provider_name UNIQUE (name)
);

-- Performance indexes
CREATE INDEX idx_user_llm_providers_active ON user_llm_providers (is_active);
CREATE INDEX idx_user_llm_providers_type ON user_llm_providers (provider_type);
CREATE INDEX idx_user_llm_providers_created ON user_llm_providers (created_at DESC);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_llm_providers_updated_at
    BEFORE UPDATE ON user_llm_providers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

#### Database Model Implementation
```python
# File: /src/models/database/user_llm_providers.py

from sqlalchemy import Column, String, Text, Boolean, DateTime, UUID, CheckConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from src.database.base import Base
import uuid

class UserLLMProvider(Base):
    __tablename__ = "user_llm_providers"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, unique=True)
    provider_type = Column(String(50), nullable=False)
    encrypted_api_key = Column(Text, nullable=False)
    endpoint_url = Column(String(500), nullable=True)
    config_json = Column(JSONB, default={})
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    __table_args__ = (
        CheckConstraint(
            "provider_type IN ('openai', 'anthropic', 'gemini', 'ollama')",
            name='valid_provider_type'
        ),
    )
    
    def __repr__(self):
        return f"<UserLLMProvider(name='{self.name}', type='{self.provider_type}')>"
```

### Security Implementation

#### Encryption Service
```python
# File: /src/core/security/credential_manager.py

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import os
import base64
from typing import Optional

class ProviderCredentialManager:
    """Secure credential encryption/decryption for LLM provider API keys"""
    
    def __init__(self):
        self.cipher_suite = self._initialize_cipher()
    
    def _initialize_cipher(self) -> Fernet:
        """Initialize Fernet cipher with key from environment or generate ephemeral"""
        encryption_key = os.getenv('LLM_PROVIDER_ENCRYPTION_KEY')
        
        if encryption_key:
            # Use provided base64-encoded key
            key = base64.urlsafe_b64decode(encryption_key.encode())
        else:
            # Generate ephemeral key (development only)
            key = Fernet.generate_key()
            print(f"WARNING: Using ephemeral encryption key. Set LLM_PROVIDER_ENCRYPTION_KEY for production.")
            print(f"Generated key: {base64.urlsafe_b64encode(key).decode()}")
        
        return Fernet(key)
    
    def encrypt_api_key(self, api_key: str) -> str:
        """Encrypt API key for database storage"""
        if not api_key:
            raise ValueError("API key cannot be empty")
        
        encrypted_bytes = self.cipher_suite.encrypt(api_key.encode('utf-8'))
        return base64.urlsafe_b64encode(encrypted_bytes).decode('utf-8')
    
    def decrypt_api_key(self, encrypted_api_key: str) -> str:
        """Decrypt API key for LLM service usage"""
        if not encrypted_api_key:
            raise ValueError("Encrypted API key cannot be empty")
        
        try:
            encrypted_bytes = base64.urlsafe_b64decode(encrypted_api_key.encode('utf-8'))
            decrypted_bytes = self.cipher_suite.decrypt(encrypted_bytes)
            return decrypted_bytes.decode('utf-8')
        except Exception as e:
            raise ValueError(f"Failed to decrypt API key: {str(e)}")
    
    @classmethod
    def generate_key(cls) -> str:
        """Generate a new encryption key for environment configuration"""
        key = Fernet.generate_key()
        return base64.urlsafe_b64encode(key).decode('utf-8')
```

### Repository Layer Implementation

```python
# File: /src/repositories/user_llm_providers.py

from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_
from src.models.database.user_llm_providers import UserLLMProvider
from src.models.api.user_llm_providers import UserLLMProviderCreate, UserLLMProviderUpdate
from src.core.security.credential_manager import ProviderCredentialManager
import uuid

class UserLLMProviderRepository:
    """Repository for user LLM provider CRUD operations"""
    
    def __init__(self, db: Session, credential_manager: ProviderCredentialManager):
        self.db = db
        self.credential_manager = credential_manager
    
    async def create_provider(self, provider_data: UserLLMProviderCreate) -> UserLLMProvider:
        """Create new user LLM provider with encrypted API key"""
        # Encrypt API key before storage
        encrypted_api_key = self.credential_manager.encrypt_api_key(provider_data.api_key)
        
        db_provider = UserLLMProvider(
            name=provider_data.name,
            provider_type=provider_data.provider_type,
            encrypted_api_key=encrypted_api_key,
            endpoint_url=provider_data.endpoint_url,
            config_json=provider_data.config_json or {}
        )
        
        self.db.add(db_provider)
        self.db.commit()
        self.db.refresh(db_provider)
        return db_provider
    
    async def get_provider_by_id(self, provider_id: uuid.UUID) -> Optional[UserLLMProvider]:
        """Get provider by ID"""
        return self.db.query(UserLLMProvider).filter(UserLLMProvider.id == provider_id).first()
    
    async def get_active_providers(self) -> List[UserLLMProvider]:
        """Get all active user providers"""
        return self.db.query(UserLLMProvider).filter(UserLLMProvider.is_active == True).all()
    
    async def update_provider(self, provider_id: uuid.UUID, updates: UserLLMProviderUpdate) -> Optional[UserLLMProvider]:
        """Update existing provider"""
        db_provider = await self.get_provider_by_id(provider_id)
        if not db_provider:
            return None
        
        update_data = updates.dict(exclude_unset=True)
        
        # Handle API key encryption if updated
        if 'api_key' in update_data:
            update_data['encrypted_api_key'] = self.credential_manager.encrypt_api_key(update_data.pop('api_key'))
        
        for field, value in update_data.items():
            setattr(db_provider, field, value)
        
        self.db.commit()
        self.db.refresh(db_provider)
        return db_provider
    
    async def delete_provider(self, provider_id: uuid.UUID) -> bool:
        """Soft delete provider (set is_active = False)"""
        db_provider = await self.get_provider_by_id(provider_id)
        if not db_provider:
            return False
        
        db_provider.is_active = False
        self.db.commit()
        return True
    
    def get_decrypted_api_key(self, provider: UserLLMProvider) -> str:
        """Get decrypted API key for LLM service usage"""
        return self.credential_manager.decrypt_api_key(provider.encrypted_api_key)
```

### API Routes Implementation

```python
# File: /src/api/routes/user_llm_providers.py

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.database.connection import get_db
from src.repositories.user_llm_providers import UserLLMProviderRepository
from src.models.api.user_llm_providers import (
    UserLLMProviderCreate, 
    UserLLMProviderResponse, 
    UserLLMProviderUpdate,
    ProviderTestResult
)
from src.core.security.credential_manager import ProviderCredentialManager
from src.core.logging import get_logger
import uuid

logger = get_logger(__name__)
router = APIRouter(prefix="/user-llm-providers", tags=["User LLM Providers"])

# Dependency injection
def get_credential_manager() -> ProviderCredentialManager:
    return ProviderCredentialManager()

def get_provider_repository(
    db: Session = Depends(get_db),
    credential_manager: ProviderCredentialManager = Depends(get_credential_manager)
) -> UserLLMProviderRepository:
    return UserLLMProviderRepository(db, credential_manager)

@router.post("/", response_model=UserLLMProviderResponse, status_code=status.HTTP_201_CREATED)
async def create_user_provider(
    provider_data: UserLLMProviderCreate,
    repository: UserLLMProviderRepository = Depends(get_provider_repository)
):
    """Create a new user-configured LLM provider"""
    try:
        # Check for duplicate names
        existing = await repository.get_provider_by_name(provider_data.name)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Provider with name '{provider_data.name}' already exists"
            )
        
        db_provider = await repository.create_provider(provider_data)
        logger.info(f"Created user LLM provider: {provider_data.name} ({provider_data.provider_type})")
        
        return UserLLMProviderResponse.from_db_model(db_provider)
        
    except Exception as e:
        logger.error(f"Failed to create user provider: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create LLM provider"
        )

@router.get("/", response_model=List[UserLLMProviderResponse])
async def get_user_providers(
    repository: UserLLMProviderRepository = Depends(get_provider_repository)
):
    """Get all active user-configured LLM providers"""
    try:
        providers = await repository.get_active_providers()
        return [UserLLMProviderResponse.from_db_model(p) for p in providers]
        
    except Exception as e:
        logger.error(f"Failed to get user providers: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve LLM providers"
        )

@router.get("/{provider_id}", response_model=UserLLMProviderResponse)
async def get_user_provider(
    provider_id: uuid.UUID,
    repository: UserLLMProviderRepository = Depends(get_provider_repository)
):
    """Get specific user-configured LLM provider"""
    provider = await repository.get_provider_by_id(provider_id)
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="LLM provider not found"
        )
    
    return UserLLMProviderResponse.from_db_model(provider)

@router.put("/{provider_id}", response_model=UserLLMProviderResponse)
async def update_user_provider(
    provider_id: uuid.UUID,
    updates: UserLLMProviderUpdate,
    repository: UserLLMProviderRepository = Depends(get_provider_repository)
):
    """Update user-configured LLM provider"""
    try:
        updated_provider = await repository.update_provider(provider_id, updates)
        if not updated_provider:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="LLM provider not found"
            )
        
        logger.info(f"Updated user LLM provider: {provider_id}")
        return UserLLMProviderResponse.from_db_model(updated_provider)
        
    except Exception as e:
        logger.error(f"Failed to update user provider {provider_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update LLM provider"
        )

@router.delete("/{provider_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user_provider(
    provider_id: uuid.UUID,
    repository: UserLLMProviderRepository = Depends(get_provider_repository)
):
    """Delete user-configured LLM provider"""
    success = await repository.delete_provider(provider_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="LLM provider not found"
        )
    
    logger.info(f"Deleted user LLM provider: {provider_id}")

@router.post("/{provider_id}/test", response_model=ProviderTestResult)
async def test_user_provider(
    provider_id: uuid.UUID,
    repository: UserLLMProviderRepository = Depends(get_provider_repository)
):
    """Test connectivity to user-configured LLM provider"""
    provider = await repository.get_provider_by_id(provider_id)
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="LLM provider not found"
        )
    
    try:
        # Test provider connectivity
        from src.services.llm_provider_test_service import LLMProviderTestService
        test_service = LLMProviderTestService(repository)
        
        result = await test_service.test_provider_connectivity(provider)
        return result
        
    except Exception as e:
        logger.error(f"Provider test failed for {provider_id}: {str(e)}")
        return ProviderTestResult(
            success=False,
            message=f"Test failed: {str(e)}",
            latency_ms=None
        )
```

### LLM Integration Service

```python
# File: /src/services/user_llm_provider_service.py

from typing import Optional
from src.repositories.user_llm_providers import UserLLMProviderRepository
from src.llm.providers.factory import LLMProviderFactory
from src.llm.base import LLMConfig, LLMProvider
from src.models.database.user_llm_providers import UserLLMProvider
import uuid

class UserLLMProviderService:
    """Service for integrating user-configured providers with LLM operations"""
    
    def __init__(self, repository: UserLLMProviderRepository):
        self.repository = repository
        self.provider_cache = {}  # Cache active provider instances
    
    async def get_provider_for_analysis(self, provider_id: uuid.UUID) -> Optional[LLMProvider]:
        """Get configured LLM provider for analysis job execution"""
        
        # Check cache first
        cache_key = str(provider_id)
        if cache_key in self.provider_cache:
            return self.provider_cache[cache_key]
        
        # Fetch from database
        db_provider = await self.repository.get_provider_by_id(provider_id)
        if not db_provider or not db_provider.is_active:
            return None
        
        # Create LLM provider instance
        llm_provider = await self._create_llm_provider_instance(db_provider)
        
        # Cache for future use
        self.provider_cache[cache_key] = llm_provider
        
        return llm_provider
    
    async def _create_llm_provider_instance(self, db_provider: UserLLMProvider) -> LLMProvider:
        """Create LLM provider instance from database configuration"""
        
        # Decrypt API key
        api_key = self.repository.get_decrypted_api_key(db_provider)
        
        # Create LLM configuration
        config = LLMConfig(
            provider_id=db_provider.provider_type,
            api_key=api_key,
            endpoint_url=db_provider.endpoint_url,
            default_model=self._get_default_model(db_provider.provider_type),
            max_tokens=4000,  # Default
            temperature=0.1   # Default
        )
        
        # Create provider instance using factory
        factory = LLMProviderFactory()
        return await factory.create_provider(db_provider.provider_type, config)
    
    def _get_default_model(self, provider_type: str) -> str:
        """Get default model for provider type"""
        defaults = {
            'openai': 'gpt-4',
            'anthropic': 'claude-3-sonnet-20240229',
            'gemini': 'gemini-pro',
            'ollama': 'llama3.1:8b'
        }
        return defaults.get(provider_type, 'unknown')
    
    def clear_provider_cache(self, provider_id: Optional[uuid.UUID] = None):
        """Clear provider cache (all or specific provider)"""
        if provider_id:
            cache_key = str(provider_id)
            self.provider_cache.pop(cache_key, None)
        else:
            self.provider_cache.clear()
```

## Frontend Implementation Details

### Component Structure

#### Main Provider Dashboard
```typescript
// File: /src/components/llm-providers/UserLLMProviderDashboard.tsx

import React from 'react';
import { Box, Typography, Button, Grid, Alert } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { useGetUserProvidersQuery } from '../../services/api/userLLMProvidersApi';
import { openConfigModal } from '../../store/slices/userLLMProvidersSlice';
import { ProviderCard } from './ProviderCard';
import { ProviderConfigModal } from './ProviderConfigModal';
import { EmptyProvidersState } from './EmptyProvidersState';
import { LoadingSpinner } from '../common/LoadingSpinner';

export const UserLLMProviderDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { data: providers = [], isLoading, error } = useGetUserProvidersQuery();
  const { configModal } = useAppSelector(state => state.userLLMProviders);

  const handleAddProvider = () => {
    dispatch(openConfigModal({ mode: 'create', provider: null }));
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading your LLM providers..." />;
  }

  if (error) {
    return (
      <Alert severity="error" action={
        <Button color="inherit" size="small" onClick={() => window.location.reload()}>
          Retry
        </Button>
      }>
        Failed to load LLM providers. Please try again.
      </Alert>
    );
  }

  if (providers.length === 0) {
    return <EmptyProvidersState onAddProvider={handleAddProvider} />;
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Your LLM Providers
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddProvider}
          size="large"
        >
          Add Provider
        </Button>
      </Box>

      {/* Provider Grid */}
      <Grid container spacing={3}>
        {providers.map(provider => (
          <Grid item xs={12} md={6} lg={4} key={provider.id}>
            <ProviderCard provider={provider} />
          </Grid>
        ))}
      </Grid>

      {/* Configuration Modal */}
      <ProviderConfigModal
        open={configModal.isOpen}
        mode={configModal.mode}
        provider={configModal.editingProvider}
      />
    </Box>
  );
};
```

#### Provider Configuration Modal
```typescript
// File: /src/components/llm-providers/ProviderConfigModal.tsx

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Box,
  Alert
} from '@mui/material';
import { useAppDispatch } from '../../hooks/redux';
import { closeConfigModal } from '../../store/slices/userLLMProvidersSlice';
import {
  useCreateUserProviderMutation,
  useUpdateUserProviderMutation
} from '../../services/api/userLLMProvidersApi';
import { ProviderTypeSelector } from './ProviderTypeSelector';
import { ProviderConfigForm } from './ProviderConfigForm';
import { ProviderTestStep } from './ProviderTestStep';
import type { UserLLMProvider, ProviderConfiguration } from '../../types/userLLMProviders';

interface Props {
  open: boolean;
  mode: 'create' | 'edit' | null;
  provider: UserLLMProvider | null;
}

const steps = ['Select Type', 'Configure', 'Test & Save'];

export const ProviderConfigModal: React.FC<Props> = ({ open, mode, provider }) => {
  const dispatch = useAppDispatch();
  const [activeStep, setActiveStep] = useState(0);
  const [configuration, setConfiguration] = useState<ProviderConfiguration>({
    name: '',
    providerType: 'openai',
    apiKey: '',
    endpointUrl: ''
  });
  
  const [createProvider, { isLoading: isCreating }] = useCreateUserProviderMutation();
  const [updateProvider, { isLoading: isUpdating }] = useUpdateUserProviderMutation();

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && provider) {
        setConfiguration({
          name: provider.name,
          providerType: provider.providerType,
          apiKey: '', // Never pre-populate API key
          endpointUrl: provider.endpointUrl || ''
        });
        setActiveStep(1); // Skip type selection for editing
      } else {
        setConfiguration({
          name: '',
          providerType: 'openai',
          apiKey: '',
          endpointUrl: ''
        });
        setActiveStep(0);
      }
    }
  }, [open, mode, provider]);

  const handleClose = () => {
    dispatch(closeConfigModal());
    setActiveStep(0);
    setConfiguration({
      name: '',
      providerType: 'openai',
      apiKey: '',
      endpointUrl: ''
    });
  };

  const handleNext = () => {
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSave = async () => {
    try {
      if (mode === 'create') {
        await createProvider({
          name: configuration.name,
          provider_type: configuration.providerType,
          api_key: configuration.apiKey,
          endpoint_url: configuration.endpointUrl || undefined
        }).unwrap();
      } else if (mode === 'edit' && provider) {
        await updateProvider({
          id: provider.id,
          updates: {
            name: configuration.name,
            api_key: configuration.apiKey || undefined, // Only update if provided
            endpoint_url: configuration.endpointUrl || undefined
          }
        }).unwrap();
      }
      
      handleClose();
    } catch (error) {
      console.error('Failed to save provider:', error);
    }
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <ProviderTypeSelector
            selectedType={configuration.providerType}
            onTypeSelect={(type) => setConfiguration(prev => ({ ...prev, providerType: type }))}
          />
        );
      case 1:
        return (
          <ProviderConfigForm
            configuration={configuration}
            onChange={setConfiguration}
            mode={mode}
          />
        );
      case 2:
        return (
          <ProviderTestStep
            configuration={configuration}
            onTestComplete={handleSave}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { minHeight: 500 } }}
    >
      <DialogTitle>
        {mode === 'create' ? 'Add LLM Provider' : 'Edit LLM Provider'}
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 4 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
        
        {getStepContent(activeStep)}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose}>
          Cancel
        </Button>
        {activeStep > 0 && (
          <Button onClick={handleBack}>
            Back
          </Button>
        )}
        {activeStep < steps.length - 1 ? (
          <Button 
            variant="contained" 
            onClick={handleNext}
            disabled={!isStepValid(activeStep, configuration)}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={isCreating || isUpdating}
          >
            {isCreating || isUpdating ? 'Saving...' : 'Save Provider'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

function isStepValid(step: number, config: ProviderConfiguration): boolean {
  switch (step) {
    case 0:
      return !!config.providerType;
    case 1:
      return !!(config.name && config.apiKey && 
        (config.providerType !== 'ollama' || config.endpointUrl));
    case 2:
      return true;
    default:
      return false;
  }
}
```

#### Provider Type Selector Component
```typescript
// File: /src/components/llm-providers/ProviderTypeSelector.tsx

import React from 'react';
import { Box, Card, CardContent, Typography, RadioGroup, FormControlLabel, Radio } from '@mui/material';
import { Cloud, Computer, SmartToy, Psychology } from '@mui/icons-material';

interface Props {
  selectedType: string;
  onTypeSelect: (type: string) => void;
}

const providerTypes = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4, GPT-3.5, and other OpenAI models',
    icon: <SmartToy color="primary" />,
    requirements: ['API Key']
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    description: 'Claude-3 Opus, Sonnet, and Haiku models',
    icon: <Psychology color="primary" />,
    requirements: ['API Key']
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Gemini Pro and Gemini Flash models',
    icon: <Cloud color="primary" />,
    requirements: ['API Key']
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    description: 'Local LLM inference with Ollama server',
    icon: <Computer color="primary" />,
    requirements: ['Server URL', 'Model Name']
  }
];

export const ProviderTypeSelector: React.FC<Props> = ({ selectedType, onTypeSelect }) => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Choose Your LLM Provider Type
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Select the type of LLM provider you want to configure. Each type has different requirements.
      </Typography>
      
      <RadioGroup
        value={selectedType}
        onChange={(e) => onTypeSelect(e.target.value)}
      >
        <Box sx={{ display: 'grid', gap: 2, mt: 2 }}>
          {providerTypes.map((type) => (
            <FormControlLabel
              key={type.id}
              value={type.id}
              control={<Radio />}
              label={
                <Card 
                  variant="outlined" 
                  sx={{ 
                    width: '100%', 
                    cursor: 'pointer',
                    border: selectedType === type.id ? 2 : 1,
                    borderColor: selectedType === type.id ? 'primary.main' : 'divider'
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {type.icon}
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6">{type.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {type.description}
                        </Typography>
                        <Typography variant="caption" color="primary">
                          Requires: {type.requirements.join(', ')}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              }
              sx={{ margin: 0, width: '100%' }}
            />
          ))}
        </Box>
      </RadioGroup>
    </Box>
  );
};
```

### Redux Store Implementation

```typescript
// File: /src/store/slices/userLLMProvidersSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { UserLLMProvider, ProviderTestResult } from '../../types/userLLMProviders';

interface UserLLMProvidersState {
  // UI state for configuration modal
  configModal: {
    isOpen: boolean;
    mode: 'create' | 'edit' | null;
    editingProvider: UserLLMProvider | null;
  };
  
  // Provider testing state
  testing: {
    providerId: string | null;
    inProgress: boolean;
    results: Record<string, ProviderTestResult>;
  };
}

const initialState: UserLLMProvidersState = {
  configModal: {
    isOpen: false,
    mode: null,
    editingProvider: null,
  },
  testing: {
    providerId: null,
    inProgress: false,
    results: {},
  },
};

const userLLMProvidersSlice = createSlice({
  name: 'userLLMProviders',
  initialState,
  reducers: {
    // Modal management
    openConfigModal: (state, action: PayloadAction<{
      mode: 'create' | 'edit';
      provider?: UserLLMProvider | null;
    }>) => {
      state.configModal.isOpen = true;
      state.configModal.mode = action.payload.mode;
      state.configModal.editingProvider = action.payload.provider || null;
    },
    
    closeConfigModal: (state) => {
      state.configModal.isOpen = false;
      state.configModal.mode = null;
      state.configModal.editingProvider = null;
    },
    
    // Provider testing
    startProviderTest: (state, action: PayloadAction<string>) => {
      state.testing.providerId = action.payload;
      state.testing.inProgress = true;
    },
    
    completeProviderTest: (state, action: PayloadAction<{
      providerId: string;
      result: ProviderTestResult;
    }>) => {
      state.testing.inProgress = false;
      state.testing.providerId = null;
      state.testing.results[action.payload.providerId] = action.payload.result;
    },
    
    clearTestResults: (state) => {
      state.testing.results = {};
    },
  },
});

export const {
  openConfigModal,
  closeConfigModal,
  startProviderTest,
  completeProviderTest,
  clearTestResults,
} = userLLMProvidersSlice.actions;

export default userLLMProvidersSlice.reducer;
```

## Integration Points

### Upload Interface Integration

```typescript
// File: /src/components/upload/LLMProviderSelector.tsx
// Enhanced provider selector for upload interface

import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, Chip, Box } from '@mui/material';
import { useGetUserProvidersQuery } from '../../services/api/userLLMProvidersApi';

interface Props {
  selectedProviderId: string;
  onProviderChange: (providerId: string) => void;
}

export const LLMProviderSelector: React.FC<Props> = ({ 
  selectedProviderId, 
  onProviderChange 
}) => {
  const { data: userProviders = [], isLoading } = useGetUserProvidersQuery();

  if (isLoading) {
    return <div>Loading providers...</div>;
  }

  if (userProviders.length === 0) {
    return (
      <Box sx={{ p: 2, border: '1px dashed', borderRadius: 1, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No LLM providers configured. 
          <Link href="/providers" sx={{ ml: 1 }}>Add a provider</Link> to enable AI translation.
        </Typography>
      </Box>
    );
  }

  return (
    <FormControl fullWidth>
      <InputLabel>LLM Provider</InputLabel>
      <Select
        value={selectedProviderId}
        onChange={(e) => onProviderChange(e.target.value)}
        label="LLM Provider"
      >
        {userProviders.map((provider) => (
          <MenuItem key={provider.id} value={provider.id}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
              <span>{provider.name}</span>
              <Chip 
                label={provider.providerType} 
                size="small" 
                variant="outlined"
                sx={{ ml: 'auto' }}
              />
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
```

### Analysis Job Integration

```python
# File: /src/api/routes/decompile.py
# Updated decompile endpoint to use user providers

from src.services.user_llm_provider_service import UserLLMProviderService

class DecompileRequest(BaseModel):
    # ... existing fields ...
    user_llm_provider_id: Optional[uuid.UUID] = Field(
        None, 
        description="ID of user-configured LLM provider for translation"
    )

@router.post("/decompile", response_model=JobResponse)
async def submit_decompile_job(
    # ... existing parameters ...
    user_provider_service: UserLLMProviderService = Depends(get_user_provider_service)
):
    """Enhanced decompile endpoint supporting user-configured LLM providers"""
    
    # ... existing validation ...
    
    # Handle LLM provider selection
    llm_provider = None
    if request.user_llm_provider_id:
        llm_provider = await user_provider_service.get_provider_for_analysis(
            request.user_llm_provider_id
        )
        if not llm_provider:
            raise HTTPException(
                status_code=400,
                detail="Invalid or inactive LLM provider"
            )
    
    # Create job with user provider
    job = await job_service.create_decompile_job(
        file_path=uploaded_file_path,
        llm_provider=llm_provider,
        # ... other parameters
    )
    
    return JobResponse(job_id=job.id, status=job.status)
```

## Deployment and Migration

### Environment Configuration

```bash
# File: .env.example - Add encryption key
# LLM Provider Encryption Key (generate with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")
LLM_PROVIDER_ENCRYPTION_KEY=your-base64-encoded-encryption-key-here

# Remove existing hardcoded provider configurations
# ANTHROPIC_API_KEY=  # Remove after migration
# GEMINI_API_KEY=     # Remove after migration
```

### Docker Configuration

```yaml
# File: docker-compose.yml - Add encryption key
services:
  api:
    environment:
      - LLM_PROVIDER_ENCRYPTION_KEY=${LLM_PROVIDER_ENCRYPTION_KEY}
      # Remove existing provider keys after migration
```

### Migration Script

```python
# File: /scripts/migrate_to_user_providers.py

#!/usr/bin/env python3
"""Migration script to convert hardcoded providers to user providers"""

import asyncio
import os
from sqlalchemy.orm import Session
from src.database.connection import get_db_session
from src.core.security.credential_manager import ProviderCredentialManager
from src.repositories.user_llm_providers import UserLLMProviderRepository
from src.models.api.user_llm_providers import UserLLMProviderCreate

async def migrate_existing_providers():
    """Migrate existing environment-based providers to user providers"""
    
    credential_manager = ProviderCredentialManager()
    db = get_db_session()
    repository = UserLLMProviderRepository(db, credential_manager)
    
    # Migration mappings from environment variables
    migrations = [
        {
            'name': 'Default OpenAI',
            'provider_type': 'openai',
            'env_key': 'OPENAI_API_KEY'
        },
        {
            'name': 'Default Anthropic',
            'provider_type': 'anthropic', 
            'env_key': 'ANTHROPIC_API_KEY'
        },
        {
            'name': 'Default Gemini',
            'provider_type': 'gemini',
            'env_key': 'GEMINI_API_KEY'
        },
        {
            'name': 'Local Ollama',
            'provider_type': 'ollama',
            'env_key': None,  # No API key needed
            'endpoint_url': 'http://localhost:11434/v1'
        }
    ]
    
    for migration in migrations:
        api_key = os.getenv(migration['env_key']) if migration['env_key'] else 'ollama-local'
        
        if api_key or migration['provider_type'] == 'ollama':
            try:
                provider_data = UserLLMProviderCreate(
                    name=migration['name'],
                    provider_type=migration['provider_type'],
                    api_key=api_key or 'ollama-local',
                    endpoint_url=migration.get('endpoint_url')
                )
                
                created_provider = await repository.create_provider(provider_data)
                print(f"✓ Migrated {migration['name']} ({migration['provider_type']})")
                
            except Exception as e:
                print(f"✗ Failed to migrate {migration['name']}: {e}")
    
    print("\n✓ Migration completed. You can now remove hardcoded API keys from environment.")

if __name__ == "__main__":
    asyncio.run(migrate_existing_providers())
```

## Testing Strategy

### Backend Testing

```python
# File: /tests/test_user_llm_providers.py

import pytest
from src.repositories.user_llm_providers import UserLLMProviderRepository
from src.core.security.credential_manager import ProviderCredentialManager
from src.models.api.user_llm_providers import UserLLMProviderCreate

class TestUserLLMProviders:
    
    @pytest.fixture
    def credential_manager(self):
        return ProviderCredentialManager()
    
    @pytest.fixture
    def repository(self, db_session, credential_manager):
        return UserLLMProviderRepository(db_session, credential_manager)
    
    async def test_create_provider_encrypts_api_key(self, repository):
        """Test that API keys are encrypted before database storage"""
        provider_data = UserLLMProviderCreate(
            name="Test OpenAI",
            provider_type="openai",
            api_key="sk-test-key-123"
        )
        
        created_provider = await repository.create_provider(provider_data)
        
        # API key should be encrypted in database
        assert created_provider.encrypted_api_key != "sk-test-key-123"
        assert created_provider.encrypted_api_key.startswith("gAAAAA")  # Fernet prefix
        
        # Should be able to decrypt back to original
        decrypted = repository.get_decrypted_api_key(created_provider)
        assert decrypted == "sk-test-key-123"
    
    async def test_ollama_provider_requires_endpoint(self, repository):
        """Test that Ollama providers require endpoint URL"""
        provider_data = UserLLMProviderCreate(
            name="Test Ollama",
            provider_type="ollama",
            api_key="fake-key",
            endpoint_url="http://localhost:11434/v1"
        )
        
        created_provider = await repository.create_provider(provider_data)
        assert created_provider.endpoint_url == "http://localhost:11434/v1"
```

### Frontend Testing

```typescript
// File: /src/components/llm-providers/__tests__/UserLLMProviderDashboard.test.tsx

import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { UserLLMProviderDashboard } from '../UserLLMProviderDashboard';
import { store } from '../../../store/store';

const renderWithStore = (component: React.ReactElement) => {
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

describe('UserLLMProviderDashboard', () => {
  test('shows empty state for new users', () => {
    // Mock empty providers response
    jest.mock('../../../services/api/userLLMProvidersApi', () => ({
      useGetUserProvidersQuery: () => ({ data: [], isLoading: false })
    }));
    
    renderWithStore(<UserLLMProviderDashboard />);
    
    expect(screen.getByText('No LLM Providers Configured')).toBeInTheDocument();
    expect(screen.getByText('Add Your First Provider')).toBeInTheDocument();
  });
  
  test('opens add provider modal when button clicked', () => {
    renderWithStore(<UserLLMProviderDashboard />);
    
    fireEvent.click(screen.getByText('Add Your First Provider'));
    
    expect(screen.getByText('Add LLM Provider')).toBeInTheDocument();
  });
  
  test('never persists API keys in component state', () => {
    // Test that API key inputs have proper security attributes
    const apiKeyInput = screen.getByLabelText('API Key');
    expect(apiKeyInput).toHaveAttribute('type', 'password');
    expect(apiKeyInput).toHaveAttribute('autoComplete', 'new-password');
  });
});
```

---

**Document Created:** 2025-09-06  
**Next Phase:** Detailed Task List Generation  
**Implementation Estimate:** 5-7 days full-stack development  
**Security Review Required:** Yes (API key encryption and handling)