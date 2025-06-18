# Technical Architecture Documentation

## System Overview

The Drone Image Quality Analyzer is a client-side web application built with React and TypeScript, designed to perform comprehensive image quality analysis for photogrammetric applications. The system processes images entirely in the browser using Canvas API and Web Workers for optimal performance.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Browser Environment                          │
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐ │
│  │   React UI      │    │  Analysis Core  │    │ Web Workers │ │
│  │                 │    │                 │    │             │ │
│  │ • FileUpload    │◄──►│ • Image Loading │◄──►│ • Parallel  │ │
│  │ • ProgressBar   │    │ • Blur Analysis │    │   Processing│ │
│  │ • ImageGrid     │    │ • Exposure Eval │    │ • Background│ │
│  │ • Results       │    │ • Noise Detect  │    │   Tasks     │ │
│  │ • Export        │    │ • Feature Ext.  │    │             │ │
│  └─────────────────┘    └─────────────────┘    └─────────────┘ │
│           │                       │                       │     │
│           ▼                       ▼                       ▼     │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐ │
│  │   State Mgmt    │    │  Canvas API     │    │ File System │ │
│  │                 │    │                 │    │             │ │
│  │ • React Hooks   │    │ • ImageData     │    │ • File API  │ │
│  │ • Local State   │    │ • 2D Context    │    │ • Blob API  │ │
│  │ • Derived State │    │ • Pixel Manip   │    │ • URL API   │ │
│  └─────────────────┘    └─────────────────┘    └─────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Core Algorithms

### 1. Blur Detection Algorithm

**Method**: Laplacian Variance
**Implementation**: `src/utils/imageProcessing.ts`

```typescript
// Simplified algorithm flow
1. Convert RGB to grayscale
2. Apply Laplacian kernel convolution
3. Calculate variance of Laplacian response
4. Normalize to 0-100 scale
```

**Mathematical Foundation**:
- Laplacian Kernel: `[[-1,-1,-1],[-1,8,-1],[-1,-1,-1]]`
- Variance: `σ² = Σ(xi - μ)² / N`
- Normalization: `score = min(100, max(0, log(σ² + 1) * 15))`

### 2. Exposure Analysis Algorithm

**Method**: Multi-metric Histogram Analysis
**Implementation**: `src/utils/enhancedExposureAnalysis.ts`

```typescript
// Algorithm components
1. RGB to YCrCb color space conversion
2. Histogram analysis (256 bins)
3. Dynamic range calculation (P5-P95)
4. Local contrast assessment
5. Spatial exposure variance
6. Perceptual quality scoring
```

**Key Metrics**:
- **Over/Under Exposure**: Percentage of pixels beyond thresholds
- **Dynamic Range**: P95 - P5 percentile values
- **Local Contrast**: 9x9 window variance analysis
- **Spatial Variance**: Regional exposure consistency

### 3. Feature Detection Algorithm

**Method**: Multi-detector Keypoint Extraction
**Implementation**: `src/utils/descriptorAnalysis.ts`

```typescript
// Detection pipeline
1. Harris Corner Detection
2. FAST Corner Detection  
3. Edge-based Keypoints (Sobel)
4. Blob Detection (LoG approximation)
5. Duplicate removal and ranking
6. Distribution analysis
```

**Quality Assessment**:
- **Keypoint Density**: Features per 1000 pixels
- **Distribution Uniformity**: Spatial distribution analysis
- **Feature Strength**: Response magnitude statistics
- **Matchability**: Predicted matching success rate

### 4. Noise Analysis Algorithm

**Method**: Multi-artifact Detection
**Implementation**: `src/utils/noiseAnalysis.ts`

```typescript
// Noise detection components
1. Local standard deviation (8x8 blocks)
2. Signal-to-noise ratio calculation
3. JPEG compression artifact detection
4. Chromatic aberration detection
5. Vignetting assessment
```

## Data Flow Architecture

### Processing Pipeline

```
File Input → Validation → Thumbnail → Metadata → Analysis → Scoring → Results
     ↓           ↓           ↓          ↓          ↓         ↓        ↓
   File API   Type Check   Canvas    EXIF      ImageData  Composite  Display
              Size Check   Resize    Extract   Processing  Score     Export
```

### State Management Flow

```
User Action → Component State → Analysis Pipeline → Result State → UI Update
     ↓              ↓                   ↓              ↓           ↓
  File Select   useState Hook     Image Processing   Analysis    Re-render
  Threshold     useCallback       Background Tasks   Results     Progress
  Filter        useMemo          Error Handling     Statistics   Export
```

