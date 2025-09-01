# Technical Implementation Document: Results Exploration Platform

**Date:** 2025-08-31  
**Project:** bin2nlp-frontend  
**Feature:** Results Exploration Platform  
**Document ID:** 003_FTID|results-exploration-platform  
**Related PRD:** 003_FPRD|results-exploration-platform.md  
**Related TDD:** 003_FTDD|results-exploration-platform.md

## Implementation Overview

The Results Exploration Platform implements a high-performance, multi-pane interface for exploring binary analysis results that combines virtual scrolling, syntax-highlighted assembly code display, and synchronized natural language translation viewing. The implementation leverages React 18's concurrent features, Redux Toolkit for state management, and react-window for virtualization to deliver smooth 60fps performance even with thousands of functions and extensive assembly code.

**Key Implementation Principles:**
- Performance-first architecture with virtual scrolling and progressive loading for large datasets (1000+ functions)
- Feature-based directory structure with co-located components following established ADR patterns
- Redux Toolkit state management for synchronized multi-pane navigation and cross-highlighting
- Hybrid search architecture combining client-side indices for speed with backend power for complex queries
- Memory-efficient rendering with intelligent cleanup and LRU caching strategies

**Integration Architecture:**
- Direct integration with job status API responses containing complete analysis results
- Seamless transition from job completion to results exploration through shared Redux state
- Synchronized highlighting between assembly code and natural language translations
- Export functionality integrated with user bookmarks and annotation system
- Session persistence for analysis navigation state and user preferences

## File Structure and Organization

### Feature Directory Architecture

```
src/
├── features/
│   └── results-exploration/              # Results platform feature root
│       ├── components/                   # Feature components
│       │   ├── ResultsExplorer.tsx      # Main container component
│       │   ├── layout/                  # Layout and panel components
│       │   │   ├── ExplorationLayout.tsx       # Main layout orchestrator
│       │   │   ├── ResizablePanes.tsx          # Split-pane interface
│       │   │   ├── NavigationHeader.tsx       # Top navigation and controls
│       │   │   └── StatusFooter.tsx           # Status and progress display
│       │   ├── assembly/                # Assembly code display
│       │   │   ├── AssemblyViewer.tsx          # Virtual scrolling assembly viewer
│       │   │   ├── AssemblyCodeLine.tsx       # Individual assembly line component
│       │   │   ├── SyntaxHighlighter.tsx      # Custom assembly syntax highlighting
│       │   │   ├── AssemblySearch.tsx         # Assembly-specific search
│       │   │   └── AddressNavigation.tsx      # Memory address navigation
│       │   ├── translation/             # Translation display components
│       │   │   ├── TranslationPane.tsx        # Main translation viewer
│       │   │   ├── TranslationSection.tsx     # Expandable translation sections
│       │   │   ├── FunctionSummary.tsx        # Function-level summaries
│       │   │   ├── DetailedExplanation.tsx    # Detailed code explanations
│       │   │   └── ConfidenceIndicator.tsx    # Translation quality indicators
│       │   ├── navigation/              # Navigation and hierarchy
│       │   │   ├── FunctionTree.tsx           # Virtual function tree
│       │   │   ├── FunctionTreeNode.tsx      # Individual tree nodes
│       │   │   ├── FunctionSearch.tsx        # Function search and filter
│       │   │   ├── CallGraphVisualization.tsx # Interactive call graph
│       │   │   └── BreadcrumbNavigation.tsx   # Current location breadcrumbs
│       │   ├── search/                  # Search functionality
│       │   │   ├── UnifiedSearch.tsx          # Main search interface
│       │   │   ├── SearchResults.tsx         # Search results display
│       │   │   ├── SearchHighlighting.tsx    # Content highlighting
│       │   │   ├── AdvancedSearchFilters.tsx # Filter and scope controls
│       │   │   └── SearchHistory.tsx         # Search history management
│       │   ├── interaction/             # User interaction features
│       │   │   ├── BookmarkManager.tsx       # Bookmark and annotation system
│       │   │   ├── SelectionHandler.tsx      # Text selection and copying
│       │   │   ├── CrossPaneHighlighting.tsx # Synchronized highlighting
│       │   │   ├── ContextualTooltips.tsx    # Hover information
│       │   │   └── KeyboardNavigation.tsx    # Keyboard shortcuts
│       │   └── export/                  # Export functionality
│       │       ├── ExportController.tsx      # Export orchestration
│       │       ├── FormatSelector.tsx        # Export format selection
│       │       ├── SelectionExporter.tsx     # Export user selections
│       │       └── AnnotationExporter.tsx    # Export with annotations
│       ├── hooks/                       # Feature-specific hooks
│       │   ├── useResultsExploration.ts      # Main exploration hook
│       │   ├── useVirtualScrolling.ts        # Virtual scrolling management
│       │   ├── useCrossPaneSync.ts           # Cross-pane synchronization
│       │   ├── useAssemblyNavigation.ts      # Assembly code navigation
│       │   ├── useTranslationDisplay.ts      # Translation state management
│       │   ├── useSearchFunctionality.ts     # Search state and operations
│       │   ├── useBookmarkSystem.ts          # Bookmark and annotation hooks
│       │   ├── usePerformanceOptimization.ts # Performance monitoring
│       │   └── useSessionPersistence.ts      # Session state management
│       ├── services/                    # Business logic services
│       │   ├── resultsApi.ts                 # RTK Query API definitions
│       │   ├── searchIndexing.ts             # Client-side search indexing
│       │   ├── assemblySyntaxParser.ts       # Assembly code parsing
│       │   ├── crossReferenceService.ts      # Code cross-reference mapping
│       │   ├── virtualScrollingManager.ts    # Virtualization optimization
│       │   ├── memoryManager.ts              # Memory usage optimization
│       │   └── exportService.ts              # Results export functionality
│       ├── workers/                     # Web Workers for background processing
│       │   ├── searchIndexWorker.ts          # Background search indexing
│       │   ├── assemblySyntaxWorker.ts       # Background syntax processing
│       │   └── memoryCleanupWorker.ts        # Background memory management
│       ├── types/                       # Feature-specific types
│       │   ├── AnalysisResults.types.ts      # Core analysis result types
│       │   ├── AssemblyDisplay.types.ts      # Assembly viewing types
│       │   ├── TranslationViewing.types.ts   # Translation display types
│       │   ├── Navigation.types.ts           # Navigation and tree types
│       │   ├── Search.types.ts               # Search functionality types
│       │   ├── VirtualScrolling.types.ts     # Virtualization types
│       │   └── UserInteraction.types.ts      # Bookmark and interaction types
│       ├── utils/                       # Feature utilities
│       │   ├── assemblyFormatting.ts         # Assembly code formatting
│       │   ├── translationFormatting.ts      # Translation text formatting
│       │   ├── searchUtilities.ts            # Search helper functions
│       │   ├── navigationUtilities.ts        # Navigation helper functions
│       │   ├── performanceUtilities.ts       # Performance monitoring
│       │   └── exportUtilities.ts            # Export helper functions
│       ├── constants/                   # Feature constants
│       │   ├── AssemblyConstants.ts          # Assembly display constants
│       │   ├── VirtualScrollingConstants.ts  # Scrolling configuration
│       │   ├── SearchConstants.ts            # Search configuration
│       │   └── PerformanceConstants.ts       # Performance thresholds
│       └── index.ts                     # Feature exports
├── store/
│   └── slices/
│       ├── resultsExplorationSlice.ts        # Main results exploration state
│       └── resultsSearchSlice.ts             # Search-specific state management
└── components/                          # Shared application components
    └── common/
        ├── VirtualList.tsx                   # Reusable virtual list component
        ├── SyntaxHighlighter.tsx            # Generic syntax highlighting
        └── PerformanceMonitor.tsx           # Performance monitoring overlay
```

### Import Organization Pattern

```typescript
// External dependencies
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FixedSizeList as List, VariableSizeList } from 'react-window';
import { Highlight, themes } from 'prism-react-renderer';
import {
  Box, Paper, Typography, Divider, Chip, IconButton,
  TextField, InputAdornment, Tooltip, Grid
} from '@mui/material';
import {
  Search as SearchIcon, BookmarkAdd as BookmarkIcon,
  Visibility as VisibilityIcon, Code as CodeIcon
} from '@mui/icons-material';

// Redux and state management
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { useGetAnalysisResultsQuery, useSearchAnalysisContentLazyQuery } from '../services/resultsApi';
import {
  selectCurrentAnalysisResults,
  selectNavigationState,
  selectSearchState,
  setSelectedFunction,
  updateViewportInfo,
  addBookmark
} from '../../../store/slices/resultsExplorationSlice';

// Feature services and utilities
import { createSearchIndex } from '../services/searchIndexing';
import { parseAssemblyInstruction } from '../services/assemblySyntaxParser';
import { calculateVirtualScrollingMetrics } from '../services/virtualScrollingManager';
import { formatAssemblyLine, formatTranslationSection } from '../utils/assemblyFormatting';

// Feature components
import { AssemblyViewer } from './assembly/AssemblyViewer';
import { TranslationPane } from './translation/TranslationPane';
import { FunctionTree } from './navigation/FunctionTree';
import { UnifiedSearch } from './search/UnifiedSearch';

// Types and constants
import type {
  AnalysisResults,
  FunctionInfo,
  AssemblyDisplayConfig,
  NavigationState
} from '../types/AnalysisResults.types';
import { VIRTUAL_SCROLLING_CONSTANTS, PERFORMANCE_THRESHOLDS } from '../constants/VirtualScrollingConstants';
```

## Component Implementation Hints

### Main Container Component

