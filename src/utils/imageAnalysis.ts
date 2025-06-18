/**
 * Main Image Analysis Module
 * 
 * This module orchestrates the complete image analysis pipeline,
 * combining multiple analysis techniques to provide comprehensive
 * quality assessment for drone imagery.
 */

import { ImageAnalysis } from '../types';
import { loadImageForAnalysis, createThumbnail, calculateBlurScore } from './imageProcessing';
import { analyzeEnhancedExposure } from './enhancedExposureAnalysis';
import { analyzeNoise } from './noiseAnalysis';
import { extractMetadata, calculateTechnicalScore } from './metadataExtraction';
import { calculateCompositeScore } from './compositeScoring';
import { getQualityLevel, generateQualityReport, exportQualityDataToCSV } from './qualityAssessment';

/**
 * Performs comprehensive analysis of a single image file
 * @param file - The image file to analyze
 * @returns Promise resolving to complete image analysis
 */
export const analyzeImage = async (file: File): Promise<ImageAnalysis> => {
  const analysisId = generateAnalysisId();
  
  try {
    console.log(`Starting analysis for ${file.name}`);
    
    // Step 1: Load and prepare image for analysis
    let imageData: ImageData;
    try {
      const { imageData: loadedImageData } = await loadImageForAnalysis(file);
      imageData = loadedImageData;
      console.log(`Successfully loaded image data for ${file.name}`);
    } catch (loadError) {
      console.error(`Failed to load image ${file.name}:`, loadError);
      return createErrorAnalysis(file, `Failed to load image: ${loadError instanceof Error ? loadError.message : 'Unknown error'}`, analysisId);
    }
    
    // Step 2: Create thumbnail (non-blocking)
    let thumbnail = '';
    try {
      thumbnail = await createThumbnail(file);
      console.log(`Created thumbnail for ${file.name}`);
    } catch (thumbnailError) {
      console.warn(`Failed to create thumbnail for ${file.name}:`, thumbnailError);
      // Continue without thumbnail - this is not a fatal error
    }
    
    // Step 3: Extract metadata (non-blocking)
    let metadata;
    try {
      metadata = await extractMetadata(file);
      console.log(`Extracted metadata for ${file.name}`);
    } catch (metadataError) {
      console.warn(`Failed to extract metadata for ${file.name}:`, metadataError);
      // Continue without metadata - this is not a fatal error
      metadata = {
        camera: {},
        settings: {},
        location: {},
        fileFormat: { format: 'Unknown' }
      };
    }
    
    // Step 4: Perform core image analysis
    let blurScore = 0;
    let exposureAnalysis;
    let noiseAnalysis;
    
    try {
      // Calculate blur score
      blurScore = calculateBlurScore(imageData);
      console.log(`Calculated blur score for ${file.name}: ${blurScore}`);
    } catch (blurError) {
      console.error(`Failed to calculate blur score for ${file.name}:`, blurError);
      // Continue with 0 blur score
    }
    
    try {
      // Analyze exposure
      exposureAnalysis = analyzeEnhancedExposure(imageData);
      console.log(`Analyzed exposure for ${file.name}`);
    } catch (exposureError) {
      console.error(`Failed to analyze exposure for ${file.name}:`, exposureError);
      // Create default exposure analysis
      exposureAnalysis = createDefaultExposureAnalysis();
    }
    
    try {
      // Analyze noise
      noiseAnalysis = analyzeNoise(imageData);
      console.log(`Analyzed noise for ${file.name}`);
    } catch (noiseError) {
      console.error(`Failed to analyze noise for ${file.name}:`, noiseError);
      // Create default noise analysis
      noiseAnalysis = createDefaultNoiseAnalysis();
    }
    
    // Step 5: Calculate derived metrics
    const compositeScore = calculateCompositeScore(
      blurScore,
      exposureAnalysis.exposureScore,
      noiseAnalysis.noiseScore
    );
    const quality = getQualityLevel(compositeScore.overall);
    
    console.log(`Completed analysis for ${file.name} with composite score: ${compositeScore.overall}`);
    
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
      metadata,
      compositeScore
    };
  } catch (error) {
    console.error(`Unexpected error analyzing ${file.name}:`, error);
    return createErrorAnalysis(file, error, analysisId);
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
 * @returns Error analysis result
 */
const createErrorAnalysis = (file: File, error: unknown, id?: string): ImageAnalysis => {
  const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
  console.error(`Creating error analysis for ${file.name}: ${errorMessage}`);
  
  return {
    id: id || generateAnalysisId(),
    file,
    name: file.name,
    size: file.size,
    blurScore: 0,
    quality: 'unsuitable',
    thumbnail: '',
    processed: true,
    error: errorMessage
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
  spatialExposureVariance: 0
});

/**
 * Creates default noise analysis when analysis fails
 */
const createDefaultNoiseAnalysis = () => ({
  noiseLevel: 100,
  snrRatio: 0,
  compressionArtifacts: 100,
  chromaticAberration: 100,
  vignetting: 100,
  overallArtifactScore: 100,
  noiseScore: 0
});

// Re-export functions for backward compatibility
export const generateReport = generateQualityReport;
export const exportToCSV = exportQualityDataToCSV;