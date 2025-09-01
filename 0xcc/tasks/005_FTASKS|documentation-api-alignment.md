# Task List: Documentation API Alignment

**Date:** 2025-08-31  
**Project:** bin2nlp-frontend  
**Task Category:** Documentation Updates  
**Document ID:** 005_FTASKS|documentation-api-alignment  
**Priority:** CRITICAL  
**Estimated Total Time:** 30-40 hours  

## Overview

This task list addresses the complete realignment of our frontend documentation with the actual bin2nlp API endpoints discovered through OpenAPI specification analysis. The corrections transform our assumed architecture (separate file/pipeline/results APIs) to the actual job-based architecture with unified `/api/v1/decompile` workflow.

**Key Corrections Required:**
- ❌ Remove assumed endpoints (file upload, pipeline control, separate results)
- ✅ Implement job-based architecture with single submission endpoint
- ✅ Update to REST polling (1-2 second intervals) instead of WebSocket
- ✅ Align with user-managed LLM credentials (session-based)
- ✅ Correct all API endpoint references to match OpenAPI specification

## Relevant Files

- `0xcc/adrs/000_PADR|bin2nlp-frontend.md` - Architecture decisions requiring WebSocket to REST polling updates
- `0xcc/prds/000_PPRD|bin2nlp-frontend.md` - Project overview requiring job-based architecture alignment
- `0xcc/prds/001_FPRD|file-management-system.md` - Complete rewrite to Analysis Job Management System
- `0xcc/prds/002_FPRD|two-phase-pipeline-interface.md` - Major simplification to Analysis Configuration Interface
- `0xcc/prds/003_FPRD|results-exploration-platform.md` - Update to job-based results integration
- `0xcc/prds/004_FPRD|multi-provider-llm-integration.md` - Update to user-managed credential focus
- `0xcc/tdds/001_FTDD|file-management-system.md` - Complete rewrite to job management architecture
- `0xcc/tdds/002_FTDD|two-phase-pipeline-interface.md` - Major simplification to config interface
- `0xcc/tdds/003_FTDD|results-exploration-platform.md` - Update to job status response parsing
- `0xcc/tdds/004_FTDD|multi-provider-llm-integration.md` - Update to provider discovery with health checks

### Notes

- Component validation relies on TypeScript strict mode for compile-time checking.
- Use `npm run type-check` to validate all TypeScript files for compilation errors.

## Tasks

- [x] 1.0 Architecture Decision Record (ADR) Corrections
  - [x] 1.1 Update ADR Backend Integration Section - Update `/0xcc/adrs/000_PADR|bin2nlp-frontend.md` Backend Integration section (lines 55-67): Keep "Pure REST with Polling" approach, remove WebSocket references, update to job-based architecture with single `/api/v1/decompile` endpoint, add REST polling note at 1-2 second intervals, update API specification reference to `/openapi.json` endpoint
  - [x] 1.2 Update ADR State Management Patterns - Update `/0xcc/adrs/000_PADR|bin2nlp-frontend.md` State Management Approach section (lines 122-127): Update Redux Toolkit slice names to `analysisSlice` instead of separate slices, add RTK Query API structure with single `analysisApi`, update polling strategy for job status with smart pause/resume
  - [x] 1.3 Update ADR API Design Conventions - Update `/0xcc/adrs/000_PADR|bin2nlp-frontend.md` API Design Conventions section (lines 134-138): Update base URL pattern to use `/api/v1/` prefix, update to job-based approach with FormData submission and JSON responses, update credential management to user-provided LLM API keys with session-only storage

