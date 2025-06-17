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
import { analyzeDescriptors } from './descriptorAnalysis';
import { getQualityLevel, generateQualityReport, exportQualityDataToCSV } from './qualityAssessment';

/**
 * Performs comprehensive analysis of a single image file
 * @param file - The image file to analyze
 * @returns Promise resolving to complete image analysis
 */
export const analyzeImage = async (file: File): Promise<ImageAnalysis> => {
  try {
    // Load and prepare image for analysis
    const { imageData } = await loadImageForAnalysis(file);
    
    // Perform parallel analysis where possible
    const [
      blurScore,
      exposureAnalysis,
      noiseAnalysis,
      descriptorAnalysis,
      metadata,
      thumbnail
    ] = await Promise.all([
      Promise.resolve(calculateBlurScore(imageData)),
      Promise.resolve(analyzeEnhancedExposure(imageData)),
      Promise.resolve(analyzeNoise(imageData)),
      Promise.resolve(analyzeDescriptors(imageData)),
      extractMetadata(file),
      createThumbnail(file)
    ]);
    
    // Calculate derived metrics
    const technicalScore = calculateTechnicalScore(metadata);
    const compositeScore = calculateCompositeScore(
      blurScore,
      exposureAnalysis.exposureScore,
      noiseAnalysis.noiseScore,
      technicalScore,
      descriptorAnalysis.photogrammetricScore
    );
    const quality = getQualityLevel(compositeScore.overall);
    
    return {
      id: generateAnalysisId(),
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
      compositeScore
    };
  } catch (error) {
    return createErrorAnalysis(file, error);
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
 * @returns Error analysis result
 */
const createErrorAnalysis = (file: File, error: unknown): ImageAnalysis => {
  return {
    id: generateAnalysisId(),
    file,
    name: file.name,
    size: file.size,
    blurScore: 0,
    quality: 'unsuitable',
    thumbnail: '',
    processed: true,
    error: error instanceof Error ? error.message : 'Analysis failed'
  };
};

// Re-export functions for backward compatibility
export const generateReport = generateQualityReport;
export const exportToCSV = exportQualityDataToCSV;