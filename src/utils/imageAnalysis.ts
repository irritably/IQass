/**
 * Enhanced Main Image Analysis Module
 * 
 * This module orchestrates the complete image analysis pipeline with
 * improved error handling, orientation correction, and performance tracking.
 */

import { ImageAnalysis, ProcessingStep } from '../types';
import { loadImageForAnalysis, createThumbnail, calculateBlurScore } from './imageProcessing';
import { analyzeEnhancedExposure } from './enhancedExposureAnalysis';
import { analyzeNoise } from './noiseAnalysis';
import { extractMetadata, calculateTechnicalScore } from './metadataExtraction';
import { calculateCompositeScore } from './compositeScoring';
import { analyzeDescriptors } from './descriptorAnalysis';
import { getQualityLevel, generateQualityReport, exportQualityDataToCSV } from './qualityAssessment';

/**
 * Performs comprehensive analysis of a single image file with enhanced progress tracking
 * @param file - The image file to analyze
 * @param onProgress - Optional progress callback with step and progress information
 * @returns Promise resolving to complete image analysis
 */
export const analyzeImage = async (
  file: File,
  onProgress?: (step: ProcessingStep, progress: number) => void
): Promise<ImageAnalysis> => {
  const analysisId = generateAnalysisId();
  const startTime = performance.now();
  
  try {
    console.log(`Starting analysis for ${file.name}`);
    onProgress?.(ProcessingStep.EXTRACT, 0);
    
    // Step 1: Extract metadata first (for orientation correction)
    let metadata;
    try {
      onProgress?.(ProcessingStep.EXTRACT, 10);
      metadata = await extractMetadata(file);
      console.log(`Extracted metadata for ${file.name}`);
      onProgress?.(ProcessingStep.EXTRACT, 100);
    } catch (metadataError) {
      console.warn(`Failed to extract metadata for ${file.name}:`, metadataError);
      metadata = {
        camera: {},
        settings: {},
        location: {},
        fileFormat: { format: 'Unknown' }
      };
      onProgress?.(ProcessingStep.EXTRACT, 100);
    }
    
    // Step 2: Load and prepare image for analysis with orientation correction
    let imageData: ImageData;
    try {
      onProgress?.(ProcessingStep.PROCESS, 0);
      const { imageData: loadedImageData } = await loadImageForAnalysis(
        file, 
        metadata.settings.orientation
      );
      imageData = loadedImageData;
      console.log(`Successfully loaded image data for ${file.name}`);
      onProgress?.(ProcessingStep.PROCESS, 50);
    } catch (loadError) {
      console.error(`Failed to load image ${file.name}:`, loadError);
      return createErrorAnalysis(file, `Failed to load image: ${loadError instanceof Error ? loadError.message : 'Unknown error'}`, analysisId, startTime);
    }
    
    // Step 3: Create thumbnail (non-blocking)
    let thumbnail = '';
    try {
      thumbnail = await createThumbnail(file);
      console.log(`Created thumbnail for ${file.name}`);
      onProgress?.(ProcessingStep.PROCESS, 100);
    } catch (thumbnailError) {
      console.warn(`Failed to create thumbnail for ${file.name}:`, thumbnailError);
      onProgress?.(ProcessingStep.PROCESS, 100);
      // Continue without thumbnail - this is not a fatal error
    }
    
    // Step 4: Perform core image analysis with detailed progress
    onProgress?.(ProcessingStep.ANALYZE, 0);
    let blurScore = 0;
    let exposureAnalysis;
    let noiseAnalysis;
    let descriptorAnalysis;
    
    try {
      // Calculate blur score (25% of analysis)
      onProgress?.(ProcessingStep.ANALYZE, 5);
      blurScore = calculateBlurScore(imageData);
      console.log(`Calculated blur score for ${file.name}: ${blurScore}`);
      onProgress?.(ProcessingStep.ANALYZE, 25);
    } catch (blurError) {
      console.error(`Failed to calculate blur score for ${file.name}:`, blurError);
      // Continue with 0 blur score
    }
    
    try {
      // Analyze exposure (25% of analysis)
      onProgress?.(ProcessingStep.ANALYZE, 30);
      exposureAnalysis = analyzeEnhancedExposure(imageData);
      console.log(`Analyzed exposure for ${file.name}`);
      onProgress?.(ProcessingStep.ANALYZE, 50);
    } catch (exposureError) {
      console.error(`Failed to analyze exposure for ${file.name}:`, exposureError);
      // Create default exposure analysis
      exposureAnalysis = createDefaultExposureAnalysis();
    }
    
    try {
      // Analyze noise (25% of analysis)
      onProgress?.(ProcessingStep.ANALYZE, 55);
      noiseAnalysis = analyzeNoise(imageData);
      console.log(`Analyzed noise for ${file.name}`);
      onProgress?.(ProcessingStep.ANALYZE, 75);
    } catch (noiseError) {
      console.error(`Failed to analyze noise for ${file.name}:`, noiseError);
      // Create default noise analysis
      noiseAnalysis = createDefaultNoiseAnalysis();
    }
    
    try {
      // Analyze descriptors (25% of analysis)
      onProgress?.(ProcessingStep.ANALYZE, 80);
      descriptorAnalysis = analyzeDescriptors(imageData);
      console.log(`Analyzed descriptors for ${file.name}`);
      onProgress?.(ProcessingStep.ANALYZE, 100);
    } catch (descriptorError) {
      console.error(`Failed to analyze descriptors for ${file.name}:`, descriptorError);
      // Create default descriptor analysis
      descriptorAnalysis = createDefaultDescriptorAnalysis();
    }
    
    // Step 5: Calculate derived metrics
    onProgress?.(ProcessingStep.EXPORT, 0);
    const technicalScore = calculateTechnicalScore(metadata);
    onProgress?.(ProcessingStep.EXPORT, 50);
    
    const compositeScore = calculateCompositeScore(
      blurScore,
      exposureAnalysis.exposureScore,
      noiseAnalysis.noiseScore,
      technicalScore,
      descriptorAnalysis.photogrammetricScore
    );
    
    const quality = getQualityLevel(compositeScore.overall);
    const processingDuration = performance.now() - startTime;
    
    console.log(`Completed analysis for ${file.name} with composite score: ${compositeScore.overall} in ${processingDuration.toFixed(2)}ms`);
    onProgress?.(ProcessingStep.EXPORT, 100);
    
    return {
      id: analysisId,
      file,
      name: file.name,
      size: file.size,
      blurScore,
      quality,
      thumbnail,
      processed: true,
      exposureAnalysis,
      noiseAnalysis,
      descriptorAnalysis,
      metadata,
      compositeScore,
      processingDuration
    };
  } catch (error) {
    console.error(`Unexpected error analyzing ${file.name}:`, error);
    return createErrorAnalysis(file, error, analysisId, startTime);
  }
};