**ResultsExplorer.tsx - Primary Container:**
```typescript
interface ResultsExplorerProps {
  jobId: string;
  onNavigateBack?: () => void;
  initialViewConfig?: Partial<ExplorationViewConfig>;
}

const ResultsExplorer: React.FC<ResultsExplorerProps> = ({
  jobId,
  onNavigateBack,
  initialViewConfig
}) => {
  const dispatch = useAppDispatch();
  
  // RTK Query for analysis results
  const {
    data: analysisResults,
    isLoading,
    error,
    refetch
  } = useGetAnalysisResultsQuery(jobId, {
    // Only fetch if job is completed
    skip: !jobId,
    pollingInterval: undefined, // No polling needed for completed results
    refetchOnMountOrArgChange: true,
  });
  
  // Main exploration state from Redux
  const {
    selectedFunction,
    viewConfig,
    navigationHistory,
    bookmarks,
    searchState
  } = useAppSelector(selectExplorationState);
  
  // Performance monitoring and optimization
  const performanceMetrics = useRef<PerformanceMetrics>({
    renderTime: 0,
    virtualScrollItems: 0,
    memoryUsage: 0,
    lastOptimization: Date.now(),
  });
  
  // Custom hooks for complex functionality
  const {
    handleFunctionSelect,
    navigateToAddress,
    toggleBookmark,
    updateViewConfig
  } = useResultsExploration(analysisResults);
  
  const {
    searchQuery,
    searchResults,
    isSearching,
    performSearch,
    clearSearch
  } = useSearchFunctionality(analysisResults);
  
  const {
    crossHighlighting,
    syncScrolling,
    updateHighlighting
  } = useCrossPaneSync(selectedFunction, analysisResults);
  
  // Memory and performance monitoring
  usePerformanceOptimization({
    analysisResults,
    viewportMetrics: performanceMetrics.current,
    thresholds: PERFORMANCE_THRESHOLDS,
    onOptimizationNeeded: useCallback((optimizations: OptimizationType[]) => {
      optimizations.forEach(optimization => {
        switch (optimization) {
          case 'CLEANUP_VIRTUAL_SCROLL':
            // Trigger virtual scroll cleanup
            break;
          case 'REDUCE_SEARCH_INDEX':
            // Optimize search indices
            break;
          case 'COMPRESS_ANALYSIS_DATA':
            // Compress large analysis sections
            break;
        }
      });
    }, []),
  });
  
  // Session persistence
  useSessionPersistence({
    selectedFunction,
    viewConfig,
    bookmarks,
    searchState,
    storageKey: `results-exploration-${jobId}`,
  });
  
  // Loading and error states
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <LoadingIndicator message="Loading analysis results..." />
      </Box>
    );
  }
  
  if (error || !analysisResults) {
    return (
      <ErrorDisplay
        error={error}
        onRetry={refetch}
        fallbackMessage="Unable to load analysis results. Please try again."
      />
    );
  }
  
  return (
    <ErrorBoundary
      fallback={<ResultsExplorationErrorFallback jobId={jobId} />}
      onError={(error, errorInfo) => {
        console.error('Results exploration error:', error, errorInfo);
        // Log to error tracking service
      }}
    >
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Navigation Header */}
        <NavigationHeader
          analysisResults={analysisResults}
          currentFunction={selectedFunction}
          searchQuery={searchQuery}
          onSearch={performSearch}
          onNavigateBack={onNavigateBack}
          onExport={() => {/* Export functionality */}}
        />
        
        {/* Main Content Area */}
        <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <ExplorationLayout
            analysisResults={analysisResults}
            selectedFunction={selectedFunction}
            viewConfig={viewConfig}
            crossHighlighting={crossHighlighting}
            searchResults={searchResults}
            onFunctionSelect={handleFunctionSelect}
            onAddressNavigate={navigateToAddress}
            onBookmarkToggle={toggleBookmark}
            onViewConfigChange={updateViewConfig}
            onHighlightingUpdate={updateHighlighting}
          />
        </Box>
        
        {/* Status Footer */}
        <StatusFooter
          analysisResults={analysisResults}
          selectedFunction={selectedFunction}
          performanceMetrics={performanceMetrics.current}
          searchStatus={isSearching ? 'searching' : 'idle'}
        />
        
        {/* Performance Monitor (Development Mode) */}
        {process.env.NODE_ENV === 'development' && (
          <PerformanceMonitor metrics={performanceMetrics.current} />
        )}
      </Box>
    </ErrorBoundary>
  );
};
```

### Virtual Scrolling Assembly Viewer

**AssemblyViewer.tsx - High-Performance Code Display:**
```typescript
interface AssemblyViewerProps {
  functionInfo: FunctionInfo;
  searchResults?: SearchMatch[];
  crossHighlighting?: CrossHighlightingState;
  onLineSelect?: (lineNumber: number, address: string) => void;
  onCrossReference?: (targetAddress: string) => void;
}

const AssemblyViewer: React.FC<AssemblyViewerProps> = ({
  functionInfo,
  searchResults = [],
  crossHighlighting,
  onLineSelect,
  onCrossReference
}) => {
  const listRef = useRef<VariableSizeList>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Virtual scrolling configuration
  const {
    itemCount,
    itemSize,
    estimatedItemSize,
    scrollToItem,
    resetAfterIndex
  } = useVirtualScrolling({
    items: functionInfo.assemblyLines,
    containerHeight: 600, // Will be dynamic based on container
    averageItemHeight: 24, // Assembly line height
    overscanCount: 10, // Pre-render 10 items outside viewport
  });
  
  // Syntax highlighting with memoization
  const highlightedLines = useMemo(() => {
    return functionInfo.assemblyLines.map((line, index) => {
      const isSearchMatch = searchResults.some(result => 
        result.location.lineNumber === index
      );
      const isCrossHighlighted = crossHighlighting?.highlightedLines?.includes(index);
      
      return {
        ...line,
        highlighted: isSearchMatch,
        crossHighlighted: isCrossHighlighted,
        syntaxTokens: parseAssemblyInstruction(line.instruction),
      };
    });
  }, [functionInfo.assemblyLines, searchResults, crossHighlighting]);
  
  // Individual line renderer for virtual scrolling
  const renderAssemblyLine = useCallback(({ index, style }: ListChildComponentProps) => {
    const line = highlightedLines[index];
    
    return (
      <div style={style}>
        <AssemblyCodeLine
          line={line}
          lineNumber={index}
          address={line.address}
          isHighlighted={line.highlighted}
          isCrossHighlighted={line.crossHighlighted}
          onSelect={() => onLineSelect?.(index, line.address)}
          onCrossReference={(target) => onCrossReference?.(target)}
        />
      </div>
    );
  }, [highlightedLines, onLineSelect, onCrossReference]);
  
  // Dynamic item size calculation for complex lines
  const getItemSize = useCallback((index: number) => {
    const line = highlightedLines[index];
    // Base height + additional height for complex instructions
    const baseHeight = 24;
    const complexityMultiplier = line.instruction.length > 50 ? 1.5 : 1;
    return Math.ceil(baseHeight * complexityMultiplier);
  }, [highlightedLines]);
  
  // Scroll to specific line (for navigation)
  useEffect(() => {
    if (crossHighlighting?.scrollToLine !== undefined && listRef.current) {
      listRef.current.scrollToItem(crossHighlighting.scrollToLine, 'center');
    }
  }, [crossHighlighting?.scrollToLine]);
  
  // Handle container resize
  const [containerSize, setContainerSize] = useState({ width: 0, height: 600 });
  
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setContainerSize({ width: clientWidth, height: clientHeight });
      }
    };
    
    const resizeObserver = new ResizeObserver(updateSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => resizeObserver.disconnect();
  }, []);
  
  return (
    <Paper 
      ref={containerRef}
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Assembly Viewer Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">
          {functionInfo.name} 
          <Chip size="small" label={`${functionInfo.size} bytes`} sx={{ ml: 1 }} />
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Address: {functionInfo.address} | Lines: {functionInfo.assemblyLines.length}
        </Typography>
      </Box>
      
      {/* Virtual Scrolling Assembly Content */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        <VariableSizeList
          ref={listRef}
          height={containerSize.height - 80} // Subtract header height
          width={containerSize.width}
          itemCount={itemCount}
          itemSize={getItemSize}
          estimatedItemSize={estimatedItemSize}
          overscanCount={10}
          itemData={{
            lines: highlightedLines,
            searchResults,
            crossHighlighting,
            onLineSelect,
            onCrossReference,
          }}
        >
          {renderAssemblyLine}
        </VariableSizeList>
        
        {/* Scrollbar Enhancement */}
        <AssemblyScrollbarEnhancement
          totalLines={functionInfo.assemblyLines.length}
          visibleRange={[0, Math.min(containerSize.height / 24, functionInfo.assemblyLines.length)]}
          searchMatches={searchResults}
          onScrollToMatch={(matchIndex) => {
            const match = searchResults[matchIndex];
            if (match && listRef.current) {
              listRef.current.scrollToItem(match.location.lineNumber, 'center');
            }
          }}
        />
      </Box>
      
      {/* Assembly Navigation Controls */}
      <AssemblyNavigationControls
        currentAddress={functionInfo.address}
        totalLines={functionInfo.assemblyLines.length}
        onGoToAddress={(address) => {
          const lineIndex = functionInfo.assemblyLines.findIndex(line => 
            line.address === address
          );
          if (lineIndex >= 0 && listRef.current) {
            listRef.current.scrollToItem(lineIndex, 'center');
          }
        }}
        onGoToLine={(lineNumber) => {
          if (listRef.current && lineNumber >= 0 && lineNumber < itemCount) {
            listRef.current.scrollToItem(lineNumber, 'center');
          }
        }}
      />
    </Paper>
  );
};
```

### Cross-Pane Synchronization Hook