### Memory Management

```
Image Loading → Canvas Creation → Analysis → Cleanup → Next Image
      ↓               ↓             ↓         ↓          ↓
   File Blob     ImageData      Processing  Dispose   GC Trigger
   Object URL    Pixel Array    Web Worker  Canvas    Memory Free
```

## Component Architecture

### Hierarchical Structure

```
App
├── Header
├── FileUpload
│   ├── DropZone
│   ├── FilePreview
│   └── ValidationFeedback
├── ProgressBar
│   ├── ProgressIndicator
│   ├── ETACalculator
│   └── StatusDisplay
├── QualitySettings
├── StatsOverview
│   └── MetricCards
├── QualityHistogram
├── ImageGrid
│   ├── ImageCard
│   ├── FilterControls
│   └── SortControls
├── TechnicalQualityPanel
│   ├── CollapsibleSection
│   ├── MetricDisplay
│   └── RecommendationPanel
└── ReportExport
    ├── CSVExport
    └── ReportGenerator
```

### Data Flow Between Components

```
App (Central State)
 ├── analyses: ImageAnalysis[]
 ├── progress: ProcessingProgress
 ├── threshold: number
 └── stats: AnalysisStats
      ↓
Component Props Distribution
 ├── FileUpload ← onFilesSelected
 ├── ProgressBar ← progress
 ├── ImageGrid ← analyses, threshold
 ├── StatsOverview ← stats
 └── ReportExport ← analyses, threshold
```

## Performance Optimizations

### 1. Image Processing Optimizations

- **Canvas Size Limiting**: Max 800px for analysis
- **Progressive Processing**: One image at a time
- **Memory Management**: Immediate cleanup after processing
- **Thumbnail Caching**: Efficient preview generation

### 2. UI Performance

- **React.memo**: Prevent unnecessary re-renders
- **useCallback**: Stable function references
- **useMemo**: Expensive calculation caching
- **Progressive Disclosure**: Lazy loading of detailed panels

### 3. Browser Optimizations

- **Web Workers**: Background processing (future enhancement)
- **RequestAnimationFrame**: Smooth progress updates
- **Blob URLs**: Efficient file handling
- **Canvas Reuse**: Minimize DOM manipulation

## Error Handling Strategy

### 1. File Processing Errors

```typescript
try {
  const analysis = await analyzeImage(file);
} catch (error) {
  return createErrorAnalysis(file, error);
}
```

### 2. Graceful Degradation

- **Thumbnail Failure**: Continue without preview
- **Metadata Failure**: Use default values
- **Analysis Failure**: Mark as unsuitable with error message

### 3. User Feedback

- **Progress Indicators**: Real-time status updates
- **Error Messages**: Clear, actionable feedback
- **Validation**: Immediate file type/size checking

## Security Considerations

### 1. Client-Side Processing

- **No Server Upload**: All processing in browser
- **Local File Access**: File API with user consent
- **Memory Isolation**: No persistent storage

### 2. Input Validation

- **File Type Checking**: MIME type validation
- **Size Limits**: 50MB per file maximum
- **Malformed Data**: Robust error handling

## Scalability Considerations

### 1. Performance Limits

- **Memory Usage**: ~100-200 images per session
- **Processing Time**: ~5 seconds per image
- **Browser Limits**: Canvas memory constraints

### 2. Future Enhancements

- **Web Workers**: Parallel processing
- **IndexedDB**: Local result caching
- **Service Workers**: Offline capability
- **WebAssembly**: Performance-critical algorithms

## Technology Integration

### 1. External Libraries

- **exifr**: EXIF metadata extraction
- **lucide-react**: Icon components
- **tailwindcss**: Utility-first styling

### 2. Browser APIs

- **File API**: File reading and validation
- **Canvas API**: Image processing and analysis
- **Blob API**: Data URL generation
- **URL API**: Object URL management

## Deployment Architecture

### 1. Static Hosting

```
Build Process → Static Assets → CDN Distribution
     ↓              ↓               ↓
   Vite Build    HTML/CSS/JS    Global Delivery
   Tree Shake    Asset Hash     Edge Caching
   Minification  Compression    Fast Loading
```

### 2. Browser Compatibility

- **Progressive Enhancement**: Core features work everywhere
- **Feature Detection**: Graceful fallbacks
- **Polyfills**: Minimal, targeted support

This architecture ensures optimal performance, maintainability, and user experience while handling the computational demands of image quality analysis in a browser environment.