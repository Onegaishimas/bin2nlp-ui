# Navigation Map: bin2nlp UI Site Map and Capabilities

**Document Type**: Navigation Map (NMAP)  
**Document ID**: 005_NMAP|NavigationMap  
**Date Created**: 2025-09-04  
**Status**: Complete  
**Source**: Live site exploration via browser automation  

## Site Architecture
**Frontend**: React 18 + TypeScript + Vite with Material-UI components  
**State Management**: Redux Toolkit with RTK Query  
**API Integration**: Single `/api/v1/decompile` endpoint with REST polling  
**Version**: v1.0.0 (production environment)

## Navigation Structure

### 1. Dashboard (Home)
- **Purpose**: Landing page with system overview
- **Features**:
  - Welcome message and platform introduction
  - System status indicator (Connected to bin2nlp API v1.0.0)
  - Getting started guide with workflow overview
  - Quick navigation hints

### 2. Upload & Analyze
- **Purpose**: Primary job submission interface
- **File Upload Capabilities**:
  - Drag-and-drop interface
  - Supported formats: PE, ELF, Mach-O, JAR
  - Maximum file size: 100MB
  - File format validation

- **Analysis Configuration**:
  - **Analysis Depth**: Configurable (Standard = comprehensive analysis, 3-5 minutes)
  - **AI Translation Toggle**: Optional LLM-powered natural language translation
  - **Translation Detail Level**: Standard (detailed explanations with context)
  - **LLM Provider Selection**: Dynamic dropdown (populated from API)
  - **API Key Management**: Session-only storage, not persisted
  - **Advanced Options**: Custom endpoint URL configuration

- **Job Submission**: Start Analysis button (disabled until file selected)

### 3. Job Status Dashboard
- **Purpose**: Real-time job monitoring
- **Features**:
  - Auto-refresh every 2 seconds for active jobs
  - Currently shows "No active jobs" message when empty
  - Designed for progress tracking of decompilation and translation phases

### 4. Results
- **Purpose**: Analysis results viewing
- **Current State**: Requires completed job selection from Job Status dashboard
- **Expected Features**: Interactive results exploration (based on project documentation)

### 5. LLM Providers Management
- **Purpose**: Multi-provider LLM integration and monitoring
- **Provider Statistics**:
  - Total Providers: 3 (OpenAI, Anthropic, Google Gemini)
  - Health Status: All currently UNHEALTHY (no API keys configured)
  - Recommended Provider: None currently

- **Provider Details**:
  - **OpenAI GPT**:
    - Models: gpt-4, gpt-4-turbo-preview, gpt-3.5-turbo
    - Pricing: $0.0300 per 1K tokens
    - Health Score: 100% (when healthy)
  
  - **Anthropic Claude**:
    - Models: claude-3-opus-20240229, claude-3-sonnet-20240229, claude-3-haiku-20240307
    - Pricing: $0.0150 per 1K tokens
  
  - **Google Gemini**:
    - Models: gemini-pro, gemini-pro-vision, gemini-flash
    - Pricing: $0.0005 per 1K tokens

- **Capabilities** (All Providers):
  - Function translation
  - Import explanation
  - String interpretation
  - Overall summary

### 6. System Health Monitor
- **Purpose**: Real-time system monitoring
- **System Status**: Healthy
- **Auto-refresh**: Every 30 seconds

- **Service Health**:
  - **Database**: PostgreSQL (HEALTHY, 1ms response time)
  - **Storage**: File System (HEALTHY, 1ms response time) 
  - **LLM Providers**: HEALTHY (on-demand creation)

- **System Information**:
  - Version: 1.0.0
  - Environment: production
  - Operation Mode: on-demand provider creation

## Core Capabilities

### Analysis Workflow
1. **Binary File Processing**: PE, ELF, Mach-O, JAR formats up to 100MB
2. **Two-Phase Pipeline**: Decompilation → Optional LLM Translation
3. **Job-Based Architecture**: Single endpoint manages entire workflow
4. **Real-Time Monitoring**: 2-second polling intervals for job status

### LLM Integration
- **Multi-Provider Support**: OpenAI, Anthropic, Google Gemini
- **Dynamic Provider Selection**: Runtime provider choice
- **Session-Based Security**: API keys stored only during session
- **Cost Management**: Price comparison across providers
- **On-Demand Architecture**: Providers created per request

### Technical Features
- **Progressive Web App**: Modern React 18 with concurrent features
- **Type Safety**: Full TypeScript implementation
- **State Management**: Redux Toolkit with RTK Query for API caching
- **Real-Time Updates**: Automatic polling and refresh mechanisms
- **Error Handling**: Graceful degradation and user-friendly messages

### System Monitoring
- **Health Checks**: Database, storage, and LLM provider monitoring
- **Performance Metrics**: Response time tracking
- **Status Indicators**: Real-time system health visualization
- **Auto-Refresh**: Configurable update intervals

## Current Issues Observed
- **Console Errors**: "Maximum update depth exceeded" errors in React components
- **LLM Provider Status**: All providers showing UNHEALTHY (likely due to missing API keys)
- **GridLegacy Warning**: MUI component deprecation warning

## API Integration Points
- **Primary Endpoint**: `/api/v1/decompile` for job-based operations
- **Health Check**: `/health` endpoint (successful 200 responses observed)
- **LLM Providers**: `/api/v1/llm-providers` for provider discovery
- **Polling Strategy**: REST-based with configurable intervals

## User Experience Flow
1. **Entry Point**: Dashboard with system overview
2. **File Upload**: Upload & Analyze section with configuration
3. **Job Monitoring**: Job Status dashboard with real-time updates
4. **Results Review**: Results section for completed analyses
5. **Provider Management**: LLM Providers for service configuration
6. **System Monitoring**: System Health for operational oversight

## Implementation Status
- **Frontend Architecture**: Fully implemented with React 18 + Material-UI
- **API Integration**: Complete job-based workflow integration
- **Multi-Provider LLM**: Comprehensive provider support with dynamic selection
- **Real-Time Features**: Polling and auto-refresh mechanisms operational
- **System Health**: Complete monitoring dashboard with service status

---

**Document Source**: Live browser exploration of http://localhost:9000  
**Exploration Method**: Systematic navigation through all sections  
**Browser**: Chrome via Playwright automation  
**Last Updated**: 2025-09-04 02:46:58 AM  
**Framework**: bin2nlp-ui XCC Documentation System