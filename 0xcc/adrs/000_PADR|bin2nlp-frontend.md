# Architecture Decision Record: bin2nlp-frontend

**Date:** 2025-08-31  
**Project:** bin2nlp Web Frontend  
**Status:** Active  
**Decision Makers:** Development Team  

## Decision Summary

This ADR establishes the foundational technology choices, development principles, and architectural standards for the bin2nlp-frontend project. Key decisions prioritize enterprise-grade reliability, developer experience, and performance optimization for a React-based frontend that integrates with multiple LLM providers through a complex state management system.

**Key Architectural Decisions Overview:**
- React 18 + TypeScript + Vite for modern frontend development
- Redux Toolkit with RTK Query for complex multi-provider LLM state management
- Material-UI (MUI) for enterprise-ready component library
- Multi-container Docker architecture with separate nginx reverse proxy
- Comprehensive testing strategy with Jest, RTL, and Playwright

**Decision-Making Criteria and Priorities:**
1. **Enterprise Reliability:** Robust error handling, comprehensive testing, production-ready deployment
2. **Developer Experience:** Modern tooling, excellent TypeScript support, clear patterns
3. **Performance:** Sub-3-second load times, efficient bundle splitting, real-time updates
4. **Scalability:** Support for 1000+ concurrent users, efficient state management
5. **Maintainability:** Clear architecture, comprehensive documentation, consistent patterns

## Technology Stack Decisions

### Frontend Stack

**Primary Framework: React 18 + TypeScript + Vite**
- **Rationale:** React 18 provides excellent concurrent features for real-time updates, TypeScript ensures type safety across complex LLM integrations, Vite offers superior development experience with fast HMR
- **Benefits:** Large ecosystem, excellent TypeScript support, modern concurrent features, fast builds
- **Trade-offs:** Steeper learning curve than simpler alternatives, but necessary for project complexity

**UI Component Library: Material-UI (MUI) v5**
- **Rationale:** Enterprise-ready components, excellent TypeScript support, comprehensive theming system suitable for professional developer tools
- **Benefits:** Consistent design system, accessibility built-in, extensive component library
- **Trade-offs:** Larger bundle size than minimal libraries, but provides complete solution

**State Management: Redux Toolkit with RTK Query**
- **Rationale:** Complex multi-provider LLM integration requires centralized state management with sophisticated async handling, caching, and request coordination
- **Benefits:** 
  - Centralized state for multiple LLM providers coordination
  - Built-in data fetching and caching reduces API costs
  - Excellent TypeScript support and DevTools integration
  - Request deduplication and background refetching
  - Proven pattern for complex applications
- **Trade-offs:** More boilerplate than simpler solutions, but essential for project complexity

**Build Tools: Vite + TypeScript**
- **Rationale:** Fast development builds, modern ESM support, excellent TypeScript integration, optimized production bundles
- **Benefits:** Superior development experience, fast HMR, efficient bundling
- **Trade-offs:** Newer ecosystem than Webpack, but stability proven

### Backend Integration

**API Integration: Pure REST with Polling**
- **Rationale:** Existing bin2nlp API uses job-based architecture with single `/api/v1/decompile` endpoint, no backend changes required for frontend development
- **Architecture:** Single `/api/v1/decompile` endpoint for file submission, status tracking, and results retrieval
- **Real-time Updates:** REST polling via `GET /api/v1/decompile/{job_id}` at 1-2 second intervals for progress tracking
- **Standards:** OpenAPI specification available at `/openapi.json` endpoint for type generation, RTK Query for API state management
- **Error Handling:** Exponential backoff, graceful degradation, comprehensive error boundaries

**Progress Tracking: Job Status Polling Strategy**
- **Rationale:** No backend modifications allowed, job-based polling provides adequate user experience for decompilation workflows
- **Implementation:** RTK Query polling with 1-2 second intervals for active jobs, optimized with smart polling (pause when inactive)
- **Performance:** Efficient job status polling with automatic pause/resume, request deduplication, and intelligent retry logic

### Infrastructure & Deployment

