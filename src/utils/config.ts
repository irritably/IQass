/**
 * Configuration Constants and Settings
 * 
 * This module contains configurable parameters for the image analysis system,
 * allowing for easy tuning without code changes.
 */

import { QualityWeights, FormatLimits } from '../types';

// Default quality scoring weights (can be overridden)
export const DEFAULT_QUALITY_WEIGHTS: QualityWeights = {
  blur: 0.30,        // 30% - Sharpness is critical
  exposure: 0.25,    // 25% - Proper exposure essential
  noise: 0.20,       // 20% - Noise affects detail
  technical: 0.10,   // 10% - Metadata quality
  descriptor: 0.15   // 15% - Feature matching capability
};

// File size limits by format (in bytes)
export const FORMAT_SIZE_LIMITS: FormatLimits = {
  jpeg: 50 * 1024 * 1024,   // 50MB for JPEG
  png: 100 * 1024 * 1024,   // 100MB for PNG
  tiff: 200 * 1024 * 1024,  // 200MB for TIFF (high-end drone images)
  default: 50 * 1024 * 1024 // 50MB default
};

// Processing resolution limits
export const PROCESSING_LIMITS = {
  defaultMaxSize: 800,      // Default processing resolution
  highQualityMaxSize: 1600, // High quality when GPU available
  thumbnailSize: 150,       // Thumbnail size
  minImageSize: 100         // Minimum image dimension
};

// Blur detection configuration
export const BLUR_DETECTION_CONFIG = {
  useMultiScale: true,      // Enable multi-scale Laplacian
  scaleCount: 3,            // Number of scales for multi-scale analysis
  scaleFactors: [1.0, 0.5, 0.25], // Scale factors for pyramid
  kernelSize: 3,            // Laplacian kernel size
  normalizationFactor: 15   // Score normalization factor
};

// Exposure analysis weights
export const EXPOSURE_WEIGHTS = {
  basic: 0.4,               // 40% - Traditional metrics
  spatial: 0.35,            // 35% - Spatial analysis
  perceptual: 0.25,         // 25% - Perceptual quality
  highlightRecovery: 0.15,  // Weight in spatial metrics
  shadowDetail: 0.15,       // Weight in spatial metrics
  localContrast: 0.70       // Weight in spatial metrics
};

// Noise analysis configuration
export const NOISE_CONFIG = {
  blockSize: 8,             // Block size for noise analysis
  snrThreshold: 10,         // Minimum acceptable SNR
  artifactThreshold: 15     // Maximum acceptable artifact level
};

// Feature detection configuration
export const FEATURE_CONFIG = {
  maxKeypointsPerDetector: 500,  // Limit per detector type
  totalKeypointLimit: 2000,      // Total keypoint limit
  harrisK: 0.04,                 // Harris corner detection parameter
  fastThreshold: 20,             // FAST corner threshold
  edgeThreshold: 50,             // Edge detection threshold
  blobThreshold: 100             // Blob detection threshold
};

// WebGL performance configuration
export const WEBGL_CONFIG = {
  contextPoolSize: 3,            // Maximum WebGL contexts
  contextTimeout: 30000,         // Context timeout (ms)
  minPixelsForGPU: 100000,       // Minimum pixels to use GPU
  benchmarkHistorySize: 100,     // Performance benchmark history
  speedupThreshold: 1.5          // Minimum speedup to prefer GPU
};

// Export formatting configuration
export const EXPORT_CONFIG = {
  csvDecimalPlaces: 2,           // Decimal places for CSV export
  reportDecimalPlaces: 3,        // Decimal places for reports
  includeDebugInfo: false        // Include debug information in exports
};

// Quality thresholds
export const QUALITY_THRESHOLDS = {
  excellent: 85,
  good: 70,
  acceptable: 55,
  poor: 40
};

/**
 * Gets the appropriate file size limit for a given MIME type
 */
export const getFileSizeLimit = (mimeType: string): number => {
  const type = mimeType.toLowerCase();
  
  if (type.includes('jpeg') || type.includes('jpg')) {
    return FORMAT_SIZE_LIMITS.jpeg;
  } else if (type.includes('png')) {
    return FORMAT_SIZE_LIMITS.png;
  } else if (type.includes('tiff') || type.includes('tif')) {
    return FORMAT_SIZE_LIMITS.tiff;
  }
  
  return FORMAT_SIZE_LIMITS.default;
};

/**
 * Gets processing resolution based on capabilities
 */
export const getProcessingResolution = (hasGPU: boolean, imageSize: number): number => {
  if (hasGPU && imageSize > 500000) { // 500k pixels
    return PROCESSING_LIMITS.highQualityMaxSize;
  }
  return PROCESSING_LIMITS.defaultMaxSize;
};