**useCrossPaneSync.ts - Synchronized Highlighting:**
```typescript
export const useCrossPaneSync = (
  selectedFunction: FunctionInfo | null,
  analysisResults: AnalysisResults | null
) => {
  const dispatch = useAppDispatch();
  
  // Cross-highlighting state
  const [crossHighlighting, setCrossHighlighting] = useState<CrossHighlightingState>({
    assemblyHighlights: [],
    translationHighlights: [],
    currentSync: null,
    scrollToLine: undefined,
  });
  
  // Debounced highlighting update to prevent excessive updates
  const debouncedUpdateHighlighting = useCallback(
    debounce((newHighlighting: Partial<CrossHighlightingState>) => {
      setCrossHighlighting(prev => ({ ...prev, ...newHighlighting }));
    }, 150),
    []
  );
  
  // Handle assembly line selection
  const handleAssemblyLineSelect = useCallback((
    lineNumber: number,
    address: string,
    instruction: string
  ) => {
    if (!selectedFunction) return;
    
    // Find corresponding translation sections
    const correspondingSections = findCorrespondingSections({
      address,
      instruction,
      functionTranslation: selectedFunction.translation,
      crossReferences: analysisResults?.crossReferences,
    });
    
    const newHighlighting: Partial<CrossHighlightingState> = {
      assemblyHighlights: [lineNumber],
      translationHighlights: correspondingSections.map(section => section.id),
      currentSync: {
        source: 'assembly',
        sourceLocation: { lineNumber, address },
        targetLocations: correspondingSections.map(section => ({
          sectionId: section.id,
          startOffset: section.startOffset,
          endOffset: section.endOffset,
        })),
      },
    };
    
    debouncedUpdateHighlighting(newHighlighting);
    
    // Update Redux state for other components
    dispatch(setCurrentCrossHighlighting({
      selectedLineNumber: lineNumber,
      selectedAddress: address,
      correspondingSections: correspondingSections.map(s => s.id),
    }));
  }, [selectedFunction, analysisResults, debouncedUpdateHighlighting, dispatch]);
  
  // Handle translation section selection
  const handleTranslationSectionSelect = useCallback((
    sectionId: string,
    textRange: { start: number; end: number }
  ) => {
    if (!selectedFunction) return;
    
    // Find corresponding assembly lines
    const correspondingLines = findCorrespondingAssemblyLines({
      sectionId,
      textRange,
      functionInfo: selectedFunction,
      crossReferences: analysisResults?.crossReferences,
    });
    
    const newHighlighting: Partial<CrossHighlightingState> = {
      translationHighlights: [sectionId],
      assemblyHighlights: correspondingLines.map(line => line.lineNumber),
      currentSync: {
        source: 'translation',
        sourceLocation: { sectionId, textRange },
        targetLocations: correspondingLines.map(line => ({
          lineNumber: line.lineNumber,
          address: line.address,
        })),
      },
      // Scroll to first corresponding assembly line
      scrollToLine: correspondingLines.length > 0 ? correspondingLines[0].lineNumber : undefined,
    };
    
    debouncedUpdateHighlighting(newHighlighting);
    
    // Update Redux state
    dispatch(setCurrentCrossHighlighting({
      selectedSectionId: sectionId,
      selectedTextRange: textRange,
      correspondingLines: correspondingLines.map(l => l.lineNumber),
    }));
  }, [selectedFunction, analysisResults, debouncedUpdateHighlighting, dispatch]);
  
  // Clear highlighting
  const clearHighlighting = useCallback(() => {
    setCrossHighlighting({
      assemblyHighlights: [],
      translationHighlights: [],
      currentSync: null,
      scrollToLine: undefined,
    });
    
    dispatch(clearCrossHighlighting());
  }, [dispatch]);
  
  // Auto-sync scrolling (optional feature)
  const [syncScrolling, setSyncScrolling] = useState(false);
  
  const handleSyncScroll = useCallback((
    sourcePane: 'assembly' | 'translation',
    scrollPosition: number,
    visibleRange: { start: number; end: number }
  ) => {
    if (!syncScrolling || !selectedFunction) return;
    
    // Calculate corresponding scroll position in other pane
    // This is complex and depends on the mapping between assembly and translation
    const correspondingScrollPosition = calculateCorrespondingScrollPosition({
      sourcePane,
      scrollPosition,
      visibleRange,
      functionInfo: selectedFunction,
      crossReferences: analysisResults?.crossReferences,
    });
    
    if (correspondingScrollPosition !== null) {
      dispatch(setSyncScrollPosition({
        targetPane: sourcePane === 'assembly' ? 'translation' : 'assembly',
        scrollPosition: correspondingScrollPosition,
      }));
    }
  }, [syncScrolling, selectedFunction, analysisResults, dispatch]);
  
  // Reset highlighting when function changes
  useEffect(() => {
    clearHighlighting();
  }, [selectedFunction?.id, clearHighlighting]);
  
  return {
    crossHighlighting,
    syncScrolling,
    setSyncScrolling,
    handleAssemblyLineSelect,
    handleTranslationSectionSelect,
    clearHighlighting,
    handleSyncScroll,
    updateHighlighting: debouncedUpdateHighlighting,
  };
};

// Helper functions for cross-reference mapping
const findCorrespondingSections = ({
  address,
  instruction,
  functionTranslation,
  crossReferences,
}: {
  address: string;
  instruction: string;
  functionTranslation?: FunctionTranslation;
  crossReferences?: CrossReferenceData;
}) => {
  if (!functionTranslation || !crossReferences) return [];
  
  // Use cross-reference data to find related translation sections
  const matches = crossReferences.assemblyToTranslation[address] || [];
  
  return matches
    .map(matchId => functionTranslation.sections.find(section => section.id === matchId))
    .filter((section): section is TranslationSection => section !== undefined);
};

const findCorrespondingAssemblyLines = ({
  sectionId,
  textRange,
  functionInfo,
  crossReferences,
}: {
  sectionId: string;
  textRange: { start: number; end: number };
  functionInfo: FunctionInfo;
  crossReferences?: CrossReferenceData;
}) => {
  if (!crossReferences) return [];
  
  // Use cross-reference data to find related assembly lines
  const matches = crossReferences.translationToAssembly[sectionId] || [];
  
  return matches
    .map(address => 
      functionInfo.assemblyLines.find(line => line.address === address)
    )
    .filter((line): line is AssemblyLine => line !== undefined)
    .map((line, index) => ({
      ...line,
      lineNumber: functionInfo.assemblyLines.indexOf(line),
    }));
};

const calculateCorrespondingScrollPosition = ({
  sourcePane,
  scrollPosition,
  visibleRange,
  functionInfo,
  crossReferences,
}: {
  sourcePane: 'assembly' | 'translation';
  scrollPosition: number;
  visibleRange: { start: number; end: number };
  functionInfo: FunctionInfo;
  crossReferences?: CrossReferenceData;
}) => {
  // This is a complex calculation that would map scroll positions
  // between assembly and translation panes based on content correlation
  // Implementation would depend on the specific cross-reference data structure
  return null; // Placeholder
};
```

## API Implementation Strategy

### RTK Query Results API

**resultsApi.ts - Analysis Results Integration:**
```typescript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  AnalysisResults,
  JobStatusResponse,
  SearchRequest,
  SearchResults,
  ExportRequest,
  ExportResponse,
} from '../types/AnalysisResults.types';

export const resultsApi = createApi({
  reducerPath: 'resultsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/v1',
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['AnalysisResults', 'SearchResults'],
  endpoints: (builder) => ({
    
    // Get analysis results from completed job
    getAnalysisResults: builder.query<AnalysisResults, string>({
      query: (jobId) => `/decompile/${jobId}`,
      transformResponse: (response: JobStatusResponse): AnalysisResults => {
        // Transform job status response to analysis results format
        if (response.status !== 'completed' || !response.results) {
          throw new Error('Analysis results not available - job not completed');
        }
        
        return {
          jobId: response.job_id,
          metadata: {
            fileName: response.file_info.name,
            fileSize: response.file_info.size,
            fileFormat: response.file_info.format,
            processedAt: response.updated_at,
            processingDuration: calculateProcessingDuration(response.created_at, response.updated_at),
            configuration: response.configuration,
          },
          
          // Transform decompilation results
          decompilation: {
            functionCount: response.results.function_count,
            importCount: response.results.import_count,
            stringCount: response.results.string_count,
            
            functions: transformDecompiledFunctions(response.results.decompilation_data.functions),
            assemblyCode: response.results.decompilation_data.assembly_code,
            imports: response.results.decompilation_data.imports,
            strings: response.results.decompilation_data.strings,
            
            // Build cross-reference mapping
            crossReferences: buildCrossReferenceMapping(
              response.results.decompilation_data,
              response.results.llm_translations
            ),
          },
          
          // Transform LLM translation results
          translation: response.results.llm_translations ? {
            overallSummary: response.results.llm_translations.summary,
            confidenceScore: response.results.llm_translations.confidence_score,
            functions: response.results.llm_translations.functions,
            
            // Process translation sections for cross-referencing
            processedSections: processTranslationSections(
              response.results.llm_translations.functions
            ),
          } : undefined,
          
          // Performance metrics for optimization
          performanceMetrics: {
            estimatedRenderComplexity: calculateRenderComplexity(response.results),
            recommendedVirtualization: response.results.function_count > 100,
            searchIndexSize: estimateSearchIndexSize(response.results),
            memoryEstimate: estimateMemoryUsage(response.results),
          },
        };
      },
      providesTags: (result, error, jobId) => [
        { type: 'AnalysisResults', id: jobId }
      ],
      // Keep results cached for 30 minutes
      keepUnusedDataFor: 1800,
    }),
    
    // Search within analysis results (hybrid client/server approach)
    searchAnalysisContent: builder.query<SearchResults, SearchRequest>({
      query: (searchRequest) => ({
        url: `/analysis/${searchRequest.jobId}/search`,
        method: 'POST',
        body: {
          query: searchRequest.query,
          scope: searchRequest.scope,
          options: searchRequest.options,
        },
      }),
      // Short cache for search results
      keepUnusedDataFor: 300,
      providesTags: (result, error, request) => [
        { type: 'SearchResults', id: `${request.jobId}-${request.query}` }
      ],
    }),
    
    // Export analysis results with user selections
    exportAnalysisResults: builder.mutation<ExportResponse, ExportRequest>({
      query: (exportRequest) => ({
        url: `/analysis/${exportRequest.jobId}/export`,
        method: 'POST',
        body: exportRequest,
      }),
    }),
    
    // Background search index building (for large analyses)
    buildSearchIndex: builder.mutation<{ indexId: string }, { jobId: string }>({
      query: ({ jobId }) => ({
        url: `/analysis/${jobId}/build-index`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, { jobId }) => [
        { type: 'SearchResults', id: `${jobId}-*` }
      ],
    }),
    
  }),
});

export const {
  useGetAnalysisResultsQuery,
  useSearchAnalysisContentQuery,
  useSearchAnalysisContentLazyQuery,
  useExportAnalysisResultsMutation,
  useBuildSearchIndexMutation,
} = resultsApi;

// Transform helper functions
const transformDecompiledFunctions = (functions: any[]): FunctionInfo[] => {
  return functions.map((func, index) => ({
    id: func.address || `func_${index}`,
    name: func.name || `sub_${func.address}`,
    address: func.address,
    size: func.size || 0,
    complexity: func.complexity || 1,
    calls: func.calls || [],
    callers: func.callers || [],
    parameters: func.parameters || [],
    returnType: func.return_type || 'void',
    assemblyLines: func.assembly_lines || [],
    metadata: {
      isLibraryFunction: func.is_library_function || false,
      isEntryPoint: func.is_entry_point || false,
      hasLoops: func.has_loops || false,
      riskLevel: func.risk_level || 'low',
    },
  }));
};

const buildCrossReferenceMapping = (
  decompilationData: any,
  translationData?: any
): CrossReferenceMapping => {
  // Build mapping between assembly addresses and translation sections
  const assemblyToTranslation: Record<string, string[]> = {};
  const translationToAssembly: Record<string, string[]> = {};
  
  if (!translationData) {
    return { assemblyToTranslation, translationToAssembly };
  }
  
  // Process each translated function
  translationData.functions?.forEach((translatedFunction: any) => {
    translatedFunction.sections?.forEach((section: any) => {
      // Map section to corresponding assembly addresses
      section.referenced_addresses?.forEach((address: string) => {
        if (!assemblyToTranslation[address]) {
          assemblyToTranslation[address] = [];
        }
        assemblyToTranslation[address].push(section.id);
        
        if (!translationToAssembly[section.id]) {
          translationToAssembly[section.id] = [];
        }
        translationToAssembly[section.id].push(address);
      });
    });
  });
  
  return { assemblyToTranslation, translationToAssembly };
};

const calculateProcessingDuration = (createdAt: string, updatedAt: string): number => {
  return new Date(updatedAt).getTime() - new Date(createdAt).getTime();
};

const calculateRenderComplexity = (results: any): number => {
  // Estimate render complexity based on content size
  const functionCount = results.function_count || 0;
  const assemblyLines = results.decompilation_data?.assembly_code?.length || 0;
  const translationSize = results.llm_translations?.functions?.length || 0;
  
  return Math.log10(functionCount * 10 + assemblyLines + translationSize * 5);
};

const estimateSearchIndexSize = (results: any): number => {
  // Estimate search index size in KB
  const textSize = JSON.stringify(results).length;
  return Math.ceil(textSize * 0.3 / 1024); // Approximate 30% overhead
};

const estimateMemoryUsage = (results: any): number => {
  // Estimate memory usage in MB
  const dataSize = JSON.stringify(results).length;
  return Math.ceil(dataSize * 2 / (1024 * 1024)); // 2x overhead for processing
};
```

