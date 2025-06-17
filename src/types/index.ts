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
}

export interface ExposureAnalysis {
  overexposurePercentage: number;
  underexposurePercentage: number;
  dynamicRange: number;
  averageBrightness: number;
  contrastRatio: number;
  histogramBalance: 'balanced' | 'underexposed' | 'overexposed' | 'high-contrast';
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
}

export interface NoiseAnalysis {
  noiseLevel: number; // 0-100 scale
  snrRatio: number;
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
  };
  location: {
    latitude?: number;
    longitude?: number;
    altitude?: number;
  };
  timestamp?: Date;
  colorSpace?: string;
  fileFormat: {
    format: string;
    compression?: string;
    bitDepth?: number;
    colorProfile?: string;
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

export interface ProcessingProgress {
  current: number;
  total: number;
  isProcessing: boolean;
  startTime?: number;
  currentImageName?: string;
  currentStep?: number;
  currentStepName?: string;
  currentImageProgress?: number;
}