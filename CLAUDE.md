# Project: bin2nlp-ui

## Current Status

- **Phase:** Task Generation Phase - Ready to Start
- **Last Session:** 2025-08-31 - Completed all 4 Technical Implementation Documents (TIDs)
- **Next Steps:** Generate actionable task lists using @0xcc/instruct/006_generate-tasks.md
- **Active Document:** Ready to create 001_FTASKS|file-management-system.md
- **Current Feature:** TID creation phase complete (4/4) - Moving to task generation

## Quick Resume Commands

```bash
# XCC session start sequence
"Please help me resume where I left off"
# Or manual if needed:
@CLAUDE.md
@0xcc/session_state.json
ls -la 0xcc/*/

# Research integration (requires ref MCP server)
# Format: "Use /mcp ref search '[context-specific search term]'"

# Load project context (after Project PRD exists)
@0xcc/prds/000_PPRD|[project-name].md
@0xcc/adrs/000_PADR|[project-name].md

# Load current work area based on phase
@0xcc/prds/      # For PRD work
@0xcc/tdds/      # For TDD work
@0xcc/tids/      # For TID work
@0xcc/tasks/     # For task execution
```

## Housekeeping Commands

```bash
"Please create a checkpoint"        # Save complete state
"Please help me resume"            # Restore context for new session
"My context is getting too large"  # Clean context, restore essentials
"Please save the session transcript" # Save session transcript
"Please show me project status"    # Display current state
```

# Project Standards

## Technology Stack

- **Frontend:** React 18 + TypeScript + Vite with Material-UI (MUI) v5 component library
- **State Management:** Redux Toolkit with RTK Query for complex multi-provider LLM coordination
- **Build Tools:** Vite for development and production builds with TypeScript strict mode
- **Testing:** Jest + React Testing Library + Playwright for comprehensive test coverage
- **Deployment:** Multi-container Docker architecture with separate nginx reverse proxy

## Development Standards

### Code Organization

- Feature-based directory structure with clear separation (components/, services/, store/)
- PascalCase for components, camelCase for services/utils, UPPER_SNAKE_CASE for constants
- Import order: external libraries → internal services → components → types → relative imports
- Redux Toolkit slices in store/slices/ with RTK Query APIs in services/api/

### Coding Patterns

- Redux Toolkit with RTK Query for all server state and multi-provider LLM coordination
- Container/Presentational pattern with custom hooks for business logic extraction
- Error boundaries at route and feature levels with user-friendly error messages
- WebSocket service with automatic reconnection and heartbeat monitoring
- TypeScript strict mode with comprehensive type definitions and TSDoc comments

### Quality Requirements

- 80%+ test coverage for utilities and services, comprehensive component testing
- All PRs require code review with automated linting, type checking, and bundle size monitoring
- Performance budgets: <3s page load, <500KB initial bundle, <500ms WebSocket latency
- TSDoc documentation for all public APIs and complex business logic

## Architecture Principles

- **Predictable State Management:** All state changes flow through Redux with clear action patterns
- **Type Safety First:** Comprehensive TypeScript usage with strict mode and generated API types
- **Performance by Default:** Code splitting, lazy loading, memoization, and virtual scrolling for large datasets
- **Error Recovery:** Graceful degradation, retry logic with exponential backoff, circuit breaker patterns
- **Security First:** HTTPS/WSS only, no sensitive data persistence, input validation, CSP implementation

## Implementation Notes

- **Job-Based Architecture:** Single `/api/v1/decompile` endpoint for submission, status, and results - zero backend changes required
- **Real-time Updates:** REST polling at 1-2 second intervals with RTK Query smart polling and cache invalidation
- **Multi-Provider LLM Strategy:** User-managed API keys with session-only storage, provider discovery via `/api/v1/llm-providers`
- **Component Library:** Material-UI with custom theming, selective imports for bundle optimization
- **API Integration:** OpenAPI spec consumption for type generation, RTK Query for caching and polling management
- **State Management:** Domain-driven structure with co-located components, single `analysisSlice` for job management
- **Environment Configuration:** Environment variables for deployment flexibility, Docker multi-stage builds for optimization

## AI Dev Tasks Framework Workflow

### Document Creation Sequence

1. **Project Foundation**
   - `000_PPRD|[project-name].md` → `0xcc/prds/` (Project PRD)
   - `000_PADR|[project-name].md` → `0xcc/adrs/` (Architecture Decision Record)
   - Update this CLAUDE.md with Project Standards from ADR