## State Management Integration

### Results Exploration Redux Slice

**resultsExplorationSlice.ts - Comprehensive State Management:**
```typescript
import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../store/store';
import type {
  AnalysisResults,
  FunctionInfo,
  ExplorationViewConfig,
  NavigationState,
  CrossHighlightingState,
  BookmarkInfo,
  SearchState,
  PerformanceMetrics,
} from '../types/AnalysisResults.types';

interface ResultsExplorationState {
  // Current analysis results
  currentResults: AnalysisResults | null;
  
  // Navigation state
  navigation: {
    selectedFunction: FunctionInfo | null;
    functionHistory: string[]; // Function IDs
    currentHistoryIndex: number;
    breadcrumbs: BreadcrumbItem[];
    
    // View state
    viewConfig: ExplorationViewConfig;
    paneSizes: { functionTree: number; assembly: number; translation: number };
    
    // Scroll positions for session persistence
    scrollPositions: {
      functionTree: number;
      assembly: number;
      translation: number;
    };
  };
  
  // Cross-pane highlighting and synchronization
  highlighting: {
    crossHighlighting: CrossHighlightingState;
    syncScrolling: boolean;
    highlightMode: 'automatic' | 'manual' | 'disabled';
  };
  
  // Search state
  search: {
    query: string;
    scope: 'all' | 'assembly' | 'translation' | 'functions';
    results: SearchMatch[];
    isSearching: boolean;
    searchHistory: string[];
    activeResultIndex: number;
    
    // Client-side search index
    searchIndex: SearchIndex | null;
    indexBuilding: boolean;
    indexLastBuilt: string | null;
  };
  
  // User interactions
  interaction: {
    bookmarks: Record<string, BookmarkInfo>; // functionId -> bookmark
    annotations: Record<string, AnnotationInfo>; // location -> annotation
    selections: {
      assembly: TextSelection[];
      translation: TextSelection[];
    };
    
    // Recent activity
    recentFunctions: string[]; // Recently viewed function IDs
    sessionStartTime: string;
    totalViewTime: number;
  };
  
  // Performance and optimization
  performance: {
    metrics: PerformanceMetrics;
    virtualScrolling: {
      enabled: boolean;
      itemHeight: number;
      overscanCount: number;
      renderWindowSize: number;
    };
    memoryUsage: {
      estimated: number;
      threshold: number;
      cleanupNeeded: boolean;
    };
  };
  
  // UI state
  ui: {
    loading: boolean;
    error: string | null;
    
    // Panel visibility
    panels: {
      functionTree: boolean;
      assembly: boolean;
      translation: boolean;
      search: boolean;
      bookmarks: boolean;
    };
    
    // Layout preferences
    layout: 'horizontal' | 'vertical' | 'tabbed';
    density: 'compact' | 'comfortable' | 'spacious';
    theme: 'light' | 'dark' | 'auto';
  };
}

const initialState: ResultsExplorationState = {
  currentResults: null,
  
  navigation: {
    selectedFunction: null,
    functionHistory: [],
    currentHistoryIndex: -1,
    breadcrumbs: [],
    viewConfig: {
      showAddresses: true,
      showLineNumbers: true,
      showCrossReferences: true,
      syntaxHighlighting: true,
      showFunctionMetadata: true,
    },
    paneSizes: { functionTree: 300, assembly: 500, translation: 400 },
    scrollPositions: { functionTree: 0, assembly: 0, translation: 0 },
  },
  
  highlighting: {
    crossHighlighting: {
      assemblyHighlights: [],
      translationHighlights: [],
      currentSync: null,
      scrollToLine: undefined,
    },
    syncScrolling: false,
    highlightMode: 'automatic',
  },
  
  search: {
    query: '',
    scope: 'all',
    results: [],
    isSearching: false,
    searchHistory: [],
    activeResultIndex: -1,
    searchIndex: null,
    indexBuilding: false,
    indexLastBuilt: null,
  },
  
  interaction: {
    bookmarks: {},
    annotations: {},
    selections: { assembly: [], translation: [] },
    recentFunctions: [],
    sessionStartTime: new Date().toISOString(),
    totalViewTime: 0,
  },
  
  performance: {
    metrics: {
      renderTime: 0,
      virtualScrollItems: 0,
      memoryUsage: 0,
      lastOptimization: Date.now(),
      searchPerformance: { averageQueryTime: 0, indexSize: 0 },
    },
    virtualScrolling: {
      enabled: true,
      itemHeight: 24,
      overscanCount: 10,
      renderWindowSize: 100,
    },
    memoryUsage: {
      estimated: 0,
      threshold: 100, // MB
      cleanupNeeded: false,
    },
  },
  
  ui: {
    loading: false,
    error: null,
    panels: {
      functionTree: true,
      assembly: true,
      translation: true,
      search: false,
      bookmarks: false,
    },
    layout: 'horizontal',
    density: 'comfortable',
    theme: 'auto',
  },
};

const resultsExplorationSlice = createSlice({
  name: 'resultsExploration',
  initialState,
  reducers: {
    // Analysis results management
    setAnalysisResults: (state, action: PayloadAction<AnalysisResults>) => {
      state.currentResults = action.payload;
      state.ui.loading = false;
      state.ui.error = null;
      
      // Reset navigation for new results
      state.navigation.selectedFunction = null;
      state.navigation.functionHistory = [];
      state.navigation.currentHistoryIndex = -1;
      state.navigation.breadcrumbs = [];
      
      // Update performance metrics
      state.performance.memoryUsage.estimated = action.payload.performanceMetrics?.memoryEstimate || 0;
      state.performance.virtualScrolling.enabled = action.payload.performanceMetrics?.recommendedVirtualization || false;
    },
    
    // Navigation actions
    selectFunction: (state, action: PayloadAction<{ functionId: string; addToHistory?: boolean }>) => {
      const { functionId, addToHistory = true } = action.payload;
      const func = state.currentResults?.decompilation.functions.find(f => f.id === functionId);
      
      if (func) {
        state.navigation.selectedFunction = func;
        
        if (addToHistory) {
          // Add to history
          state.navigation.functionHistory = state.navigation.functionHistory.slice(0, state.navigation.currentHistoryIndex + 1);
          state.navigation.functionHistory.push(functionId);
          state.navigation.currentHistoryIndex = state.navigation.functionHistory.length - 1;
          
          // Update recent functions
          state.interaction.recentFunctions = [
            functionId,
            ...state.interaction.recentFunctions.filter(id => id !== functionId)
          ].slice(0, 20);
        }
        
        // Update breadcrumbs
        state.navigation.breadcrumbs = [
          { label: 'Functions', path: '/' },
          { label: func.name, path: `/function/${functionId}` },
        ];
        
        // Clear cross-highlighting when switching functions
        state.highlighting.crossHighlighting = {
          assemblyHighlights: [],
          translationHighlights: [],
          currentSync: null,
          scrollToLine: undefined,
        };
      }
    },
    
    navigateHistory: (state, action: PayloadAction<'back' | 'forward'>) => {
      const direction = action.payload;
      let newIndex = state.navigation.currentHistoryIndex;
      
      if (direction === 'back' && newIndex > 0) {
        newIndex--;
      } else if (direction === 'forward' && newIndex < state.navigation.functionHistory.length - 1) {
        newIndex++;
      }
      
      if (newIndex !== state.navigation.currentHistoryIndex) {
        state.navigation.currentHistoryIndex = newIndex;
        const functionId = state.navigation.functionHistory[newIndex];
        const func = state.currentResults?.decompilation.functions.find(f => f.id === functionId);
        if (func) {
          state.navigation.selectedFunction = func;
        }
      }
    },
    
    // Cross-highlighting actions
    setCurrentCrossHighlighting: (state, action: PayloadAction<{
      selectedLineNumber?: number;
      selectedAddress?: string;
      correspondingSections?: string[];
      selectedSectionId?: string;
      selectedTextRange?: { start: number; end: number };
      correspondingLines?: number[];
    }>) => {
      const {
        selectedLineNumber,
        selectedAddress,
        correspondingSections = [],
        selectedSectionId,
        selectedTextRange,
        correspondingLines = [],
      } = action.payload;
      
      state.highlighting.crossHighlighting = {
        assemblyHighlights: selectedLineNumber !== undefined ? [selectedLineNumber, ...correspondingLines] : correspondingLines,
        translationHighlights: selectedSectionId ? [selectedSectionId, ...correspondingSections] : correspondingSections,
        currentSync: {
          source: selectedLineNumber !== undefined ? 'assembly' : 'translation',
          sourceLocation: selectedLineNumber !== undefined ? 
            { lineNumber: selectedLineNumber, address: selectedAddress } : 
            { sectionId: selectedSectionId, textRange: selectedTextRange },
          targetLocations: selectedLineNumber !== undefined ?
            correspondingSections.map(id => ({ sectionId: id })) :
            correspondingLines.map(line => ({ lineNumber: line })),
        },
        scrollToLine: selectedLineNumber,
      };
    },
    
    clearCrossHighlighting: (state) => {
      state.highlighting.crossHighlighting = {
        assemblyHighlights: [],
        translationHighlights: [],
        currentSync: null,
        scrollToLine: undefined,
      };
    },
    
    setSyncScrolling: (state, action: PayloadAction<boolean>) => {
      state.highlighting.syncScrolling = action.payload;
    },
    
    // Search actions
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.search.query = action.payload;
      if (action.payload && !state.search.searchHistory.includes(action.payload)) {
        state.search.searchHistory = [action.payload, ...state.search.searchHistory.slice(0, 19)];
      }
    },
    
    setSearchResults: (state, action: PayloadAction<SearchMatch[]>) => {
      state.search.results = action.payload;
      state.search.isSearching = false;
      state.search.activeResultIndex = action.payload.length > 0 ? 0 : -1;
    },
    
    setSearchScope: (state, action: PayloadAction<'all' | 'assembly' | 'translation' | 'functions'>) => {
      state.search.scope = action.payload;
    },
    
    navigateSearchResults: (state, action: PayloadAction<'next' | 'previous'>) => {
      const direction = action.payload;
      const resultCount = state.search.results.length;
      
      if (resultCount === 0) return;
      
      if (direction === 'next') {
        state.search.activeResultIndex = (state.search.activeResultIndex + 1) % resultCount;
      } else {
        state.search.activeResultIndex = state.search.activeResultIndex > 0 ? 
          state.search.activeResultIndex - 1 : 
          resultCount - 1;
      }
    },
    
    startSearch: (state) => {
      state.search.isSearching = true;
    },
    
    // Bookmark and annotation actions
    addBookmark: (state, action: PayloadAction<{
      functionId: string;
      name?: string;
      description?: string;
      tags?: string[];
    }>) => {
      const { functionId, name, description, tags = [] } = action.payload;
      const func = state.currentResults?.decompilation.functions.find(f => f.id === functionId);
      
      if (func) {
        state.interaction.bookmarks[functionId] = {
          id: `bookmark_${Date.now()}`,
          functionId,
          functionName: func.name,
          name: name || func.name,
          description,
          tags,
          createdAt: new Date().toISOString(),
        };
      }
    },
    
    removeBookmark: (state, action: PayloadAction<string>) => {
      delete state.interaction.bookmarks[action.payload];
    },
    
    addAnnotation: (state, action: PayloadAction<{
      location: AnnotationLocation;
      content: string;
      type?: 'note' | 'warning' | 'highlight';
    }>) => {
      const { location, content, type = 'note' } = action.payload;
      const locationKey = `${location.functionId}_${location.lineNumber || location.sectionId}`;
      
      state.interaction.annotations[locationKey] = {
        id: `annotation_${Date.now()}`,
        location,
        content,
        type,
        createdAt: new Date().toISOString(),
      };
    },
    
    // UI and layout actions
    togglePanel: (state, action: PayloadAction<keyof typeof initialState.ui.panels>) => {
      const panel = action.payload;
      state.ui.panels[panel] = !state.ui.panels[panel];
    },
    
    setPaneSizes: (state, action: PayloadAction<Partial<typeof initialState.navigation.paneSizes>>) => {
      state.navigation.paneSizes = { ...state.navigation.paneSizes, ...action.payload };
    },
    
    setLayout: (state, action: PayloadAction<'horizontal' | 'vertical' | 'tabbed'>) => {
      state.ui.layout = action.payload;
    },
    
    updateScrollPosition: (state, action: PayloadAction<{
      pane: 'functionTree' | 'assembly' | 'translation';
      position: number;
    }>) => {
      const { pane, position } = action.payload;
      state.navigation.scrollPositions[pane] = position;
    },
    
    // Performance actions
    updatePerformanceMetrics: (state, action: PayloadAction<Partial<PerformanceMetrics>>) => {
      state.performance.metrics = { ...state.performance.metrics, ...action.payload };
      
      // Check if memory cleanup is needed
      if (state.performance.metrics.memoryUsage > state.performance.memoryUsage.threshold) {
        state.performance.memoryUsage.cleanupNeeded = true;
      }
    },
    
    triggerMemoryCleanup: (state) => {
      // Clear non-essential cached data
      state.search.searchHistory = state.search.searchHistory.slice(0, 5);
      state.interaction.recentFunctions = state.interaction.recentFunctions.slice(0, 10);
      state.performance.memoryUsage.cleanupNeeded = false;
      state.performance.metrics.lastOptimization = Date.now();
    },
    
    // Error handling
    setError: (state, action: PayloadAction<string>) => {
      state.ui.error = action.payload;
      state.ui.loading = false;
    },
    
    clearError: (state) => {
      state.ui.error = null;
    },
    
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.ui.loading = action.payload;
      if (!action.payload) {
        state.ui.error = null;
      }
    },
  },
});

export const {
  setAnalysisResults,
  selectFunction,
  navigateHistory,
  setCurrentCrossHighlighting,
  clearCrossHighlighting,
  setSyncScrolling,
  setSearchQuery,
  setSearchResults,
  setSearchScope,
  navigateSearchResults,
  startSearch,
  addBookmark,
  removeBookmark,
  addAnnotation,
  togglePanel,
  setPaneSizes,
  setLayout,
  updateScrollPosition,
  updatePerformanceMetrics,
  triggerMemoryCleanup,
  setError,
  clearError,
  setLoading,
} = resultsExplorationSlice.actions;

export const resultsExplorationReducer = resultsExplorationSlice.reducer;

// Selectors
export const selectResultsExplorationState = (state: RootState) => state.resultsExploration;
export const selectCurrentAnalysisResults = (state: RootState) => state.resultsExploration.currentResults;
export const selectSelectedFunction = (state: RootState) => state.resultsExploration.navigation.selectedFunction;
export const selectNavigationState = (state: RootState) => state.resultsExploration.navigation;
export const selectCrossHighlighting = (state: RootState) => state.resultsExploration.highlighting.crossHighlighting;
export const selectSearchState = (state: RootState) => state.resultsExploration.search;
export const selectBookmarks = (state: RootState) => state.resultsExploration.interaction.bookmarks;
export const selectPerformanceMetrics = (state: RootState) => state.resultsExploration.performance.metrics;

// Memoized selectors
export const selectFunctionTree = createSelector(
  [selectCurrentAnalysisResults],
  (results) => {
    if (!results) return [];
    
    // Build hierarchical function tree
    return results.decompilation.functions.map(func => ({
      ...func,
      children: func.calls.map(callId => 
        results.decompilation.functions.find(f => f.id === callId)
      ).filter(Boolean),
    }));
  }
);

export const selectSearchableContent = createSelector(
  [selectCurrentAnalysisResults],
  (results) => {
    if (!results) return null;
    
    // Flatten all searchable content
    const searchableData = {
      functions: results.decompilation.functions,
      assemblyCode: results.decompilation.functions.flatMap(f => 
        f.assemblyLines.map(line => ({
          ...line,
          functionId: f.id,
          functionName: f.name,
        }))
      ),
      translations: results.translation?.functions?.flatMap(f =>
        f.sections?.map(section => ({
          ...section,
          functionId: f.function_id,
          functionName: results.decompilation.functions.find(df => df.id === f.function_id)?.name,
        }))
      ) || [],
    };
    
    return searchableData;
  }
);

export const selectCanNavigateHistory = createSelector(
  [selectNavigationState],
  (navigation) => ({
    canGoBack: navigation.currentHistoryIndex > 0,
    canGoForward: navigation.currentHistoryIndex < navigation.functionHistory.length - 1,
  })
);

export const selectMemoryUsageStatus = createSelector(
  [state => state.resultsExploration.performance],
  (performance) => {
    const usage = performance.metrics.memoryUsage;
    const threshold = performance.memoryUsage.threshold;
    
    return {
      percentage: (usage / threshold) * 100,
      status: usage > threshold * 0.8 ? 'warning' : usage > threshold * 0.6 ? 'medium' : 'good',
      cleanupNeeded: performance.memoryUsage.cleanupNeeded,
    };
  }
);
```

