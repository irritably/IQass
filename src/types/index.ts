/**
 * Type Definitions for Drone Image Quality Analyzer
 * 
 * This module contains all TypeScript interfaces and types used throughout
 * the application for image analysis, quality assessment, and UI components.
 */

export interface ImageAnalysis {
  id: string;
  file: File;
  name: string;
  size: number;
  blurScore: number;
  quality: 'excellent' | 'good' | 'poor' | 'unsuitable';
  thumbnail: string;
  processed: boolean;
  error?: string;
  // Enhanced technical quality metrics
  exposureAnalysis?: ExposureAnalysis;
  noiseAnalysis?: NoiseAnalysis;
  metadata?: CameraMetadata;
  compositeScore?: CompositeQualityScore;
  // Descriptor-based analysis for photogrammetric quality
  descriptorAnalysis?: DescriptorAnalysis;
  // Processing performance metrics
  processingDuration?: number;
}

export interface ExposureAnalysis {
  overexposurePercentage: number;
  underexposurePercentage: number;
  dynamicRange: number;
  averageBrightness: number;
  contrastRatio: number;
  histogramBalance: 'balanced' | 'underexposed' | 'overexposed' | 'high-contrast' | 'low-contrast';
  exposureScore: number; // 0-100
  // Enhanced exposure metrics
  localContrast: number;
  highlightRecovery: number;
  shadowDetail: number;
  colorBalance: {
    y: number;
    cr: number;
    cb: number;
  };
  perceptualExposureScore: number;
  spatialExposureVariance: number;
  // Weighting documentation
  weightingContribution: {
    highlightRecovery: number;
    shadowDetail: number;
    localContrast: number;
  };
}

export interface DescriptorAnalysis {
  // Feature detection metrics
  keypointCount: number;
  keypointDensity: number; // keypoints per 1000 pixels
  keypointDistribution: {
    uniformity: number; // 0-100, higher is more uniform
    coverage: number;   // 0-100, percentage of image covered
    clustering: number; // 0-100, lower is better (less clustered)
  };
  
  // Feature quality metrics
  featureStrength: {
    average: number;
    median: number;
    standardDeviation: number;
  };
  
  // Descriptor robustness
  descriptorQuality: {
    distinctiveness: number; // 0-100
    repeatability: number;   // 0-100
    matchability: number;    // 0-100, predicted matching success
  };
  
  // Photogrammetric suitability
  photogrammetricScore: number; // 0-100, overall descriptor-based quality
  reconstructionSuitability: 'excellent' | 'good' | 'acceptable' | 'poor' | 'unsuitable';
  
  // Feature type analysis
  featureTypes: {
    corners: number;
    edges: number;
    blobs: number;
    textured: number;
  };
  
  // Scale and rotation invariance
  scaleInvariance: number; // 0-100
  rotationInvariance: number; // 0-100
  
  // Descriptor type information
  descriptorType: 'harris-fast-hybrid' | 'orb-approximation' | 'sift-approximation' | 'custom';
}

export interface NoiseAnalysis {
  // Raw noise measurements
  rawStandardDeviation: number; // σ (standard deviation)
  noiseLevel: number; // 0-100 scale (derived from σ)
  snrRatio: number; // Signal-to-noise ratio (derived from σ)
  compressionArtifacts: number;
  chromaticAberration: number;
  vignetting: number;
  overallArtifactScore: number;
  noiseScore: number; // 0-100
}

export interface CameraMetadata {
  camera: {
    make?: string;
    model?: string;
    lens?: string;
  };
  settings: {
    iso?: number;
    aperture?: number;
    shutterSpeed?: string;
    focalLength?: number;
    whiteBalance?: string;
    meteringMode?: string;
    orientation?: number; // EXIF orientation tag
  };
  location: {
    latitude?: number;
    longitude?: number;
    altitude?: number;
  };
  timestamp?: {
    original: string; // Raw EXIF timestamp
    utc: string; // ISO-8601 UTC normalized
  };
  colorSpace?: string;
  fileFormat: {
    format: string;
    compression?: string;
    bitDepth?: number;
    colorProfile?: string;
    iccProfileName?: string;
  };
}

export interface CompositeQualityScore {
  blur: number;          // 30% weight
  exposure: number;      // 25% weight
  noise: number;         // 20% weight
  technical: number;     // 10% weight
  descriptor: number;    // 15% weight
  overall: number;       // Weighted average
  recommendation: 'excellent' | 'good' | 'acceptable' | 'poor' | 'unsuitable';
}

export interface QualityWeights {
  blur: number;
  exposure: number;
  noise: number;
  technical: number;
  descriptor: number;
}

export interface AnalysisStats {
  totalImages: number;
  excellentCount: number;
  goodCount: number;
  poorCount: number;
  unsuitableCount: number;
  averageBlurScore: number;
  recommendedForReconstruction: number;
  // Enhanced stats
  averageExposureScore: number;
  averageNoiseScore: number;
  averageCompositeScore: number;
  averageDescriptorScore: number;
  averageKeypointCount: number;
  averageProcessingTime: number;
  cameraStats: {
    [key: string]: number;
  };
  qualityDistribution: {
    excellent: number;
    good: number;
    acceptable: number;
    poor: number;
    unsuitable: number;
  };
}

// Processing step enumeration
export enum ProcessingStep {
  UPLOAD = 1,
  EXTRACT = 2,
  PROCESS = 3,
  ANALYZE = 4,
  EXPORT = 5
}

export interface ProcessingProgress {
  current: number;
  total: number;
  isProcessing: boolean;
  startTime?: number;
  currentImageName?: string;
  currentStep?: ProcessingStep;
  currentStepName?: string;
  currentImageProgress?: number;
  imageDuration?: number; // Duration for current image processing
}

// File validation interfaces
export interface FileValidationError {
  type: 'size' | 'format' | 'corruption' | 'metadata';
  message: string;
}

export interface FileValidationResult {
  isValid: boolean;
  errors: FileValidationError[];
  warnings: string[];
}

// Format-specific size limits
export interface FormatLimits {
  jpeg: number;
  png: number;
  tiff: number;
  default: number;
}

// WebGL capabilities and performance
export interface WebGLCapabilities {
  webgl: boolean;
  webgl2: boolean;
  maxTextureSize: number;
  maxViewportDims: [number, number];
  extensions: string[];
  supportsHighPrecision: boolean;
  supportsFloatTextures: boolean;
  browserInfo?: {
    userAgent: string;
    vendor: string;
    renderer: string;
  };
  gpuInfo?: {
    vendor: string;
    renderer: string;
    version: string;
  };
}

export interface PerformanceBenchmark {
  operation: string;
  cpuTime: number;
  gpuTime: number;
  imageSize: number;
  speedup: number;
  timestamp: number;
  browserInfo?: string;
  gpuInfo?: string;
}

// Mission/project metadata
export interface MissionMetadata {
  name?: string;
  date?: string;
  location?: string;
  operator?: string;
  notes?: string;
}