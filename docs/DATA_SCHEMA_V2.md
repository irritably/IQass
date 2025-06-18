# Data Schema Documentation v2.0 - Drone Image Quality Analyzer

This document provides a comprehensive overview of the improved data types, structures, and metrics for the Drone Image Quality Analyzer, addressing consistency, clarity, and separation of concerns.

## Table of Contents

1. [Schema Improvements](#schema-improvements)
2. [Core Data Types](#core-data-types)
3. [Analysis Results](#analysis-results)
4. [Configuration & Thresholds](#configuration--thresholds)
5. [Processing State](#processing-state)
6. [UI State (Separated)](#ui-state-separated)
7. [Export Formats](#export-formats)
8. [Performance Metrics](#performance-metrics)
9. [Data Flow](#data-flow)

---

## Schema Improvements

### Fixed Issues from v1.0

1. **✅ Consistent Optional Field Notation**: Using `Type | null` instead of `Type?`
2. **✅ Reduced Verbosity**: Grouped related fields under nested objects
3. **✅ UI/Data Separation**: Moved UI state to separate interfaces
4. **✅ Configurable Thresholds**: Externalized hardcoded values to config objects
5. **✅ Clear Units**: Added explicit units and scales to all metrics
6. **✅ Composite Score Breakdown**: Added detailed scoring breakdown structure
7. **✅ Clarified Field Names**: Improved naming for better hierarchy and clarity

---

## Core Data Types

### File Input & Validation
```typescript
interface FileInput {
  file: File;                    // Original browser File object
  metadata: {
    name: string;                // Original filename
    size: number;                // File size in bytes
    type: string;                // MIME type (e.g., 'image/jpeg')
    lastModified: number;        // Unix timestamp
  };
  validation: {
    isValid: boolean;
    error: string | null;        // Error message if invalid
    constraints: {
      supportedTypes: string[];  // ['image/jpeg', 'image/png', 'image/tiff']
      maxSize: number;           // 52,428,800 bytes (50MB)
      minDimensions: { width: number; height: number }; // 100x100 px
    };
  };
}
```

### Image Processing Data
```typescript
interface ProcessedImageData {
  dimensions: {
    original: { width: number; height: number };        // Original image size
    processed: { width: number; height: number };       // Limited to 800px max
    aspectRatio: number;                                 // width/height ratio
  };
  thumbnail: {
    dataUrl: string;             // Base64 JPEG, 80% quality
    dimensions: { width: number; height: number };      // Max 150px
    fileSize: number;            // Thumbnail size in bytes
  };
  colorSpace: {
    detected: 'BT.601' | 'BT.709' | 'BT.2020' | 'unknown';
    recommended: 'BT.601' | 'BT.709' | 'BT.2020';
    conversionApplied: boolean;
  };
  processing: {
    resizeRatio: number;         // Scale factor applied (0-1)
    memoryUsage: number;         // Estimated memory usage in bytes
    processingTime: number;      // Time taken in milliseconds
  };
}
```

---

## Analysis Results

### Blur Analysis (Enhanced)
```typescript
interface BlurAnalysis {
  score: number;                 // 0-100 scale, higher = sharper
  metrics: {
    laplacianVariance: number;   // Raw variance value (0+)
    normalizedVariance: number;  // Log-normalized value (0+)
    sceneAdaptation: {
      sceneType: 'aerial_sky' | 'ground_detail' | 'mixed';
      normalizationFactor: number; // 12-18 range
      adaptiveScore: number;     // Scene-adjusted score (0-100)
    };
  };
  algorithm: {
    method: 'laplacian_single' | 'laplacian_multi_kernel';
    kernelsUsed: string[];       // ['standard', 'cross', 'sobel']
    processingMode: 'cpu' | 'webgl';
  };
  quality: {
    classification: 'excellent' | 'good' | 'acceptable' | 'poor' | 'unsuitable';
    confidence: number;          // 0-100, algorithm confidence
    recommendation: string;      // Human-readable recommendation
  };
}
```

### Exposure Analysis (Restructured)
```typescript
interface ExposureAnalysis {
  score: number;                 // 0-100 composite exposure quality
  histogram: {
    overexposure: {
      percentage: number;        // 0-100%, pixels > threshold
      threshold: number;         // 245-250 (adaptive)
      affectedAreas: 'sky' | 'highlights' | 'mixed' | null;
    };
    underexposure: {
      percentage: number;        // 0-100%, pixels < threshold  
      threshold: number;         // 5-15 (adaptive)
      affectedAreas: 'shadows' | 'foreground' | 'mixed' | null;
    };
    distribution: {
      shadows: number;           // 0-100%, pixels in 0-85 range
      midtones: number;          // 0-100%, pixels in 85-170 range
      highlights: number;        // 0-100%, pixels in 170-255 range
      balance: 'balanced' | 'underexposed' | 'overexposed' | 'high-contrast';
    };
  };
  dynamicRange: {
    value: number;               // 0-255, P95 - P5 percentile range
    percentiles: {
      p5: number;                // 5th percentile brightness (0-255)
      p95: number;               // 95th percentile brightness (0-255)
    };
    quality: 'excellent' | 'good' | 'limited' | 'poor';
  };
  spatial: {
    localContrast: number;       // 0-100, 9x9 window variance analysis
    highlightRecovery: number;   // 0-100%, recoverable highlight detail
    shadowDetail: number;       // 0-100%, shadow detail retention
    exposureVariance: number;    // 0+, regional exposure consistency
  };
  colorBalance: {
    luminance: number;           // 0-1, average Y channel value
    chrominance: {
      red: number;               // 0-1, average Cr channel value
      blue: number;              // 0-1, average Cb channel value
    };
    whitePoint: {
      estimated: number;         // 0-255, estimated white point
      deviation: number;         // 0-100, deviation from standard
    };
  };
  perceptual: {
    score: number;               // 0-100, human vision-weighted assessment
    factors: {
      midtoneDistribution: number; // 0-100, proper midtone percentage
      contrastQuality: number;   // 0-100, optimal contrast assessment
      clippingPenalty: number;   // 0-100, penalty for extreme clipping
    };
  };
}
```

### Feature Detection (Hierarchical)
```typescript
interface FeatureAnalysis {
  detection: {
    keypoints: {
      total: number;             // Total detected features (0+)
      density: number;           // Features per 1000 pixels (0+)
      byType: {
        corners: number;         // Harris + FAST detection (0+)
        edges: number;           // Sobel edge detection (0+)
        blobs: number;           // LoG approximation (0+)
        textured: number;        // High-frequency content (0+)
      };
    };
    distribution: {
      spatial: {
        uniformity: number;      // 0-100%, inverse coefficient of variation
        coverage: number;        // 0-100%, percentage of non-empty grid cells
        clustering: number;      // 0-100, nearest neighbor distance analysis
      };
      quality: {
        average: number;         // 0+, mean feature strength
        median: number;          // 0+, median feature strength
        standardDeviation: number; // 0+, strength consistency
        strengthDistribution: number[]; // Histogram of strength values
      };
    };
  };
  descriptor: {
    quality: {
      distinctiveness: number;   // 0-100, feature uniqueness via local contrast
      repeatability: number;     // 0-100, detection consistency
      matchability: number;      // 0-100, predicted matching success rate
    };
    invariance: {
      scale: number;             // 0-100%, scale robustness
      rotation: number;          // 0-100%, rotation robustness
      illumination: number;      // 0-100%, lighting robustness
    };
    photogrammetric: {
      score: number;             // 0-100, overall 3D reconstruction suitability
      suitability: 'excellent' | 'good' | 'acceptable' | 'poor' | 'unsuitable';
      factors: {
        densityScore: number;    // 0-100, optimal feature density
        distributionScore: number; // 0-100, spatial distribution quality
        strengthScore: number;   // 0-100, feature strength quality
        matchingPotential: number; // 0-100, predicted matching success
      };
    };
  };
}
```

### Noise Analysis (Detailed)
```typescript
interface NoiseAnalysis {
  score: number;                 // 0-100, overall noise quality (higher = less noise)
  measurements: {
    level: number;               // 0-100, noise magnitude via local std dev
    snr: number;                 // 0+, signal-to-noise ratio (higher = better)
    distribution: {
      uniform: number;           // 0-100, spatial noise uniformity
      frequency: 'low' | 'medium' | 'high' | 'mixed'; // Dominant noise frequency
    };
  };
  artifacts: {
    compression: {
      score: number;             // 0-100, JPEG blocking artifacts
      blockingVisible: boolean;  // Visible 8x8 block boundaries
      severity: 'none' | 'mild' | 'moderate' | 'severe';
    };
    chromatic: {
      score: number;             // 0-100, color fringing at edges
      fringeWidth: number;       // 0+, average fringe width in pixels
      affectedEdges: number;     // 0-100%, percentage of edges affected
    };
    optical: {
      vignetting: number;        // 0-100%, corner darkening
      distortion: number;        // 0-100, barrel/pincushion distortion
      aberration: number;        // 0-100, overall optical aberration
    };
  };
  assessment: {
    overallArtifactScore: number; // 0-100, combined artifact penalty
    reconstructionImpact: 'minimal' | 'low' | 'moderate' | 'high' | 'severe';
    recommendations: string[];   // Specific improvement suggestions
  };
}
```

---

## Configuration & Thresholds

### Quality Thresholds (Configurable)
```typescript
interface QualityThresholds {
  blur: {
    excellent: number;           // 85+ (default)
    good: number;                // 70-84 (default)
    acceptable: number;          // 55-69 (default)
    poor: number;                // 40-54 (default)
    unsuitable: number;          // <40 (default)
  };
  exposure: {
    overexposureLimit: number;   // 5% (default, adaptive 3-10%)
    underexposureLimit: number;  // 5% (default, adaptive 3-15%)
    dynamicRangeMin: number;     // 120 (default, adaptive 60-150)
  };
  noise: {
    acceptableLevel: number;     // 20 (default, 0-100 scale)
    snrMinimum: number;          // 10 (default, ratio)
    artifactTolerance: number;   // 15 (default, 0-100 scale)
  };
  features: {
    minimumCount: number;        // 100 (default)
    densityMinimum: number;      // 0.5 per 1000px (default)
    distributionMinimum: number; // 50% uniformity (default)
  };
  composite: {
    weights: {
      blur: number;              // 0.30 (default)
      exposure: number;          // 0.25 (default)
      noise: number;             // 0.20 (default)
      technical: number;         // 0.10 (default)
      descriptor: number;        // 0.15 (default)
    };
    photogrammetricWeights: {
      descriptor: number;        // 0.40 (specialized for 3D)
      blur: number;              // 0.30
      exposure: number;          // 0.20
      noise: number;             // 0.10
    };
  };
}
```

### Scene-Adaptive Configuration
```typescript
interface SceneConfiguration {
  sceneType: 'aerial_sky' | 'ground_detail' | 'mixed' | 'auto';
  adaptiveThresholds: {
    blur: {
      normalizationFactor: number; // 12-18 based on scene
      sceneExpectation: 'high' | 'medium' | 'low';
    };
    exposure: {
      overexposureThreshold: number; // 240-250 adaptive
      underexposureThreshold: number; // 5-15 adaptive
      skyTolerance: number;      // 0-50% for aerial images
    };
    features: {
      densityExpectation: number; // Lower for sky, higher for ground
      uniformityRequirement: number; // Relaxed for aerial
    };
  };
  metadata: {
    altitude: number | null;     // GPS altitude in meters
    cameraType: 'drone' | 'handheld' | 'unknown';
    detectionConfidence: number; // 0-100% scene detection confidence
  };
}
```

---

## Processing State

### Processing Progress (Restructured)
```typescript
interface ProcessingProgress {
  batch: {
    current: number;             // Images processed (0+)
    total: number;               // Total images in batch (1+)
    percentage: number;          // 0-100% completion
  };
  status: {
    isProcessing: boolean;
    isPaused: boolean;
    hasErrors: boolean;
    canResume: boolean;
  };
  timing: {
    startTime: number;           // Unix timestamp
    estimatedCompletion: number | null; // Unix timestamp or null
    averageTimePerImage: number; // Milliseconds per image
    remainingTime: number | null; // Milliseconds remaining
  };
  currentImage: {
    filename: string | null;
    step: {
      current: number;           // 1-5 processing steps
      total: number;             // Always 5
      name: string;              // 'Loading', 'Blur Analysis', etc.
      progress: number;          // 0-100% within current step
    };
  } | null;
  performance: {
    processingSpeed: number;     // Images per second
    memoryUsage: number;         // Estimated MB used
    cpuUtilization: number;      // 0-100% estimated
    gpuAcceleration: boolean;    // Whether GPU is being used
  };
}
```

### Analysis Statistics (Enhanced)
```typescript
interface AnalysisStatistics {
  summary: {
    totalImages: number;
    processedSuccessfully: number;
    failedAnalysis: number;
    averageProcessingTime: number; // Milliseconds per image
  };
  qualityDistribution: {
    excellent: number;           // Count of excellent images
    good: number;                // Count of good images  
    acceptable: number;          // Count of acceptable images
    poor: number;                // Count of poor images
    unsuitable: number;          // Count of unsuitable images
  };
  averageScores: {
    composite: number;           // 0-100 average
    blur: number;                // 0-100 average
    exposure: number;            // 0-100 average
    noise: number;               // 0-100 average
    descriptor: number;          // 0-100 average
    technical: number;           // 0-100 average
  };
  recommendations: {
    forReconstruction: number;   // Count above threshold
    needsReview: number;         // Count in marginal range
    shouldRetake: number;        // Count below minimum quality
  };
  metadata: {
    cameraStats: Record<string, number>; // Camera model frequency
    averageFileSize: number;     // Bytes
    resolutionDistribution: Record<string, number>; // Resolution frequency
    processingModes: {
      cpuOnly: number;           // Count processed with CPU
      gpuAccelerated: number;    // Count processed with GPU
    };
  };
}
```

---

## UI State (Separated)

### User Interface State
```typescript
interface UIState {
  display: {
    threshold: number;           // 0-100 quality threshold
    filter: 'all' | 'recommended' | 'not-recommended' | 'needs-review';
    sortBy: 'name' | 'score' | 'quality' | 'composite' | 'date';
    sortDirection: 'asc' | 'desc';
    gridSize: 'small' | 'medium' | 'large';
    showTechnicalDetails: boolean;
  };
  selection: {
    selectedImages: string[];    // Array of image IDs
    activeImage: string | null;  // Currently viewed image ID
    comparisonMode: boolean;     // Side-by-side comparison
  };
  panels: {
    technicalPanelExpanded: boolean;
    histogramVisible: boolean;
    exportPanelOpen: boolean;
    settingsVisible: boolean;
  };
  preferences: {
    autoAdvanceThreshold: boolean; // Auto-update threshold
    showDebugInfo: boolean;      // Development mode features
    preferredUnits: 'metric' | 'imperial';
    colorScheme: 'light' | 'dark' | 'auto';
  };
}
```

### View State Management
```typescript
interface ViewState {
  layout: {
    sidebarCollapsed: boolean;
    fullscreenMode: boolean;
    splitView: boolean;
  };
  navigation: {
    currentView: 'upload' | 'processing' | 'results' | 'export';
    previousView: string | null;
    canGoBack: boolean;
  };
  modals: {
    technicalDetails: {
      isOpen: boolean;
      imageId: string | null;
      activeTab: string;
    };
    settings: {
      isOpen: boolean;
      activeSection: string;
    };
    export: {
      isOpen: boolean;
      selectedFormat: string;
      includeMetadata: boolean;
    };
  };
}
```

---

## Export Formats

### Composite Score Breakdown (New)
```typescript
interface CompositeScoreBreakdown {
  overall: number;               // 0-100 final score
  components: {
    blur: {
      rawScore: number;          // 0-100 original score
      weight: number;            // 0-1 weight applied
      contribution: number;      // Weighted points added
    };
    exposure: {
      rawScore: number;
      weight: number;
      contribution: number;
    };
    noise: {
      rawScore: number;
      weight: number;
      contribution: number;
    };
    technical: {
      rawScore: number;
      weight: number;
      contribution: number;
    };
    descriptor: {
      rawScore: number;
      weight: number;
      contribution: number;
    };
  };
  calculation: {
    method: 'weighted_average' | 'photogrammetric_specialized';
    weightsUsed: Record<string, number>;
    normalization: string;       // Description of normalization applied
  };
  recommendation: {
    classification: 'excellent' | 'good' | 'acceptable' | 'poor' | 'unsuitable';
    confidence: number;          // 0-100% confidence in classification
    reasoning: string[];         // Factors influencing classification
  };
}
```

### Enhanced CSV Export Schema
```typescript
interface CSVExportRow {
  // Basic Information
  filename: string;
  fileSize: string;              // "2.1 MB" format
  dimensions: string;            // "4000x3000" format
  processingTime: string;        // "1.2s" format
  
  // Composite Scoring
  compositeScore: number;        // 0-100
  compositeClassification: string; // excellent/good/etc.
  recommendedForReconstruction: string; // "Yes"/"No"
  
  // Individual Scores (with units)
  blurScore: number;             // 0-100
  exposureScore: number;         // 0-100  
  noiseScore: number;            // 0-100
  technicalScore: number;        // 0-100
  descriptorScore: number;       // 0-100
  
  // Detailed Metrics
  keypointCount: number;
  keypointDensity: string;       // "1.2/1000px" format
  featureDistribution: number;   // 0-100% uniformity
  overexposurePercentage: string; // "5.2%" format
  underexposurePercentage: string; // "2.1%" format
  dynamicRange: number;          // 0-255
  noiseLevel: string;            // "Low"/"Medium"/"High"
  
  // Camera Information
  cameraMake: string;
  cameraModel: string;
  lensModel: string;
  iso: number | null;
  aperture: string;              // "f/2.8" format
  shutterSpeed: string;          // "1/1000s" format
  focalLength: string;           // "24mm" format
  
  // Location Data
  latitude: number | null;
  longitude: number | null;
  altitude: string;              // "120m" format
  
  // Processing Information
  processingMode: string;        // "CPU"/"GPU"
  sceneType: string;             // "aerial_sky"/"ground_detail"/"mixed"
  colorSpace: string;            // "BT.709"/"BT.601"
  
  // Status
  analysisStatus: string;        // "Success"/"Error"/"Warning"
  errorDetails: string;          // Error message if failed
  warnings: string;              // Comma-separated warnings
}
```

---

## Performance Metrics

### WebGL Performance Tracking
```typescript
interface WebGLPerformanceMetrics {
  capabilities: {
    webglVersion: '1.0' | '2.0' | 'none';
    maxTextureSize: number;      // Maximum texture dimensions
    supportsHighPrecision: boolean;
    supportsFloatTextures: boolean;
    extensions: string[];        // Available WebGL extensions
  };
  benchmarks: {
    operation: string;           // 'blur_detection', 'harris_corners', etc.
    imageSize: number;           // Pixel count
    cpuTime: number;             // Milliseconds
    gpuTime: number;             // Milliseconds
    speedup: number;             // cpuTime / gpuTime
    memoryUsage: number;         // Estimated bytes
    timestamp: number;           // Unix timestamp
  }[];
  statistics: {
    averageSpeedup: number;      // Overall GPU vs CPU performance
    totalBenchmarks: number;
    recommendedMode: 'cpu' | 'gpu' | 'hybrid';
    performanceTrend: 'improving' | 'stable' | 'degrading';
  };
}
```

### Memory Management Metrics
```typescript
interface MemoryMetrics {
  usage: {
    current: number;             // Current memory usage in MB
    peak: number;                // Peak memory usage in MB
    available: number;           // Estimated available memory in MB
  };
  allocation: {
    imageData: number;           // Memory for image processing in MB
    thumbnails: number;          // Memory for thumbnails in MB
    webglContexts: number;       // Memory for WebGL contexts in MB
    analysisResults: number;     // Memory for analysis data in MB
  };
  optimization: {
    lazyLoadingActive: boolean;
    virtualizationThreshold: number; // Image count threshold
    contextPoolSize: number;     // Number of pooled WebGL contexts
    garbageCollectionTriggers: number; // Manual GC trigger count
  };
}
```

---

## Data Flow

### Complete Processing Pipeline
```
File Input & Validation
         ↓
Image Loading & Preprocessing
         ↓
Metadata Extraction (EXIF)
         ↓
Scene Detection & Configuration
         ↓
Parallel Analysis Pipeline:
├── Blur Analysis (CPU/GPU)
├── Exposure Analysis  
├── Noise Analysis
├── Feature Detection
└── Technical Assessment
         ↓
Composite Score Calculation
         ↓
Quality Classification
         ↓
Results Aggregation & Statistics
         ↓
UI State Update & Display
         ↓
Export Generation (Optional)
```

### Error Handling Flow
```
Processing Error
         ↓
Error Classification:
├── Validation Error (file format, size)
├── Loading Error (corrupted, unsupported)
├── Analysis Error (algorithm failure)
└── System Error (memory, GPU)
         ↓
Fallback Strategy:
├── Retry with different parameters
├── Switch to CPU processing
├── Skip problematic analysis
└── Create error analysis result
         ↓
User Notification & Logging
```

---

## Future Schema Extensions

### Planned Enhancements

1. **Environmental Context**
```typescript
interface EnvironmentalContext {
  lighting: {
    sunAngle: number | null;     // Degrees above horizon
    cloudCover: 'clear' | 'partly_cloudy' | 'overcast' | 'unknown';
    shadowDirection: number | null; // Degrees from north
  };
  atmospheric: {
    visibility: 'excellent' | 'good' | 'hazy' | 'poor' | 'unknown';
    humidity: number | null;     // 0-100% if available
    temperature: number | null;  // Celsius if available
  };
  terrain: {
    type: 'urban' | 'rural' | 'water' | 'forest' | 'desert' | 'mixed';
    elevation: number | null;    // Meters above sea level
    slope: number | null;        // Degrees from horizontal
  };
}
```

2. **Flight Context** (for drone imagery)
```typescript
interface FlightContext {
  mission: {
    id: string;                  // Mission identifier
    plannedAltitude: number;     // Planned flight altitude
    plannedOverlap: number;      // Planned image overlap percentage
    flightPattern: 'grid' | 'linear' | 'circular' | 'manual';
  };
  sequence: {
    imageNumber: number;         // Position in flight sequence
    totalImages: number;         // Total images in mission
    timeFromStart: number;       // Seconds from mission start
    gpsAccuracy: number | null;  // GPS accuracy in meters
  };
  aircraft: {
    model: string;               // Drone model
    batteryLevel: number | null; // 0-100% at capture time
    windSpeed: number | null;    // m/s if available
    gimbalStabilization: boolean;
  };
}
```

3. **User Feedback Integration**
```typescript
interface UserFeedback {
  qualityAssessment: {
    userRating: number | null;   // 1-5 user quality rating
    agreesWithRecommendation: boolean | null;
    comments: string;            // Free-form user comments
  };
  corrections: {
    suggestedClassification: string | null;
    reportedIssues: string[];    // User-reported problems
    improvementSuggestions: string[];
  };
  usage: {
    actuallyUsedForReconstruction: boolean | null;
    reconstructionQuality: 'excellent' | 'good' | 'poor' | null;
    processingTime: number | null; // Time spent in photogrammetry software
  };
}
```

---

## JSON Schema Example

```json
{
  "imageAnalysis": {
    "id": "img_001_analysis",
    "file": {
      "metadata": {
        "name": "DJI_0123.jpg",
        "size": 8388608,
        "type": "image/jpeg"
      }
    },
    "processing": {
      "dimensions": {
        "original": { "width": 4000, "height": 3000 },
        "processed": { "width": 800, "height": 600 }
      },
      "colorSpace": {
        "detected": "BT.709",
        "recommended": "BT.709"
      }
    },
    "analysis": {
      "blur": {
        "score": 78,
        "metrics": {
          "laplacianVariance": 1247.3,
          "sceneAdaptation": {
            "sceneType": "aerial_sky",
            "normalizationFactor": 12,
            "adaptiveScore": 82
          }
        }
      },
      "exposure": {
        "score": 85,
        "histogram": {
          "overexposure": {
            "percentage": 3.2,
            "threshold": 245
          },
          "distribution": {
            "balance": "balanced"
          }
        }
      },
      "features": {
        "detection": {
          "keypoints": {
            "total": 1247,
            "density": 2.6
          }
        },
        "descriptor": {
          "photogrammetric": {
            "score": 87,
            "suitability": "excellent"
          }
        }
      }
    },
    "composite": {
      "overall": 82,
      "breakdown": {
        "blur": {
          "rawScore": 78,
          "weight": 0.30,
          "contribution": 23.4
        },
        "exposure": {
          "rawScore": 85,
          "weight": 0.25,
          "contribution": 21.25
        }
      },
      "recommendation": {
        "classification": "good",
        "confidence": 92
      }
    }
  }
}
```

---

## Migration Guide from v1.0

### Breaking Changes
1. **Field Restructuring**: Many flat fields moved to nested objects
2. **Naming Changes**: Some fields renamed for clarity
3. **Type Changes**: Optional fields now use `| null` instead of `?`
4. **UI Separation**: UI state moved to separate interfaces

### Migration Steps
1. Update TypeScript interfaces to match new schema
2. Modify data access patterns for nested structures
3. Separate UI state management from analysis data
4. Update export functions for new CSV schema
5. Implement new configuration system for thresholds

### Backward Compatibility
- Legacy data can be converted using provided migration utilities
- Old export formats supported with deprecation warnings
- Gradual migration path available for existing implementations

---

*This v2.0 schema addresses all identified issues and provides a robust foundation for production deployment with clear separation of concerns, configurable thresholds, and comprehensive data structures.*