## Performance Implementation Hints

### Virtual Scrolling Optimization

**virtualScrollingManager.ts - Performance Service:**
```typescript
export class VirtualScrollingManager {
  private static instance: VirtualScrollingManager;
  private itemHeightCache: Map<string, number> = new Map();
  private visibilityObserver: IntersectionObserver | null = null;
  private performanceMonitor: PerformanceMonitor;
  
  static getInstance(): VirtualScrollingManager {
    if (!this.instance) {
      this.instance = new VirtualScrollingManager();
    }
    return this.instance;
  }
  
  constructor() {
    this.performanceMonitor = new PerformanceMonitor();
    this.setupIntersectionObserver();
  }
  
  /**
   * Calculate optimal virtual scrolling parameters for assembly code
   */
  calculateOptimalParameters(content: AssemblyLine[], containerHeight: number): VirtualScrollingConfig {
    const itemCount = content.length;
    const averageItemHeight = this.calculateAverageItemHeight(content);
    const visibleItemCount = Math.ceil(containerHeight / averageItemHeight);
    
    // Adaptive overscan based on content complexity
    const complexity = this.assessContentComplexity(content);
    const overscanCount = this.calculateOptimalOverscan(complexity, visibleItemCount);
    
    return {
      itemCount,
      averageItemHeight,
      estimatedItemSize: averageItemHeight,
      visibleItemCount,
      overscanCount,
      windowSize: Math.min(visibleItemCount * 3, itemCount),
      
      // Performance optimizations
      useFixedHeight: this.shouldUseFixedHeight(content),
      enableScrollDebouncing: itemCount > 1000,
      renderBatchSize: Math.min(50, Math.ceil(visibleItemCount / 2)),
    };
  }
  
  /**
   * Dynamic item height calculation for variable-sized assembly lines
   */
  getItemHeight(index: number, content: AssemblyLine[]): number {
    const cacheKey = `${content[index].address}_${content[index].instruction.length}`;
    
    if (this.itemHeightCache.has(cacheKey)) {
      return this.itemHeightCache.get(cacheKey)!;
    }
    
    const line = content[index];
    let height = BASE_LINE_HEIGHT;
    
    // Adjust for instruction complexity
    if (line.instruction.length > 50) height += 4;
    if (line.comment) height += 2;
    if (line.isJumpTarget) height += 2;
    
    // Adjust for highlighting
    if (line.highlighted) height += 1;
    
    this.itemHeightCache.set(cacheKey, height);
    return height;
  }
  
  /**
   * Optimize rendering performance for large datasets
   */
  optimizeRenderingPerformance(
    virtualList: VariableSizeList,
    content: AssemblyLine[],
    performanceMetrics: PerformanceMetrics
  ): void {
    const { renderTime, memoryUsage } = performanceMetrics;
    
    // If render time is high, reduce overscan
    if (renderTime > 16) { // 16ms = 60fps threshold
      const currentOverscan = virtualList.props.overscanCount || 10;
      virtualList.resetAfterIndex(0, true);
      // Reduce overscan dynamically
    }
    
    // If memory usage is high, enable aggressive cleanup
    if (memoryUsage > 100) { // 100MB threshold
      this.triggerMemoryCleanup();
    }
    
    // Cache invalidation for better performance
    if (this.itemHeightCache.size > 1000) {
      this.cleanupHeightCache();
    }
  }
  
  /**
   * Background processing for search index building
   */
  async buildSearchIndexInBackground(
    content: AssemblyLine[],
    progressCallback?: (progress: number) => void
  ): Promise<SearchIndex> {
    return new Promise((resolve, reject) => {
      if (!window.Worker) {
        // Fallback to main thread
        resolve(this.buildSearchIndexSync(content));
        return;
      }
      
      const worker = new Worker('/workers/searchIndexWorker.js');
      
      worker.postMessage({
        type: 'BUILD_INDEX',
        content: content,
        options: {
          enableFuzzySearch: true,
          indexInstructions: true,
          indexComments: true,
          indexAddresses: true,
        },
      });
      
      worker.onmessage = (event) => {
        const { type, data, progress } = event.data;
        
        switch (type) {
          case 'PROGRESS':
            progressCallback?.(progress);
            break;
          case 'COMPLETE':
            worker.terminate();
            resolve(data);
            break;
          case 'ERROR':
            worker.terminate();
            reject(new Error(data.message));
            break;
        }
      };
      
      worker.onerror = (error) => {
        worker.terminate();
        reject(error);
      };
    });
  }
  
  /**
   * Memory management for extended analysis sessions
   */
  private triggerMemoryCleanup(): void {
    // Clear item height cache
    const cacheSize = this.itemHeightCache.size;
    if (cacheSize > 500) {
      const keysToDelete = Array.from(this.itemHeightCache.keys()).slice(0, cacheSize - 250);
      keysToDelete.forEach(key => this.itemHeightCache.delete(key));
    }
    
    // Suggest garbage collection if available
    if (window.gc && typeof window.gc === 'function') {
      window.gc();
    }
    
    // Clean up performance data
    this.performanceMonitor.clearOldMetrics();
  }
  
  private calculateAverageItemHeight(content: AssemblyLine[]): number {
    // Sample-based calculation for performance
    const sampleSize = Math.min(100, content.length);
    const sampledContent = content.slice(0, sampleSize);
    
    const totalHeight = sampledContent.reduce((sum, line, index) => {
      return sum + this.getItemHeight(index, sampledContent);
    }, 0);
    
    return totalHeight / sampleSize;
  }
  
  private assessContentComplexity(content: AssemblyLine[]): 'low' | 'medium' | 'high' {
    const sampleSize = Math.min(50, content.length);
    const sample = content.slice(0, sampleSize);
    
    const avgInstructionLength = sample.reduce((sum, line) => 
      sum + line.instruction.length, 0) / sampleSize;
    
    const hasComplexInstructions = sample.some(line => 
      line.instruction.includes('call') || 
      line.instruction.includes('jmp') ||
      line.instruction.length > 40
    );
    
    if (avgInstructionLength > 30 || hasComplexInstructions) return 'high';
    if (avgInstructionLength > 20) return 'medium';
    return 'low';
  }
  
  private calculateOptimalOverscan(
    complexity: 'low' | 'medium' | 'high',
    visibleItemCount: number
  ): number {
    const baseOverscan = {
      low: 5,
      medium: 10,
      high: 15,
    };
    
    return Math.min(baseOverscan[complexity], Math.floor(visibleItemCount * 0.5));
  }
  
  private shouldUseFixedHeight(content: AssemblyLine[]): boolean {
    // Use fixed height if most lines are uniform
    const sampleSize = Math.min(100, content.length);
    const sample = content.slice(0, sampleSize);
    
    const instructionLengths = sample.map(line => line.instruction.length);
    const avgLength = instructionLengths.reduce((a, b) => a + b, 0) / sampleSize;
    const variance = instructionLengths.reduce((sum, length) => 
      sum + Math.pow(length - avgLength, 2), 0) / sampleSize;
    
    return variance < 100; // Low variance indicates uniform content
  }
  
  private setupIntersectionObserver(): void {
    if (typeof IntersectionObserver === 'undefined') return;
    
    this.visibilityObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) {
            // Element is not visible, can be cleaned up
            const element = entry.target as HTMLElement;
            const index = element.dataset.index;
            if (index) {
              // Mark for cleanup
            }
          }
        });
      },
      { threshold: 0 }
    );
  }
  
  private buildSearchIndexSync(content: AssemblyLine[]): SearchIndex {
    // Synchronous fallback implementation
    const index: SearchIndex = {
      instructions: new Map(),
      addresses: new Map(),
      comments: new Map(),
      fullText: content.map(line => line.instruction.toLowerCase()).join(' '),
    };
    
    content.forEach((line, idx) => {
      // Index instructions
      const instruction = line.instruction.toLowerCase();
      if (!index.instructions.has(instruction)) {
        index.instructions.set(instruction, []);
      }
      index.instructions.get(instruction)!.push(idx);
      
      // Index addresses
      index.addresses.set(line.address.toLowerCase(), idx);
      
      // Index comments
      if (line.comment) {
        const comment = line.comment.toLowerCase();
        if (!index.comments.has(comment)) {
          index.comments.set(comment, []);
        }
        index.comments.get(comment)!.push(idx);
      }
    });
    
    return index;
  }
  
  private cleanupHeightCache(): void {
    // Keep only the most recently used entries
    const entries = Array.from(this.itemHeightCache.entries());
    this.itemHeightCache.clear();
    
    // Keep the last 500 entries
    entries.slice(-500).forEach(([key, value]) => {
      this.itemHeightCache.set(key, value);
    });
  }
}

// Performance monitoring utility
class PerformanceMonitor {
  private metrics: PerformanceEntry[] = [];
  private maxMetrics = 100;
  
  recordRenderTime(duration: number): void {
    this.metrics.push({
      name: 'render',
      entryType: 'measure',
      startTime: performance.now() - duration,
      duration,
    } as PerformanceEntry);
    
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }
  
  getAverageRenderTime(): number {
    const renderMetrics = this.metrics.filter(m => m.name === 'render');
    if (renderMetrics.length === 0) return 0;
    
    return renderMetrics.reduce((sum, m) => sum + m.duration, 0) / renderMetrics.length;
  }
  
  clearOldMetrics(): void {
    const cutoff = performance.now() - (5 * 60 * 1000); // 5 minutes ago
    this.metrics = this.metrics.filter(m => m.startTime > cutoff);
  }
}

// Constants
const BASE_LINE_HEIGHT = 24;
const PERFORMANCE_THRESHOLDS = {
  MAX_RENDER_TIME: 16, // 60fps
  MEMORY_WARNING: 100, // MB
  CLEANUP_THRESHOLD: 1000, // cached items
};

export const VIRTUAL_SCROLLING_CONSTANTS = {
  BASE_LINE_HEIGHT,
  PERFORMANCE_THRESHOLDS,
  DEFAULT_OVERSCAN: 10,
  MIN_VISIBLE_ITEMS: 20,
  MAX_CACHE_SIZE: 1000,
};
```