- [x] 2.0 Project PRD Global Updates  
  - [x] 2.1 Update Project PRD Core Features - Update `/0xcc/prds/000_PPRD|bin2nlp-frontend.md` Core Features section (lines 137-141): Update feature description to "Analysis Job Management: Single-endpoint job submission with file upload, decompilation configuration, and LLM provider selection", remove separate file management references, update LLM integration to user-provided API keys with session-based credential management
  - [x] 2.2 Update Project PRD User Journeys - Update `/0xcc/prds/000_PPRD|bin2nlp-frontend.md` User Journey Overview section (lines 57-63): Update step 1 to "Submit analysis job via single endpoint (file + configuration)", step 2 to "Configure analysis depth and optionally select LLM provider with user API key", step 3 to "Monitor job progress through polling (1-2 second intervals)", step 4 to "Explore results when job completes"
  - [x] 2.3 Update Project PRD Technical Considerations - Update `/0xcc/prds/000_PPRD|bin2nlp-frontend.md` Integration and API Requirements section (lines 228-231): Update API coverage to job-based integration with `/api/v1/decompile` primary endpoint, update specification consumption for job status and LLM provider types, add core endpoint list for decompile job management, LLM provider discovery, and system health

- [x] 3.0 Feature PRD Major Revisions
  - [x] 3.1 Completely Rewrite File Management System PRD - Complete rewrite of `/0xcc/prds/001_FPRD|file-management-system.md` to "Analysis Job Management System": Change title and description to job submission/tracking/history interface, update user stories to focus on job submission (US-001: Submit analysis job with file + configuration, US-002: Track job progress and status, US-003: Manage job history and results access, US-004: Cancel running jobs), update API integration section with correct endpoints (submitAnalysisJob POST /api/v1/decompile, getJobStatus GET /api/v1/decompile/{job_id}, cancelJob DELETE /api/v1/decompile/{job_id}), remove all references to separate file upload/validation/status endpoints, update data models from file-based to job-based
  - [x] 3.2 Rewrite Two-Phase Pipeline Interface PRD - Major simplification of `/0xcc/prds/002_FPRD|two-phase-pipeline-interface.md` to "Analysis Configuration Interface": Change title and description to configuration panel for decompilation settings and LLM provider selection, update user stories to configuration focus (US-001: Configure analysis parameters, US-002: Input LLM API credentials securely, US-003: Preview estimated costs and processing time, US-004: Submit configured analysis job), remove all pipeline start/pause/cancel endpoints (only cancel remains), update API integration to show FormData submission with all configuration included, update progress tracking to job status polling instead of separate pipeline endpoints
  - [x] 3.3 Update Results Exploration Platform PRD - Moderate update of `/0xcc/prds/003_FPRD|results-exploration-platform.md` to align with job-based results: Update data source to results from GET /api/v1/decompile/{job_id} when completed, update API integration to show results as part of job status response (JobStatusResponse interface with results field containing function_count, import_count, string_count, and optional llm_translations), remove references to separate analysis results endpoints, update user stories to focus on exploring completed job results
  - [x] 3.4 Rewrite Multi-Provider LLM Integration PRD - Moderate update of `/0xcc/prds/004_FPRD|multi-provider-llm-integration.md` with user credential management focus: Update core concept to provider discovery + user credential management, update API integration with correct endpoints (listProviders GET /api/v1/llm-providers, getProviderDetails GET /api/v1/llm-providers/{providerId}, checkProviderHealth POST /api/v1/llm-providers/{providerId}/health-check), update user stories to provider management focus (US-001: Discover available LLM providers and capabilities, US-002: Input and validate personal API keys, US-003: Select optimal provider based on cost and performance, US-004: Test provider connectivity before job submission), update security model to session-based credential storage with user-managed API keys