2. **Feature Development** (repeat for each feature)
   - `[###]_FPRD|[feature-name].md` → `0xcc/prds/` (Feature PRD)
   - `[###]_FTDD|[feature-name].md` → `0xcc/tdds/` (Technical Design Doc)
   - `[###]_FTID|[feature-name].md` → `0xcc/tids/` (Technical Implementation Doc)
   - `[###]_FTASKS|[feature-name].md` → `0xcc/tasks/` (Task List)

### Instruction Documents Reference

- `@0xcc/instruct/001_create-project-prd.md` - Creates project vision and feature breakdown
- `@0xcc/instruct/002_create-adr.md` - Establishes tech stack and standards
- `@0xcc/instruct/003_create-feature-prd.md` - Details individual feature requirements
- `@0xcc/instruct/004_create-tdd.md` - Creates technical architecture and design
- `@0xcc/instruct/005_create-tid.md` - Provides implementation guidance and coding hints
- `@0xcc/instruct/006_generate-tasks.md` - Generates actionable development tasks
- `@0xcc/instruct/007_process-task-list.md` - Guides task execution and progress tracking
- `@0xcc/instruct/008_housekeeping.md` - Session management and context preservation

## Document Inventory

### Project Level Documents

- ✅ 0xcc/prds/000_PPRD|bin2nlp-frontend.md (Project PRD)
- ✅ 0xcc/adrs/000_PADR|bin2nlp-frontend.md (Architecture Decision Record)
- ✅ 0xcc/docs/api-integration-guide.md (API Reference Guide)
- ✅ 0xcc/tasks/005_FTASKS|documentation-api-alignment.md (COMPLETED - 123+ alignment tasks)

### Feature Documents (Job-Based Architecture)

- ✅ 0xcc/prds/001_FPRD|file-management-system.md (Analysis Job Management System PRD)
- ✅ 0xcc/prds/002_FPRD|two-phase-pipeline-interface.md (Analysis Configuration Interface PRD)
- ✅ 0xcc/prds/003_FPRD|results-exploration-platform.md (Results Exploration Platform PRD)
- ✅ 0xcc/prds/004_FPRD|multi-provider-llm-integration.md (Multi-Provider LLM Integration PRD)
- ✅ 0xcc/tdds/001_FTDD|file-management-system.md (Analysis Job Management System TDD)
- ✅ 0xcc/tdds/002_FTDD|two-phase-pipeline-interface.md (Analysis Configuration Interface TDD)
- ✅ 0xcc/tdds/003_FTDD|results-exploration-platform.md (Results Exploration Platform TDD)
- ✅ 0xcc/tdds/004_FTDD|multi-provider-llm-integration.md (Multi-Provider LLM Integration TDD)
- ✅ 0xcc/tids/001_FTID|file-management-system.md (Analysis Job Management System TID)
- ✅ 0xcc/tids/002_FTID|two-phase-pipeline-interface.md (Analysis Configuration Interface TID)
- ✅ 0xcc/tids/003_FTID|results-exploration-platform.md (Results Exploration Platform TID)
- ✅ 0xcc/tids/004_FTID|multi-provider-llm-integration.md (Multi-Provider LLM Integration TID)
- ❌ 0xcc/tasks/001_FTASKS|file-management-system.md (Analysis Job Management System Tasks)
- ❌ 0xcc/tasks/002_FTASKS|two-phase-pipeline-interface.md (Analysis Configuration Interface Tasks)
- ❌ 0xcc/tasks/003_FTASKS|results-exploration-platform.md (Results Exploration Platform Tasks)
- ❌ 0xcc/tasks/004_FTASKS|multi-provider-llm-integration.md (Multi-Provider LLM Integration Tasks)

### Status Indicators

- ✅ **Complete:** Document finished and reviewed
- ⏳ **In Progress:** Currently being worked on
- ❌ **Pending:** Not yet started
- 🔄 **Needs Update:** Requires revision based on changes

## Housekeeping Status

- **Last Checkpoint:** [Date/Time] - [Brief description]
- **Last Transcript Save:** [Date/Time] - [File location in 0xcc/transcripts/]
- **Context Health:** Good/Moderate/Needs Cleanup
- **Session Count:** [Number] sessions since project start
- **Total Development Time:** [Estimated hours]

## Task Execution Standards

### Completion Protocol

- ✅ One sub-task at a time, ask permission before next
- ✅ Mark sub-tasks complete immediately: `[ ]` → `[x]`
- ✅ When parent task complete: Run tests → Stage → Clean → Commit → Mark parent complete
- ✅ Never commit without passing tests
- ✅ Always clean up temporary files before commit