## Testing Implementation Approach

### Component Testing Strategy

**ResultsExplorer.test.tsx - Comprehensive Component Testing:**
```typescript
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

import { ResultsExplorer } from './ResultsExplorer';
import { resultsExplorationReducer } from '../../../store/slices/resultsExplorationSlice';
import { resultsApi } from '../services/resultsApi';
import type { AnalysisResults, FunctionInfo } from '../types/AnalysisResults.types';

// Mock data - large analysis results for performance testing
const createLargeAnalysisResults = (): AnalysisResults => ({
  jobId: 'test-job-123',
  metadata: {
    fileName: 'large_binary.exe',
    fileSize: 1024 * 1024, // 1MB
    fileFormat: 'PE32+',
    processedAt: new Date().toISOString(),
    processingDuration: 45000,
    configuration: { analysis_depth: 'detailed' },
  },
  decompilation: {
    functionCount: 1500, // Large number of functions
    importCount: 250,
    stringCount: 800,
    functions: Array.from({ length: 1500 }, (_, i) => createMockFunction(i)),
    assemblyCode: 'mock assembly code',
    imports: [],
    strings: [],
    crossReferences: {
      assemblyToTranslation: {},
      translationToAssembly: {},
    },
  },
  translation: {
    overallSummary: 'This is a complex binary with multiple components...',
    confidenceScore: 0.85,
    functions: Array.from({ length: 100 }, (_, i) => createMockTranslatedFunction(i)),
    processedSections: [],
  },
  performanceMetrics: {
    estimatedRenderComplexity: 7.2,
    recommendedVirtualization: true,
    searchIndexSize: 512, // KB
    memoryEstimate: 50, // MB
  },
});

const createMockFunction = (index: number): FunctionInfo => ({
  id: `func_${index}`,
  name: `function_${index}`,
  address: `0x${(0x400000 + index * 0x10).toString(16)}`,
  size: 50 + (index % 200),
  complexity: 1 + (index % 10),
  calls: [`func_${(index + 1) % 1500}`, `func_${(index + 2) % 1500}`],
  callers: [`func_${(index - 1 + 1500) % 1500}`],
  parameters: [],
  returnType: 'void',
  assemblyLines: Array.from({ length: 20 + (index % 50) }, (_, lineIdx) => ({
    address: `0x${(0x400000 + index * 0x10 + lineIdx * 4).toString(16)}`,
    instruction: `mov eax, ${lineIdx}`,
    bytes: '89 c0',
    comment: lineIdx % 5 === 0 ? `Comment for line ${lineIdx}` : undefined,
    highlighted: false,
    crossHighlighted: false,
    isJumpTarget: lineIdx % 10 === 0,
  })),
  metadata: {
    isLibraryFunction: index > 1000,
    isEntryPoint: index === 0,
    hasLoops: index % 3 === 0,
    riskLevel: index % 100 < 10 ? 'high' : index % 50 < 10 ? 'medium' : 'low',
  },
});

const createMockTranslatedFunction = (index: number) => ({
  function_id: `func_${index}`,
  summary: `This function performs operation ${index}...`,
  detailed_explanation: `Detailed explanation for function ${index}...`,
  sections: [
    {
      id: `section_${index}_0`,
      title: 'Function Overview',
      content: `Function ${index} overview content...`,
      referenced_addresses: [`0x${(0x400000 + index * 0x10).toString(16)}`],
      confidence: 0.9,
    },
    {
      id: `section_${index}_1`,
      title: 'Implementation Details',
      content: `Function ${index} implementation details...`,
      referenced_addresses: [`0x${(0x400000 + index * 0x10 + 8).toString(16)}`],
      confidence: 0.8,
    },
  ],
});

// MSW server for API mocking
const server = setupServer(
  rest.get('/api/v1/decompile/:jobId', (req, res, ctx) => {
    const { jobId } = req.params;
    
    return res(ctx.json({
      job_id: jobId,
      status: 'completed',
      created_at: new Date(Date.now() - 60000).toISOString(),
      updated_at: new Date().toISOString(),
      file_info: {
        name: 'test_binary.exe',
        size: 1024 * 1024,
        format: 'PE32+',
      },
      configuration: {
        analysis_depth: 'detailed',
        llm_provider: 'openai',
        translation_detail: 'detailed',
      },
      results: {
        function_count: 1500,
        import_count: 250,
        string_count: 800,
        decompilation_data: {
          assembly_code: 'mock assembly',
          functions: Array.from({ length: 1500 }, (_, i) => createMockFunction(i)),
          imports: [],
          strings: [],
        },
        llm_translations: {
          summary: 'Overall analysis summary...',
          confidence_score: 0.85,
          functions: Array.from({ length: 100 }, (_, i) => createMockTranslatedFunction(i)),
        },
      },
    }));
  }),

  rest.post('/api/v1/analysis/:jobId/search', (req, res, ctx) => {
    return res(ctx.json({
      totalMatches: 5,
      results: [
        {
          id: 'result_1',
          type: 'assembly',
          location: { functionId: 'func_0', lineNumber: 5 },
          content: 'mov eax, 5',
          highlights: [{ start: 0, end: 3 }],
        },
        {
          id: 'result_2',
          type: 'translation',
          location: { functionId: 'func_1', sectionId: 'section_1_0' },
          content: 'This function moves value 5...',
          highlights: [{ start: 25, end: 28 }],
        },
      ],
      processingTime: 15,
    }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Test store setup
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      resultsExploration: resultsExplorationReducer,
      [resultsApi.reducerPath]: resultsApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(resultsApi.middleware),
    preloadedState: initialState,
  });
};

// Test wrapper with ResizeObserver mock
const TestWrapper: React.FC<{ children: React.ReactNode; store?: any }> = ({
  children,
  store
}) => {
  const testStore = store || createTestStore();
  
  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
  
  return <Provider store={testStore}>{children}</Provider>;
};

describe('ResultsExplorer - Large Dataset Performance', () => {
  const mockJobId = 'test-job-123';
  const mockOnNavigateBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock virtual scrolling
    vi.mock('react-window', () => ({
      VariableSizeList: vi.fn(({ children, itemCount, itemSize, ...props }) => (
        <div data-testid="virtual-list" {...props}>
          {Array.from({ length: Math.min(itemCount, 20) }, (_, index) => 
            children({ index, style: {} })
          )}
        </div>
      )),
    }));
  });

  describe('Initial Loading and Performance', () => {
    it('should load large analysis results efficiently', async () => {
      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <ResultsExplorer
            jobId={mockJobId}
            onNavigateBack={mockOnNavigateBack}
          />
        </TestWrapper>
      );

      // Should show loading state initially
      expect(screen.getByText(/loading analysis results/i)).toBeInTheDocument();

      // Wait for results to load
      await waitFor(() => {
        expect(screen.getByText(/1500/)).toBeInTheDocument(); // Function count
      }, { timeout: 5000 });

      const loadTime = performance.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
    });

    it('should handle virtual scrolling for large function lists', async () => {
      render(
        <TestWrapper>
          <ResultsExplorer jobId={mockJobId} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
      });

      // Should not render all 1500 functions at once
      const functionElements = screen.queryAllByText(/function_\d+/);
      expect(functionElements.length).toBeLessThan(50); // Only visible items rendered
    });

    it('should display performance metrics in development mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <TestWrapper>
          <ResultsExplorer jobId={mockJobId} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('performance-monitor')).toBeInTheDocument();
      });

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Function Navigation Performance', () => {
    it('should navigate between functions quickly', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ResultsExplorer jobId={mockJobId} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('function_0')).toBeInTheDocument();
      });

      // Test function selection performance
      const startTime = performance.now();
      
      const functionTreeNode = screen.getByText('function_0');
      await user.click(functionTreeNode);

      // Should show assembly code quickly
      await waitFor(() => {
        expect(screen.getByText(/0x400000/)).toBeInTheDocument();
      });

      const navigationTime = performance.now() - startTime;
      expect(navigationTime).toBeLessThan(200); // Should navigate within 200ms
    });

    it('should maintain navigation history efficiently', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ResultsExplorer jobId={mockJobId} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('function_0')).toBeInTheDocument();
      });

      // Navigate through multiple functions
      for (let i = 0; i < 10; i++) {
        const functionNode = screen.getByText(`function_${i}`);
        await user.click(functionNode);
      }

      // Test back navigation
      const backButton = screen.getByRole('button', { name: /back/i });
      await user.click(backButton);

      // Should navigate back quickly
      await waitFor(() => {
        expect(screen.getByText('function_8')).toBeInTheDocument();
      });
    });
  });

  describe('Search Performance with Large Dataset', () => {
    it('should perform search across large dataset efficiently', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ResultsExplorer jobId={mockJobId} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('function_0')).toBeInTheDocument();
      });

      // Open search
      const searchButton = screen.getByRole('button', { name: /search/i });
      await user.click(searchButton);

      const searchInput = screen.getByRole('textbox', { name: /search/i });
      
      const startTime = performance.now();
      await user.type(searchInput, 'mov eax');

      // Should show search results quickly
      await waitFor(() => {
        expect(screen.getByText('5 results')).toBeInTheDocument();
      });

      const searchTime = performance.now() - startTime;
      expect(searchTime).toBeLessThan(500); // Should search within 500ms
    });

    it('should handle search result navigation efficiently', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ResultsExplorer jobId={mockJobId} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('function_0')).toBeInTheDocument();
      });

      // Perform search
      const searchButton = screen.getByRole('button', { name: /search/i });
      await user.click(searchButton);

      const searchInput = screen.getByRole('textbox', { name: /search/i });
      await user.type(searchInput, 'mov');

      await waitFor(() => {
        expect(screen.getByText(/results/i)).toBeInTheDocument();
      });

      // Navigate search results
      const nextResultButton = screen.getByRole('button', { name: /next result/i });
      
      const startTime = performance.now();
      await user.click(nextResultButton);

      // Should highlight next result quickly
      await waitFor(() => {
        expect(screen.getByTestId('highlighted-result')).toBeInTheDocument();
      });

      const navigationTime = performance.now() - startTime;
      expect(navigationTime).toBeLessThan(100);
    });
  });

  describe('Cross-Pane Synchronization Performance', () => {
    it('should synchronize highlighting between panes efficiently', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ResultsExplorer jobId={mockJobId} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('function_0')).toBeInTheDocument();
      });

      // Select function with translation
      const functionWithTranslation = screen.getByText('function_0');
      await user.click(functionWithTranslation);

      // Click on assembly line
      const startTime = performance.now();
      const assemblyLine = screen.getByText(/mov eax, 5/);
      await user.click(assemblyLine);

      // Should highlight corresponding translation quickly
      await waitFor(() => {
        expect(screen.getByTestId('cross-highlighted-section')).toBeInTheDocument();
      });

      const syncTime = performance.now() - startTime;
      expect(syncTime).toBeLessThan(150); // Should sync within 150ms
    });

    it('should handle synchronized scrolling without performance degradation', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ResultsExplorer jobId={mockJobId} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('function_0')).toBeInTheDocument();
      });

      // Enable synchronized scrolling
      const syncButton = screen.getByRole('button', { name: /sync scrolling/i });
      await user.click(syncButton);

      // Select large function
      const largeFunction = screen.getByText('function_100');
      await user.click(largeFunction);

      // Test scrolling performance
      const assemblyPane = screen.getByTestId('assembly-viewer');
      const startTime = performance.now();

      // Simulate scroll events
      fireEvent.scroll(assemblyPane, { target: { scrollY: 1000 } });

      // Should maintain 60fps (16ms per frame)
      const scrollTime = performance.now() - startTime;
      expect(scrollTime).toBeLessThan(16);
    });
  });

  describe('Memory Management', () => {
    it('should manage memory efficiently during extended usage', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ResultsExplorer jobId={mockJobId} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('function_0')).toBeInTheDocument();
      });

      // Simulate extended usage - navigate through many functions
      for (let i = 0; i < 50; i++) {
        const functionNode = screen.getByText(`function_${i * 10}`);
        await user.click(functionNode);
        
        // Wait for function to load
        await waitFor(() => {
          expect(screen.getByText(`0x${(0x400000 + i * 10 * 0x10).toString(16)}`)).toBeInTheDocument();
        });
      }

      // Memory cleanup should have been triggered
      const performanceMonitor = screen.queryByTestId('performance-monitor');
      if (performanceMonitor) {
        const memoryUsage = within(performanceMonitor).getByTestId('memory-usage');
        expect(memoryUsage).toBeInTheDocument();
        
        // Memory usage should be reasonable
        const memoryText = memoryUsage.textContent || '';
        const memoryValue = parseInt(memoryText.match(/\d+/)?.[0] || '0');
        expect(memoryValue).toBeLessThan(200); // Less than 200MB
      }
    });

    it('should trigger memory cleanup when threshold is exceeded', async () => {
      const storeWithHighMemoryUsage = createTestStore({
        resultsExploration: {
          performance: {
            memoryUsage: {
              estimated: 150, // Above threshold
              threshold: 100,
              cleanupNeeded: true,
            },
          },
        },
      });

      render(
        <TestWrapper store={storeWithHighMemoryUsage}>
          <ResultsExplorer jobId={mockJobId} />
        </TestWrapper>
      );

      await waitFor(() => {
        // Should show memory warning
        expect(screen.getByText(/memory usage high/i)).toBeInTheDocument();
      });

      // Cleanup should be triggered automatically
      await waitFor(() => {
        const cleanupButton = screen.queryByRole('button', { name: /cleanup/i });
        if (cleanupButton) {
          fireEvent.click(cleanupButton);
        }
      });
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle API errors gracefully', async () => {
      server.use(
        rest.get('/api/v1/decompile/:jobId', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({
            error: 'Internal server error',
          }));
        })
      );

      render(
        <TestWrapper>
          <ResultsExplorer jobId={mockJobId} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/unable to load analysis results/i)).toBeInTheDocument();
      });

      // Should provide retry option
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('should handle malformed analysis data gracefully', async () => {
      server.use(
        rest.get('/api/v1/decompile/:jobId', (req, res, ctx) => {
          return res(ctx.json({
            job_id: 'test-job-123',
            status: 'completed',
            results: {
              // Malformed data - missing required fields
              decompilation_data: {},
            },
          }));
        })
      );

      render(
        <TestWrapper>
          <ResultsExplorer jobId={mockJobId} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/error processing analysis results/i)).toBeInTheDocument();
      });

      // Should still show what data is available
      expect(screen.queryByText(/partial results available/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility and Usability', () => {
    it('should support keyboard navigation throughout the interface', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ResultsExplorer jobId={mockJobId} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('function_0')).toBeInTheDocument();
      });

      // Test tab navigation
      await user.tab(); // Function tree should be focusable
      await user.keyboard('{Enter}'); // Should select function
      
      await user.tab(); // Assembly viewer should be focusable
      await user.keyboard('{ArrowDown}'); // Should navigate lines
      
      await user.tab(); // Translation pane should be focusable
      
      // All major components should be keyboard accessible
      expect(screen.getByRole('tree')).toBeInTheDocument(); // Function tree
      expect(screen.getByRole('textbox', { name: /search/i })).toBeInTheDocument(); // Search
    });

    it('should provide proper ARIA labels and roles', async () => {
      render(
        <TestWrapper>
          <ResultsExplorer jobId={mockJobId} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('function_0')).toBeInTheDocument();
      });

      // Check for proper ARIA roles
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('tree')).toBeInTheDocument();
      expect(screen.getByRole('region', { name: /assembly code/i })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: /translation/i })).toBeInTheDocument();
    });
  });
});

// Performance benchmark helper
const measurePerformance = async (operation: () => Promise<void>): Promise<number> => {
  const startTime = performance.now();
  await operation();
  return performance.now() - startTime;
};
```