- [ ] 4.0 Technical Design Document (TDD) Major Revisions
  - [x] 4.1 Rewrite File Management System TDD - Complete rewrite of `/0xcc/tdds/001_FTDD|file-management-system.md` to job management architecture: Change title to "Analysis Job Management System", update system architecture to single job submission flow, update component design to AnalysisJobManager with JobSubmissionPanel (FileUploadZone, AnalysisConfigForm, LLMProviderSelector), JobTrackingPanel (ActiveJobsList, ProgressIndicators, CancelJobButtons), and JobHistoryPanel (CompletedJobsList, ResultsAccessLinks, JobRetryOptions), update Redux integration to single analysisSlice with activeJobs, jobHistory, and userCredentials state, update API service design to RTK Query with polling for active jobs
  - [x] 4.2 Rewrite Two-Phase Pipeline Interface TDD - Major simplification of `/0xcc/tdds/002_FTDD|two-phase-pipeline-interface.md`: Change title to "Analysis Configuration Interface", update architecture to configuration form + job submission, update component design to single configuration panel instead of complex pipeline orchestration, update state management to form state + job submission state only, remove all pipeline control and pause/resume functionality, update integration to direct job submission to `/api/v1/decompile`
  - [x] 4.3 Update Results Exploration Platform TDD - Moderate update of `/0xcc/tdds/003_FTDD|results-exploration-platform.md`: Update data source integration to job status response parsing, update component architecture to handle combined decompilation + LLM translation data, update state management so results are derived from job status not separate API calls, update performance considerations to include virtual scrolling for job results data
  - [x] 4.4 Update Multi-Provider LLM Integration TDD - Moderate update of `/0xcc/tdds/004_FTDD|multi-provider-llm-integration.md`: Update provider discovery architecture to use `/api/v1/llm-providers` endpoints, update credential management to session-based storage with encryption, update provider health monitoring with health check integration, update cost estimation based on provider details API response

- [ ] 5.0 Component Architecture Updates
  - [x] 5.1 Update Component Hierarchy Documentation - Update component sections in all TDD files with new unified architecture: App with AnalysisManager (JobSubmission containing FileUploadZone/AnalysisConfigPanel/LLMProviderSelector, JobTracking containing ActiveJobsList/JobProgressDisplay/JobControlButtons, JobHistory containing CompletedJobsList/JobResultsLinks, ResultsViewer containing DecompilationResults/LLMTranslationResults/ExportOptions), ProviderManagement (ProviderDiscovery/CredentialInput/HealthMonitoring), and SystemStatus (HealthIndicator/SystemInfo)
  - [x] 5.2 Update State Management Architecture - Update Redux sections in all TDD files with consolidated store structure: RootState interface containing analysis slice (activeJobs as Record<string, JobStatus>, jobHistory as JobStatus array, selectedJob as string or null), providers slice (available as LLMProviderInfo array, selected as string or null, userCredentials as Record<string, string>), and ui slice (currentView as submission/tracking/results, selectedJobId as string or null)

- [ ] 6.0 API Integration Documentation
  - [x] 6.1 Create Master API Integration Guide - Create new file `/0xcc/docs/api-integration-guide.md` with complete endpoint reference (Core Analysis: POST /api/v1/decompile submit job, GET /api/v1/decompile/{job_id} get status/results, DELETE /api/v1/decompile/{job_id} cancel job; LLM Provider Management: GET /api/v1/llm-providers list providers, GET /api/v1/llm-providers/{provider_id} provider details, POST /api/v1/llm-providers/{provider_id}/health-check test provider; System Information: GET /api/v1/health system health, GET /api/v1/system/info capabilities), RTK Query integration examples, error handling patterns, polling configuration, and TypeScript type definitions
  - [x] 6.2 Update All PRD API Sections - Update API sections in all Feature PRD files: Standardize API integration sections with correct endpoint references, update request/response examples with actual OpenAPI schema, remove invalid endpoints (file upload, pipeline control, etc.), add error handling for each endpoint
  - [x] 6.3 Update All TDD API Integration Sections - Update API integration sections in all TDD files: Update service layer architecture with correct endpoints, update middleware integration for RTK Query polling, update type definitions based on OpenAPI specification, add integration testing patterns

- [x] 7.0 Testing Strategy Updates
  - [x] 7.1 Update Testing Requirements in All PRDs - Update Testing Requirements sections in all Feature PRD files: Update integration tests to focus on job submission, status polling, and cancellation flows; update API mocking to mock correct endpoints with realistic job status responses; update end-to-end tests for complete job submission → tracking → results viewing flows; add provider testing for LLM provider discovery and health check testing
  - [x] 7.2 Update TDD Testing Sections - Update testing sections in all TDD files: Update unit testing for job management utilities and provider selection logic; update component testing for job submission forms, status displays, and results viewers; update integration testing for RTK Query API integration and polling mechanisms; update performance testing for job status polling efficiency and large result handling