**Deployment Platform: Multi-Container Docker Architecture**
- **UI Container:** React application served via lightweight HTTP server (serve/http-server)
- **Nginx Container:** Separate reverse proxy container for production routing, SSL termination, and static asset optimization
- **Rationale:** Separation of concerns, scalable architecture, nginx expertise for production optimizations
- **Configuration:** Multi-stage builds for optimization, docker-compose and Kubernetes ready
- **Monitoring:** Health check endpoints in both containers, container orchestration ready

**Environment Management: Environment Variables + Build-time Configuration**
- **Development:** Local development with hot reloading
- **Staging:** Mirror production configuration with test data
- **Production:** Optimized builds, CDN integration, monitoring

## Development Standards

### Code Organization

**Directory Structure:**
```
src/
├── components/           # Reusable UI components
│   ├── common/          # Generic components
│   ├── analysis/        # Analysis-specific components
│   └── visualization/   # Chart and graph components
├── pages/               # Route components
├── services/            # API services and business logic
│   ├── api/            # RTK Query API definitions
│   ├── polling/        # REST polling management
│   └── llm/            # LLM provider abstractions
├── store/               # Redux store configuration
│   ├── slices/         # Redux Toolkit slices
│   └── middleware/     # Custom middleware
├── hooks/               # Custom React hooks
├── utils/               # Utility functions
├── types/               # TypeScript type definitions
└── constants/           # Application constants
```