## Code Quality and Standards

### TypeScript Type System

**Comprehensive Type Definitions:**
```typescript
// AnalysisResults.types.ts - Complete Results Platform Types
export interface AnalysisResults {
  jobId: string;
  metadata: AnalysisMetadata;
  decompilation: DecompilationResults;
  translation?: TranslationResults;
  performanceMetrics: PerformanceMetrics;
}

export interface AnalysisMetadata {
  fileName: string;
  fileSize: number;
  fileFormat: string;
  processedAt: string;
  processingDuration: number;
  configuration: {
    analysis_depth: 'basic' | 'standard' | 'detailed';
    llm_provider?: string;
    llm_model?: string;
    translation_detail?: 'basic' | 'detailed';
  };
}

export interface DecompilationResults {
  functionCount: number;
  importCount: number;
  stringCount: number;
  functions: FunctionInfo[];
  assemblyCode: string;
  imports: ImportInfo[];
  strings: StringInfo[];
  crossReferences: CrossReferenceMapping;
}

export interface FunctionInfo {
  id: string;
  name: string;
  address: string;
  size: number;
  complexity: number;
  calls: string[];
  callers: string[];
  parameters: ParameterInfo[];
  returnType: string;
  assemblyLines: AssemblyLine[];
  translation?: FunctionTranslation;
  metadata: FunctionMetadata;
}

export interface AssemblyLine {
  address: string;
  instruction: string;
  bytes: string;
  comment?: string;
  highlighted: boolean;
  crossHighlighted: boolean;
  isJumpTarget: boolean;
  syntaxTokens?: SyntaxToken[];
}

export interface SyntaxToken {
  type: 'instruction' | 'register' | 'immediate' | 'address' | 'comment' | 'label';
  value: string;
  startOffset: number;
  endOffset: number;
  color?: string;
  tooltip?: string;
}

export interface TranslationResults {
  overallSummary: string;
  confidenceScore: number;
  functions: TranslatedFunction[];
  processedSections: ProcessedTranslationSection[];
}

export interface TranslatedFunction {
  function_id: string;
  summary: string;
  detailed_explanation: string;
  sections: TranslationSection[];
  confidence_metrics: {
    overall: number;
    technical_accuracy: number;
    completeness: number;
  };
}

export interface TranslationSection {
  id: string;
  title: string;
  content: string;
  referenced_addresses: string[];
  confidence: number;
  type: 'overview' | 'implementation' | 'security' | 'performance';
  expandable: boolean;
  expanded?: boolean;
}

// Navigation and UI Types
export interface ExplorationViewConfig {
  showAddresses: boolean;
  showLineNumbers: boolean;
  showCrossReferences: boolean;
  syntaxHighlighting: boolean;
  showFunctionMetadata: boolean;
  assemblyDisplayMode: 'compact' | 'detailed' | 'minimal';
  translationDisplayMode: 'summary' | 'detailed' | 'both';
}

export interface NavigationState {
  selectedFunction: FunctionInfo | null;
  functionHistory: string[];
  currentHistoryIndex: number;
  breadcrumbs: BreadcrumbItem[];
  viewConfig: ExplorationViewConfig;
  paneSizes: PaneSizes;
  scrollPositions: ScrollPositions;
}

export interface CrossHighlightingState {
  assemblyHighlights: number[];
  translationHighlights: string[];
  currentSync: CrossHighlightingSync | null;
  scrollToLine?: number;
}

export interface CrossHighlightingSync {
  source: 'assembly' | 'translation';
  sourceLocation: AssemblyLocation | TranslationLocation;
  targetLocations: (AssemblyLocation | TranslationLocation)[];
}

export interface AssemblyLocation {
  lineNumber: number;
  address: string;
}

export interface TranslationLocation {
  sectionId: string;
  textRange?: { start: number; end: number };
}

// Search Types
export interface SearchState {
  query: string;
  scope: SearchScope;
  results: SearchMatch[];
  isSearching: boolean;
  searchHistory: string[];
  activeResultIndex: number;
  searchIndex: SearchIndex | null;
  indexBuilding: boolean;
  indexLastBuilt: string | null;
}

export type SearchScope = 'all' | 'assembly' | 'translation' | 'functions' | 'comments' | 'addresses';

export interface SearchMatch {
  id: string;
  type: 'assembly' | 'translation' | 'function' | 'comment';
  location: SearchLocation;
  content: string;
  highlights: TextHighlight[];
  score: number;
  context?: string;
}

export interface SearchLocation {
  functionId: string;
  lineNumber?: number;
  sectionId?: string;
  address?: string;
}

export interface SearchIndex {
  instructions: Map<string, number[]>;
  addresses: Map<string, number>;
  comments: Map<string, number[]>;
  functions: Map<string, FunctionSearchInfo>;
  translations: Map<string, TranslationSearchInfo>;
  fullText: string;
  metadata: {
    size: number;
    buildTime: number;
    lastUpdated: string;
  };
}

// Performance Types
export interface PerformanceMetrics {
  renderTime: number;
  virtualScrollItems: number;
  memoryUsage: number;
  lastOptimization: number;
  searchPerformance: SearchPerformanceMetrics;
  crossHighlightingPerformance?: CrossHighlightingPerformance;
}

export interface SearchPerformanceMetrics {
  averageQueryTime: number;
  indexSize: number;
  cacheHitRate?: number;
  backgroundIndexingTime?: number;
}

export interface VirtualScrollingConfig {
  itemCount: number;
  averageItemHeight: number;
  estimatedItemSize: number;
  visibleItemCount: number;
  overscanCount: number;
  windowSize: number;
  useFixedHeight: boolean;
  enableScrollDebouncing: boolean;
  renderBatchSize: number;
}

// User Interaction Types
export interface BookmarkInfo {
  id: string;
  functionId: string;
  functionName: string;
  name: string;
  description?: string;
  tags: string[];
  createdAt: string;
  lastAccessed?: string;
  location?: {
    address?: string;
    lineNumber?: number;
    sectionId?: string;
  };
}

export interface AnnotationInfo {
  id: string;
  location: AnnotationLocation;
  content: string;
  type: 'note' | 'warning' | 'highlight' | 'question';
  createdAt: string;
  lastModified?: string;
  author?: string;
  tags?: string[];
}

export interface AnnotationLocation {
  functionId: string;
  address?: string;
  lineNumber?: number;
  sectionId?: string;
  textRange?: { start: number; end: number };
}

// Export Types
export interface ExportOptions {
  format: 'json' | 'html' | 'pdf' | 'csv' | 'markdown';
  scope: 'current_function' | 'selected_functions' | 'all_functions' | 'search_results';
  includeAssembly: boolean;
  includeTranslations: boolean;
  includeBookmarks: boolean;
  includeAnnotations: boolean;
  includeCrossReferences: boolean;
  customSections?: string[];
}

export interface ExportRequest {
  jobId: string;
  options: ExportOptions;
  selectedFunctions?: string[];
  bookmarks?: BookmarkInfo[];
  annotations?: AnnotationInfo[];
}

export interface ExportResponse {
  exportId: string;
  downloadUrl: string;
  expiresAt: string;
  fileSize: number;
  format: string;
}

// Error and Loading Types
export interface ResultsExplorationError {
  type: 'API_ERROR' | 'PARSING_ERROR' | 'PERFORMANCE_ERROR' | 'MEMORY_ERROR';
  message: string;
  details?: any;
  recoverable: boolean;
  retryAfter?: number;
}

export interface LoadingState {
  isLoading: boolean;
  loadingMessage?: string;
  progress?: number;
  operation?: 'INITIAL_LOAD' | 'FUNCTION_NAVIGATION' | 'SEARCH' | 'EXPORT';
}

// Component Prop Types
export interface ResultsExplorerProps {
  jobId: string;
  onNavigateBack?: () => void;
  initialViewConfig?: Partial<ExplorationViewConfig>;
  performanceMode?: 'auto' | 'high_performance' | 'memory_conservative';
}

export interface AssemblyViewerProps {
  functionInfo: FunctionInfo;
  searchResults?: SearchMatch[];
  crossHighlighting?: CrossHighlightingState;
  viewConfig: ExplorationViewConfig;
  onLineSelect?: (lineNumber: number, address: string, instruction: string) => void;
  onCrossReference?: (targetAddress: string) => void;
  onScrollPositionChange?: (position: number) => void;
}

export interface TranslationPaneProps {
  functionTranslation: FunctionTranslation | undefined;
  searchResults?: SearchMatch[];
  crossHighlighting?: CrossHighlightingState;
  viewConfig: ExplorationViewConfig;
  onSectionSelect?: (sectionId: string, textRange: { start: number; end: number }) => void;
  onExpandSection?: (sectionId: string, expanded: boolean) => void;
  onScrollPositionChange?: (position: number) => void;
}

export interface FunctionTreeProps {
  functions: FunctionInfo[];
  selectedFunction: FunctionInfo | null;
  searchQuery?: string;
  onFunctionSelect: (functionId: string) => void;
  onSearch?: (query: string) => void;
  virtualScrolling?: boolean;
  performanceMode?: boolean;
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type OptimizationType = 
  | 'CLEANUP_VIRTUAL_SCROLL'
  | 'REDUCE_SEARCH_INDEX'
  | 'COMPRESS_ANALYSIS_DATA'
  | 'MEMORY_GARBAGE_COLLECTION';

// Redux Action Types
export interface SetAnalysisResultsAction {
  type: 'resultsExploration/setAnalysisResults';
  payload: AnalysisResults;
}

export interface SelectFunctionAction {
  type: 'resultsExploration/selectFunction';
  payload: {
    functionId: string;
    addToHistory?: boolean;
  };
}

export interface SetCrossHighlightingAction {
  type: 'resultsExploration/setCurrentCrossHighlighting';
  payload: {
    selectedLineNumber?: number;
    selectedAddress?: string;
    correspondingSections?: string[];
    selectedSectionId?: string;
    selectedTextRange?: { start: number; end: number };
    correspondingLines?: number[];
  };
}

// Validation Schema Types
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}
```