/**
 * Generates a unique identifier for an analysis
 * @returns Unique analysis ID
 */
const generateAnalysisId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

/**
 * Creates an error analysis result when processing fails
 * @param file - The file that failed to process
 * @param error - The error that occurred
 * @param id - Optional analysis ID
 * @param startTime - Processing start time
 * @returns Error analysis result
 */
const createErrorAnalysis = (
  file: File, 
  error: unknown, 
  id?: string, 
  startTime?: number
): ImageAnalysis => {
  const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
  console.error(`Creating error analysis for ${file.name}: ${errorMessage}`);
  
  const processingDuration = startTime ? performance.now() - startTime : 0;
  
  return {
    id: id || generateAnalysisId(),
    file,
    name: file.name,
    size: file.size,
    blurScore: 0,
    quality: 'unsuitable',
    thumbnail: '',
    processed: true,
    error: errorMessage,
    processingDuration
  };
};

/**
 * Creates default exposure analysis when analysis fails
 */
const createDefaultExposureAnalysis = () => ({
  overexposurePercentage: 0,
  underexposurePercentage: 0,
  dynamicRange: 0,
  averageBrightness: 0,
  contrastRatio: 1,
  histogramBalance: 'balanced' as const,
  exposureScore: 0,
  localContrast: 0,
  highlightRecovery: 0,
  shadowDetail: 0,
  colorBalance: { y: 0, cr: 0, cb: 0 },
  perceptualExposureScore: 0,
  spatialExposureVariance: 0,
  weightingContribution: {
    highlightRecovery: 0,
    shadowDetail: 0,
    localContrast: 0
  }
});

/**
 * Creates default noise analysis when analysis fails
 */
const createDefaultNoiseAnalysis = () => ({
  rawStandardDeviation: 0,
  noiseLevel: 100,
  snrRatio: 0,
  compressionArtifacts: 100,
  chromaticAberration: 100,
  vignetting: 100,
  overallArtifactScore: 100,
  noiseScore: 0
});

/**
 * Creates default descriptor analysis when analysis fails
 */
const createDefaultDescriptorAnalysis = () => ({
  keypointCount: 0,
  keypointDensity: 0,
  keypointDistribution: {
    uniformity: 0,
    coverage: 0,
    clustering: 100
  },
  featureStrength: {
    average: 0,
    median: 0,
    standardDeviation: 0
  },
  descriptorQuality: {
    distinctiveness: 0,
    repeatability: 0,
    matchability: 0
  },
  photogrammetricScore: 0,
  reconstructionSuitability: 'unsuitable' as const,
  featureTypes: {
    corners: 0,
    edges: 0,
    blobs: 0,
    textured: 0
  },
  scaleInvariance: 0,
  rotationInvariance: 0,
  descriptorType: 'harris-fast-hybrid' as const
});

// Re-export functions for backward compatibility
export const generateReport = generateQualityReport;
export const exportToCSV = exportQualityDataToCSV;