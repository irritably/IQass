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
  blur: number;          // 40% weight
  exposure: number;      // 30% weight
  noise: number;         // 30% weight
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

// Navigation types for multi-view layout
export type ViewType = 'upload' | 'dashboard' | 'results';

export interface NavigationItem {
  id: ViewType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

// Session management for multi-view
export interface AnalysisSession {
  id: string;
  name: string;
  createdAt: Date;
  analyses: ImageAnalysis[];
  threshold: number;
  stats: AnalysisStats;
  tags: string[];
}