---

## Implementation Summary

This Technical Implementation Document provides comprehensive guidance for implementing the Results Exploration Platform with the following key characteristics:

**Performance-Optimized Architecture:**
- Virtual scrolling with react-window for handling 1000+ functions efficiently
- Hybrid search architecture combining client-side indices with backend power
- Memory management with intelligent cleanup and LRU caching strategies
- Cross-pane synchronization with debounced highlighting updates

**Feature-Based Organization:**
- Complete feature structure in `/features/results-exploration/` with co-located components
- Comprehensive component hierarchy from main container to specialized display components
- Custom hooks for complex business logic extraction and performance optimization
- Web Workers for background processing of search indices and memory cleanup

**Advanced UI Capabilities:**
- Syntax-highlighted assembly code display with comprehensive token parsing
- Synchronized multi-pane interface with intelligent cross-highlighting
- Professional function tree navigation with search and filtering
- Session persistence with bookmark and annotation systems

**Quality and Testing:**
- Comprehensive TypeScript integration with strict typing for all components
- Performance testing with large dataset simulations
- Memory management testing and optimization verification
- Cross-browser accessibility compliance and keyboard navigation support

This implementation approach ensures the Results Exploration Platform delivers the performance and functionality required for professional binary analysis workflows while maintaining the architectural consistency established in the ADR and previous TID documents.

---

**Document Version:** 1.0  
**Last Updated:** 2025-08-31  
**Next Phase:** Multi-Provider LLM Integration TID (004_FTID|multi-provider-llm-integration.md)  
**Implementation Readiness:** Complete - Ready for task breakdown