### Commit Message Format

```bash
git commit -m "feat: [brief description]" -m "- [key change 1]" -m "- [key change 2]" -m "Related to [Task#] in [PRD]"
```

### Test Commands

_[Will be defined in ADR, examples:]_

- **Frontend:** `npm test` or `npm run test:unit`
- **Backend:** `pytest` or `python -m pytest`
- **Full Suite:** `[project-specific command]`

## Code Quality Checklist

### Before Any Commit

- [ ] All tests passing
- [ ] No console.log/print debugging statements
- [ ] No commented-out code blocks
- [ ] No temporary files (\*.tmp, .cache, etc.)
- [ ] Code follows project naming conventions
- [ ] Functions/methods have docstrings if required
- [ ] Error handling implemented per ADR standards

### File Organization Rules

_[Will be defined in ADR, examples:]_

- Place test files alongside source files: `Component.tsx` + `Component.test.tsx`
- Follow directory structure from ADR
- Use naming conventions: `[Feature][Type].extension`
- Import statements organized: external → internal → relative
- Framework files in `0xcc/` directory, project files in standard locations

## Context Management

### Session End Protocol

```bash
# 1. Update CLAUDE.md status section
# 2. Create session summary
"Please create a checkpoint"
# 3. Commit progress
git add .
git commit -m "docs: completed [task] - Next: [specific action]"
```

### Context Recovery (If Lost)

```bash
# Mild context loss
@CLAUDE.md
@0xcc/session_state.json
ls -la 0xcc/*/
@0xcc/instruct/[current-phase].md

# Severe context loss
@CLAUDE.md
@0xcc/prds/000_PPRD|[project-name].md
@0xcc/adrs/000_PADR|[project-name].md
ls -la 0xcc/*/
@0xcc/instruct/
```

### Resume Commands for Next Session

```bash
# Standard resume sequence
"Please help me resume where I left off"
# Or manual if needed:
@CLAUDE.md
@0xcc/session_state.json
@[specific-file-currently-working-on]
# Specific next action: [detailed action]
```

## Progress Tracking

### Task List Maintenance

- Update task list file after each sub-task completion
- Add newly discovered tasks as they emerge
- Update "Relevant Files" section with any new files created/modified
- Include one-line description for each file's purpose
- Distinguish between framework files (0xcc/) and project files (src/, tests/, etc.)

### Status Indicators for Tasks

- `[ ]` = Not started
- `[x]` = Completed
- `[~]` = In progress (use sparingly, only for current sub-task)
- `[?]` = Blocked/needs clarification

### Session Documentation

After each development session, update:

- Current task position in this CLAUDE.md
- Any blockers or questions encountered
- Next session starting point
- Files modified in this session (both 0xcc/ and project files)

## Implementation Patterns

### Error Handling

_[Will be defined in ADR - placeholder for standards]_

- Use project-standard error handling patterns from ADR
- Always handle both success and failure cases
- Log errors with appropriate level (error/warn/info)
- User-facing error messages should be friendly

### Testing Patterns

_[Will be defined in ADR - placeholder for standards]_

- Each function/component gets a test file
- Test naming: `describe('[ComponentName]', () => { it('should [behavior]', () => {})})`
- Mock external dependencies
- Test both happy path and error cases
- Aim for [X]% coverage per ADR standards

## Debugging Protocols

### When Tests Fail

1. Read error message carefully
2. Check recent changes for obvious issues
3. Run individual test to isolate problem
4. Use debugger/console to trace execution
5. Check dependencies and imports
6. Ask for help if stuck > 30 minutes

### When Task is Unclear

1. Review original PRD requirements
2. Check TDD for design intent
3. Look at TID for implementation hints
4. Ask clarifying questions before proceeding
5. Update task description for future clarity

## Feature Priority Order

_[Will be populated from Project PRD]_

**From bin2nlp-frontend Project PRD (Job-Based Architecture):**

1. Analysis Job Management System (Core/MVP) - Single endpoint job submission, tracking, cancellation
2. Analysis Configuration Interface (Core/MVP) - Decompilation settings + LLM provider selection
3. Results Exploration Platform (Core/MVP) - Interactive results viewing from completed jobs
4. Multi-Provider LLM Integration (Core/MVP) - Provider discovery + user credential management

**Implementation Priority (TID Creation Order):**

1. Analysis Job Management System (Foundation for all other features)
2. Analysis Configuration Interface (Job submission requirements)
3. Multi-Provider LLM Integration (Credential management for jobs)
4. Results Exploration Platform (Results display for completed jobs)