**File Naming Conventions:**
- Components: PascalCase (e.g., `FileUploadPanel.tsx`)
- Services/Utils: camelCase (e.g., `apiClient.ts`)
- Constants: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS.ts`)
- Types: PascalCase with `.types.ts` suffix (e.g., `Analysis.types.ts`)

**Import Organization:**
1. React and external libraries
2. Internal services and utilities
3. Component imports
4. Type imports (with `type` keyword)
5. Relative imports

### Coding Patterns

**State Management Approach:**
- Single `analysisSlice` instead of separate `fileManagementSlice`, `pipelineSlice`, `resultsSlice` for job-based architecture
- Single `analysisApi` with job submission, status tracking, and cancellation endpoints via RTK Query
- RTK Query polling for job status with smart pause/resume for active job monitoring
- React hooks for component-local state and form management
- Context only for theme/settings that rarely change

**Error Handling Patterns:**
- Error boundaries at route and feature levels
- Consistent error response structure from RTK Query
- User-friendly error messages with retry capabilities
- Error logging and monitoring integration

**API Design Conventions:**
- All endpoints use `/api/v1/` prefix following OpenAPI specification
- Job-based approach: Job submission via FormData, status via JSON responses
- User-provided LLM API keys per request (session-only storage)
- RTK Query API definitions with TypeScript types from OpenAPI schema
- Consistent response shapes and error handling with automatic retry logic
- Cache invalidation strategies for job status polling

**Component Organization Principles:**
- Container/Presentational pattern where beneficial
- Custom hooks for business logic extraction
- Prop drilling avoided through appropriate state management
- Component composition over inheritance

### Quality Requirements

**Testing Coverage Expectations:**
- **Unit Tests:** 80%+ coverage for utilities, services, and business logic
- **Integration Tests:** All RTK Query endpoints and REST polling mechanisms
- **Component Tests:** Critical user workflows and error conditions
- **E2E Tests:** Complete decompilation → translation workflows

**Code Review Standards:**
- All PRs require review from senior developer
- Automated checks: linting, type checking, test coverage
- Performance impact assessment for bundle size changes
- Security review for API integrations and data handling

**Documentation Requirements:**
- TSDoc comments for all public APIs and complex functions
- README files for each major module
- Architecture decision updates for significant changes
- Deployment and environment setup documentation

**Performance Considerations:**
- Bundle size monitoring with size limits
- Lazy loading for non-critical features
- Memoization for expensive computations
- Virtual scrolling for large datasets

## Architectural Principles

**Core Design Principles:**
1. **Predictable State Management:** All state changes flow through Redux with clear action patterns
2. **Type Safety First:** Comprehensive TypeScript usage with strict mode enabled
3. **Performance by Default:** Code splitting, lazy loading, and efficient rendering patterns
4. **Error Recovery:** Graceful degradation and user-friendly error handling
5. **Developer Experience:** Clear patterns, excellent tooling, fast feedback loops

**Scalability and Performance Considerations:**
- Code splitting at route and feature levels
- Efficient state selectors with memoization
- REST polling optimization and request management
- Progressive loading for large visualizations
- CDN integration for static assets

**Security and Privacy Requirements:**
- HTTPS/WSS only communication
- Input validation and sanitization
- No sensitive data persistence in browser
- Secure error handling without information leakage
- Content Security Policy implementation

**Maintainability and Code Quality Standards:**
- Consistent naming conventions and file organization
- Clear separation of concerns between layers
- Comprehensive test coverage with clear test organization
- Regular dependency updates and security audits
- Documentation maintained alongside code changes

## Package and Library Standards

**Approved Libraries for Common Tasks:**
- **HTTP Client:** RTK Query (built into Redux Toolkit)
- **REST Polling:** RTK Query with intelligent polling strategies
- **Validation:** Yup or Zod for form validation
- **Date Handling:** date-fns (tree-shakeable)
- **Visualization:** D3.js + custom React wrappers or Recharts
- **File Handling:** Custom implementations with drag-drop libraries
- **Styling:** MUI system + emotion for custom styles

**Package Selection Criteria:**
- Active maintenance with recent updates
- TypeScript support (either built-in or @types packages)
- Bundle size impact assessment
- Security vulnerability history
- Community adoption and ecosystem support

**Version Management Strategy:**
- Pin exact versions for critical dependencies
- Regular dependency audits and updates
- Automated security vulnerability scanning
- Gradual major version updates with testing

**Custom vs. Third-party Guidelines:**
- Prefer established libraries for common functionality
- Custom implementations for business-specific logic
- Wrapper abstractions for external dependencies
- Contribute back to open source when beneficial

## Integration Guidelines

**API Design Standards:**
- OpenAPI specification consumption for type generation
- Consistent error response handling across all endpoints
- Request/response logging for debugging
- Authentication token management through secure headers

**Data Exchange Formats:**
- JSON for REST API communication
- Binary data handling for file uploads
- JSON REST responses with API versioning
- Type-safe serialization/deserialization

**Error Handling and Logging Standards:**
- Structured error objects with codes and user messages
- Client-side error logging with contextual information
- User-friendly error displays with actionable suggestions
- Error boundary implementation at appropriate levels

**Cross-service Communication Patterns:**
- Service layer abstraction for external dependencies
- Retry logic with exponential backoff
- Circuit breaker pattern for unreliable services
- Health check integration for monitoring

## Development Environment

**Required Development Tools:**
- **IDE:** VS Code with recommended extensions (TypeScript, ESLint, Prettier, Redux DevTools)
- **Node.js:** Version 18+ for optimal Vite compatibility
- **Package Manager:** npm or yarn (consistency across team)
- **Browser:** Chrome/Firefox with Redux DevTools extension

**Local Development Setup:**
- Environment variable configuration for different backends
- Hot reloading with Vite development server
- Mock API capabilities for offline development
- Docker Compose for complete local stack

**Testing Environment Requirements:**
- Jest for unit and integration testing
- React Testing Library for component testing
- Playwright for end-to-end testing
- MSW (Mock Service Worker) for API mocking

**Debugging and Profiling Tools:**
- Redux DevTools for state inspection
- React Developer Tools for component debugging
- Network panel for API monitoring
- Performance profiler for optimization analysis

## Security Standards

**Authentication and Authorization Patterns:**
- Session-based API key management (no persistent storage)
- Secure token transmission via HTTPS headers
- Automatic token refresh and session management
- Logout cleanup of sensitive data

**Data Validation and Sanitization:**
- Input validation at component level
- Server response validation through schemas
- File upload validation and scanning
- XSS prevention through proper escaping

**Secure Coding Practices:**
- No sensitive data in client-side storage
- Proper error handling without information leakage
- Content Security Policy implementation
- Dependency vulnerability scanning

**Vulnerability Management:**
- Regular security dependency audits
- Automated vulnerability scanning in CI/CD
- Security-focused code review checklist
- Incident response procedures for security issues

## Performance Guidelines

**Performance Targets:**
- **Page Load:** <3 seconds for initial load
- **Time to Interactive:** <5 seconds
- **Bundle Size:** <500KB initial, <1MB total
- **Polling Frequency:** 1-2 second intervals for progress updates

**Optimization Strategies:**
- Code splitting at route and component levels
- Lazy loading for non-critical features
- Memoization for expensive calculations
- Virtual scrolling for large datasets
- Efficient Redux selectors with reselect

**Caching Policies:**
- RTK Query automatic caching for API responses
- Browser caching for static assets
- Service worker for offline capability
- CDN integration for global asset delivery

**Resource Management Standards:**
- Memory leak prevention with proper cleanup
- REST polling lifecycle management
- Large file handling with streaming
- Garbage collection optimization

## Decision Rationale

**Trade-offs Considered:**

**Redux Toolkit vs. Simpler State Management:**
- **Chosen:** Redux Toolkit for complex multi-provider LLM coordination
- **Trade-off:** More boilerplate and learning curve vs. simpler solutions
- **Rationale:** Project complexity demands centralized state management with sophisticated async handling
- **Risk Mitigation:** Comprehensive documentation and team training

**Material-UI vs. Custom Components:**
- **Chosen:** Material-UI for enterprise component library
- **Trade-off:** Larger bundle size vs. development speed
- **Rationale:** Accelerated development with professional appearance
- **Risk Mitigation:** Bundle optimization and selective imports

**React vs. Alternative Frameworks:**
- **Chosen:** React 18 for ecosystem maturity and team expertise
- **Trade-off:** Learning curve vs. simpler alternatives
- **Rationale:** Best ecosystem support for complex state management needs
- **Risk Mitigation:** Gradual adoption of advanced features

**Alternative Options Evaluated:**
- **Zustand:** Evaluated but insufficient for multi-provider coordination complexity
- **Vue.js:** Considered but React ecosystem better for LLM integration libraries
- **Next.js:** Evaluated but unnecessary complexity for SPA requirements
- **Custom State Management:** Considered but Redux Toolkit provides proven patterns

**Risk Assessment and Mitigation:**
- **Technology Risk:** Mitigated through gradual adoption and comprehensive testing
- **Performance Risk:** Addressed through monitoring, profiling, and optimization strategies
- **Security Risk:** Managed through security-first development practices and auditing
- **Complexity Risk:** Reduced through clear documentation and team training

**Future Flexibility Considerations:**
- Component library abstraction allows future UI framework changes
- Service layer enables backend API evolution
- State management patterns support feature expansion
- Containerization enables deployment flexibility

## Implementation Guidelines

**Application of Decisions in Feature Development:**
- All new features must follow established Redux Toolkit patterns
- UI components must use Material-UI as base with consistent theming
- API integrations must use RTK Query with proper error handling
- Testing requirements apply to all new code with coverage gates

**Exception Handling Process:**
- Technical exceptions require team discussion and documentation
- Alternative approaches need performance and security assessment
- All exceptions documented with rationale and future review date
- Architectural changes require ADR updates

**Documentation and Knowledge Sharing:**
- New patterns documented in team wiki with examples
- Complex business logic includes comprehensive code comments
- Architecture decisions communicated in team meetings
- External dependencies documented with usage guidelines

**Team Training and Onboarding:**
- New team members receive Redux Toolkit and project architecture overview
- Pair programming for complex state management implementations
- Code review focus on architectural compliance and best practices
- Regular knowledge sharing sessions for new patterns and tools

---

**Document Version:** 1.0  
**Last Updated:** 2025-08-31  
**Next Review:** Upon major feature completion or 3 months  
**Related Documents:** 000_PPRD|bin2nlp-frontend.md