- [x] 8.0 Implementation Timeline Adjustments
  - [x] 8.1 Update Project PRD Timeline - Update `/0xcc/prds/000_PPRD|bin2nlp-frontend.md` Timeline and Milestone Expectations section (lines 35-39): Phase 1 (2-3 weeks) Analysis job management system (replaces separate file management), Phase 2 (3-4 weeks) LLM provider integration and results viewing, Phase 3 (2-3 weeks) Advanced features and export capabilities, Phase 4 (2-3 weeks) Performance optimization and monitoring integration
  - [x] 8.2 Update All Feature PRDs Implementation Approaches - Update Recommended Implementation Approach sections in all Feature PRD files: Simplify timelines based on unified job-based architecture, update complexity assessments (generally lower complexity due to simpler API), update risk factors (remove WebSocket/pipeline complexity risks)

- [x] 9.0 Quality Assurance and Review
  - [x] 9.1 Cross-Reference Validation - Validate all updated documents for consistency: Endpoint consistency (all API references use correct `/api/v1/` endpoints), architecture consistency (all documents reference job-based architecture), state management consistency (Redux structure matches across all TDDs), no invalid references (remove all file upload, pipeline pause, separate results endpoints)
  - [x] 9.2 OpenAPI Specification Alignment - Compare all API references against actual OpenAPI specification: Endpoint URLs match OpenAPI paths exactly, request/response schemas use actual OpenAPI schema definitions, parameter names match OpenAPI parameter specifications, HTTP methods use correct HTTP verbs for each endpoint
  - [x] 9.3 Internal Consistency Review - Review full document cross-references: PRD → TDD alignment (technical designs implement PRD requirements), TDD → implementation alignment (technical designs are implementable), component architecture consistency (same component names and structures across all documents), state management consistency (Redux slices and structure match across documents)

## Final Validation Checklist

### Before Completion - Verify All Documents

**Architecture Compliance:**
- [x] All API calls use `/api/v1/` prefix
- [x] Job-based architecture throughout (no separate file/pipeline/results APIs)
- [x] REST polling at 1-2 second intervals (no WebSocket references)
- [x] User-managed LLM credentials (session-based storage)

**Technical Accuracy:**
- [x] All endpoint URLs match OpenAPI specification exactly
- [x] All request/response schemas align with OpenAPI definitions  
- [x] All component architectures are implementable
- [x] All Redux state structures are consistent

**Business Requirements:**
- [x] Zero backend modifications required (confirmed)
- [x] All user stories are achievable with actual API
- [x] Performance targets are realistic with polling architecture
- [x] Security requirements met with session-based credential management

**Documentation Quality:**
- [x] All inter-document references are valid
- [x] All user stories have corresponding technical implementation
- [x] All technical designs have clear component specifications
- [x] All testing requirements are comprehensive and achievable

---

**Document Version:** 1.0  
**Last Updated:** 2025-08-31  
**Next Review:** After task completion  
**Related Documents:** All project PRDs, ADRs, and TDDs

## Notes

This comprehensive task list systematically corrects every architectural misalignment discovered between our documentation assumptions and the actual bin2nlp API. The changes represent a simplification of our frontend architecture while ensuring full compliance with the "zero backend modifications required" constraint.

**Key Architectural Changes:**
- **Unified Job API** replaces separate file/pipeline/results endpoints
- **Session-based credentials** replace assumed server-side LLM configuration
- **REST polling** replaces WebSocket assumptions
- **Simplified state management** with job-centric Redux architecture

**Quality Assurance:**
Every task includes verification steps to ensure consistency across all documents and alignment with the actual OpenAPI specification. The final validation checklist ensures no incorrect assumptions remain in the documentation.