## Session History Log

### Session 1: 2025-08-31 - Project Foundation Complete

- **Accomplished:** Created comprehensive Project PRD and ADR for bin2nlp-ui, established Redux Toolkit architecture
- **Next:** Create Feature PRDs for core features using @0xcc/instruct/003_create-feature-prd.md
- **Files Created:** 000_PPRD|bin2nlp-frontend.md, 000_PADR|bin2nlp-frontend.md, CLAUDE.md with project standards
- **Duration:** Foundation phase complete

### Sessions 2-4: 2025-08-31 - Feature Development Complete

- **Accomplished:** Created all 4 Feature PRDs and all 4 Technical Design Documents (TDDs)
- **Major Discovery:** API analysis revealed job-based architecture, not separate endpoints as initially assumed
- **Correction Task:** Completed massive 123+ task documentation-API alignment project
- **Files Created:** All 4 Feature PRDs, all 4 Feature TDDs, API integration guide, alignment task documentation
- **Architecture Locked:** React 18 + TypeScript, MUI, Redux Toolkit + RTK Query, domain-driven structure, co-located components, smart REST polling
- **Duration:** Feature analysis and alignment complete

### Current Session: 2025-08-31 - TID Creation Phase Complete

- **Accomplished:** Created all 4 comprehensive Technical Implementation Documents (TIDs)
  - 001_FTID|file-management-system.md (Analysis Job Management System) - 3,900+ lines complete
  - 002_FTID|two-phase-pipeline-interface.md (Analysis Configuration Interface) - 3,400+ lines complete
  - 003_FTID|results-exploration-platform.md (Results Exploration Platform) - 3,600+ lines complete
  - 004_FTID|multi-provider-llm-integration.md (Multi-Provider LLM Integration) - 3,700+ lines complete
- **Status:** TID Progress 4/4 completed - All implementation guidance ready
- **Next Action:** Task generation phase using @0xcc/instruct/006_generate-tasks.md
- **Implementation Context:** Complete implementation guidance available for all 4 core features, ready to generate actionable development tasks

_[Add new sessions as they occur]_

## Research Integration

### MCP Research Support

When available, the framework supports research integration via:

```bash
# Use MCP ref server for contextual research
/mcp ref search "[context-specific query]"

# Research is integrated into all instruction documents as option B
# Example: "🔍 Research first: Use /mcp ref search 'MVP development timeline'"
```

### Research History Tracking

- Research queries and findings captured in session transcripts
- Key research decisions documented in session state
- Research context preserved across sessions for consistency

## Quick Reference

### 0xcc Folder Structure

```
project-root/
├── CLAUDE.md                       # This file (project memory)
├── 0xcc/                           # XCC Framework directory
│   ├── adrs/                       # Architecture Decision Records
│   ├── docs/                       # Additional documentation
│   ├── instruct/                   # Framework instruction files
│   ├── prds/                       # Product Requirements Documents
│   ├── tasks/                      # Task Lists
│   ├── tdds/                       # Technical Design Documents
│   ├── tids/                       # Technical Implementation Documents
│   ├── transcripts/                # Session transcripts
│   ├── checkpoints/                # Automated state backups
│   ├── scripts/                    # Optional automation scripts
│   ├── session_state.json          # Current session tracking
│   └── research_context.json       # Research history and context
├── src/                            # Your project code
├── tests/                          # Your project tests
└── README.md                       # Project README
```

### File Naming Convention

- **Project Level:** `000_PPRD|ProjectName.md`, `000_PADR|ProjectName.md`
- **Feature Level:** `001_FPRD|FeatureName.md`, `001_FTDD|FeatureName.md`, etc.
- **Sequential:** Use 001, 002, 003... for features in priority order
- **Framework Files:** All in `0xcc/` directory for clear organization
- **Project Files:** Standard locations (src/, tests/, package.json, etc.)

### Emergency Contacts & Resources

- **Framework Documentation:** @0xcc/instruct/000_README.md
- **Current Project PRD:** @0xcc/prds/000_PPRD|bin2nlp-frontend.md
- **Tech Standards:** @0xcc/adrs/000_PADR|bin2nlp-frontend.md
- **Housekeeping Guide:** @0xcc/instruct/008_housekeeping.md

---

**Framework Version:** 1.1  
**Last Updated:** [Current Date]  
**Project Started:** [Start Date]  
**Structure:** 0xcc framework with MCP research integration
