/**
 * Enhanced Quality Assessment Utilities
 * 
 * This module provides functions for determining overall image quality
 * and generating quality-based recommendations with improved robustness.
 */

import { ImageAnalysis, CompositeQualityScore, MissionMetadata } from '../types';
import { EXPORT_CONFIG } from './config';

/**
 * Determines quality level based on composite score - FIXED to include "acceptable" tier
 * @param compositeScore - The composite quality score (0-100)
 * @returns Quality level classification
 */
export const getQualityLevel = (compositeScore: number): ImageAnalysis['quality'] => {
  if (compositeScore >= 85) return 'excellent';
  if (compositeScore >= 70) return 'good';
  if (compositeScore >= 55) return 'acceptable'; // FIXED: Added missing acceptable tier
  if (compositeScore >= 40) return 'poor';
  return 'unsuitable';
};

/**
 * Generates a comprehensive quality report for multiple images
 * @param analyses - Array of image analyses
 * @param threshold - Quality threshold for recommendations
 * @param missionData - Optional mission metadata
 * @returns Detailed report with statistics and recommendations
 */
export const generateQualityReport = (
  analyses: ImageAnalysis[], 
  threshold: number,
  missionData?: MissionMetadata
) => {
  const stats = calculateQualityStatistics(analyses, threshold);
  const recommendations = generateImageRecommendations(analyses, threshold);
  
  return { stats, recommendations, missionData };
};

/**
 * Calculates comprehensive quality statistics with robust error handling
 * @param analyses - Array of image analyses
 * @param threshold - Quality threshold for recommendations
 * @returns Statistical summary of image quality metrics
 */
export const calculateQualityStatistics = (analyses: ImageAnalysis[], threshold: number) => {
  if (analyses.length === 0) {
    return {
      totalImages: 0,
      excellentCount: 0,
      goodCount: 0,
      acceptableCount: 0,
      poorCount: 0,
      unsuitableCount: 0,
      averageBlurScore: 0,
      averageCompositeScore: 0,
      averageDescriptorScore: 0,
      averageKeypointCount: 0,
      averageProcessingTime: 0,
      recommendedForReconstruction: 0
    };
  }

  // Single pass through analyses for efficiency
  let totalBlurScore = 0;
  let totalCompositeScore = 0;
  let totalDescriptorScore = 0;
  let totalKeypointCount = 0;
  let totalProcessingTime = 0;
  
  let validBlurCount = 0;
  let validCompositeCount = 0;
  let validDescriptorCount = 0;
  let validKeypointCount = 0;
  let validProcessingCount = 0;
  
  let excellentCount = 0;
  let goodCount = 0;
  let acceptableCount = 0;
  let poorCount = 0;
  let unsuitableCount = 0;
  let recommendedForReconstruction = 0;

  for (const analysis of analyses) {
    // Use getQualityLevel as single source of truth for quality classification
    const qualityLevel = getQualityLevel(analysis.compositeScore?.overall || 0);
    
    // Count quality levels
    switch (qualityLevel) {
      case 'excellent': excellentCount++; break;
      case 'good': goodCount++; break;
      case 'acceptable': acceptableCount++; break;
      case 'poor': poorCount++; break;
      case 'unsuitable': unsuitableCount++; break;
    }
    
    // Count recommendations
    if ((analysis.compositeScore?.overall || 0) >= threshold) {
      recommendedForReconstruction++;
    }
    
    // Safely accumulate scores, handling undefined values
    if (analysis.blurScore !== undefined && !isNaN(analysis.blurScore)) {
      totalBlurScore += analysis.blurScore;
      validBlurCount++;
    }
    
    if (analysis.compositeScore?.overall !== undefined && !isNaN(analysis.compositeScore.overall)) {
      totalCompositeScore += analysis.compositeScore.overall;
      validCompositeCount++;
    }
    
    if (analysis.descriptorAnalysis?.photogrammetricScore !== undefined && 
        !isNaN(analysis.descriptorAnalysis.photogrammetricScore)) {
      totalDescriptorScore += analysis.descriptorAnalysis.photogrammetricScore;
      validDescriptorCount++;
    }
    
    if (analysis.descriptorAnalysis?.keypointCount !== undefined && 
        !isNaN(analysis.descriptorAnalysis.keypointCount)) {
      totalKeypointCount += analysis.descriptorAnalysis.keypointCount;
      validKeypointCount++;
    }
    
    if (analysis.processingDuration !== undefined && !isNaN(analysis.processingDuration)) {
      totalProcessingTime += analysis.processingDuration;
      validProcessingCount++;
    }
  }

  return {
    totalImages: analyses.length,
    excellentCount,
    goodCount,
    acceptableCount,
    poorCount,
    unsuitableCount,
    averageBlurScore: validBlurCount > 0 ? totalBlurScore / validBlurCount : 0,
    averageCompositeScore: validCompositeCount > 0 ? totalCompositeScore / validCompositeCount : 0,
    averageDescriptorScore: validDescriptorCount > 0 ? totalDescriptorScore / validDescriptorCount : 0,
    averageKeypointCount: validKeypointCount > 0 ? totalKeypointCount / validKeypointCount : 0,
    averageProcessingTime: validProcessingCount > 0 ? totalProcessingTime / validProcessingCount : 0,
    recommendedForReconstruction
  };
};

/**
 * Generates individual image recommendations with enhanced formatting
 * @param analyses - Array of image analyses
 * @param threshold - Quality threshold for recommendations
 * @returns Array of detailed recommendations for each image
 */
export const generateImageRecommendations = (analyses: ImageAnalysis[], threshold: number) => {
  return analyses.map(analysis => ({
    filename: analysis.name,
    blurScore: formatNumber(analysis.blurScore, EXPORT_CONFIG.reportDecimalPlaces),
    compositeScore: formatNumber(analysis.compositeScore?.overall || 0, EXPORT_CONFIG.reportDecimalPlaces),
    descriptorScore: formatNumber(analysis.descriptorAnalysis?.photogrammetricScore || 0, EXPORT_CONFIG.reportDecimalPlaces),
    keypointCount: analysis.descriptorAnalysis?.keypointCount || 0,
    quality: getQualityLevel(analysis.compositeScore?.overall || 0), // Use single source of truth
    recommended: (analysis.compositeScore?.overall || 0) >= threshold,
    fileSize: `${(analysis.size / 1024 / 1024).toFixed(2)} MB`,
    exposureScore: formatNumber(analysis.exposureAnalysis?.exposureScore || 0, EXPORT_CONFIG.reportDecimalPlaces),
    noiseScore: formatNumber(analysis.noiseAnalysis?.noiseScore || 0, EXPORT_CONFIG.reportDecimalPlaces),
    photogrammetricSuitability: analysis.descriptorAnalysis?.reconstructionSuitability || 'unsuitable',
    cameraInfo: analysis.metadata?.camera.make && analysis.metadata?.camera.model 
      ? `${analysis.metadata.camera.make} ${analysis.metadata.camera.model}`
      : 'Unknown',
    processingTime: analysis.processingDuration 
      ? `${analysis.processingDuration.toFixed(1)}ms`
      : 'N/A'
  }));
};

/**
 * Exports quality data to CSV format with proper escaping and browser check
 * @param analyses - Array of image analyses
 * @param threshold - Quality threshold for recommendations
 * @param missionData - Optional mission metadata
 */
export const exportQualityDataToCSV = (
  analyses: ImageAnalysis[], 
  threshold: number,
  missionData?: MissionMetadata
) => {
  // Browser environment check
  if (typeof document === 'undefined') {
    throw new Error('CSV export only supported in browser environment');
  }

  const headers = [
    'Filename', 'Composite Score', 'Blur Score', 'Exposure Score', 'Noise Score', 
    'Technical Score', 'Descriptor Score', 'Keypoint Count', 'Keypoint Density',
    'Feature Distribution', 'Photogrammetric Suitability', 'Recommendation', 
    'Recommended for Reconstruction', 'File Size (MB)', 'Camera Make', 'Camera Model', 
    'ISO', 'Aperture', 'Shutter Speed', 'Focal Length', 'Processing Time (ms)', 'Status'
  ];
  
  const rows = analyses.map(analysis => {
    // Calculate technical score properly (not hardcoded)
    const technicalScore = analysis.compositeScore?.technical || 0;
    
    return [
      analysis.name,
      formatNumber(analysis.compositeScore?.overall || 0, EXPORT_CONFIG.csvDecimalPlaces),
      formatNumber(analysis.blurScore, EXPORT_CONFIG.csvDecimalPlaces),
      formatNumber(analysis.exposureAnalysis?.exposureScore || 0, EXPORT_CONFIG.csvDecimalPlaces),
      formatNumber(analysis.noiseAnalysis?.noiseScore || 0, EXPORT_CONFIG.csvDecimalPlaces),
      formatNumber(technicalScore, EXPORT_CONFIG.csvDecimalPlaces), // Use actual technical score
      formatNumber(analysis.descriptorAnalysis?.photogrammetricScore || 0, EXPORT_CONFIG.csvDecimalPlaces),
      (analysis.descriptorAnalysis?.keypointCount || 0).toString(),
      formatNumber(analysis.descriptorAnalysis?.keypointDensity || 0, EXPORT_CONFIG.csvDecimalPlaces),
      formatNumber(analysis.descriptorAnalysis?.keypointDistribution?.uniformity || 0, EXPORT_CONFIG.csvDecimalPlaces),
      analysis.descriptorAnalysis?.reconstructionSuitability || 'unsuitable',
      getQualityLevel(analysis.compositeScore?.overall || 0), // Use single source of truth
      (analysis.compositeScore?.overall || 0) >= threshold ? 'Yes' : 'No',
      (analysis.size / 1024 / 1024).toFixed(2),
      analysis.metadata?.camera.make || '',
      analysis.metadata?.camera.model || '',
      analysis.metadata?.settings.iso?.toString() || '',
      analysis.metadata?.settings.aperture?.toString() || '',
      analysis.metadata?.settings.shutterSpeed || '',
      analysis.metadata?.settings.focalLength?.toString() || '',
      analysis.processingDuration ? analysis.processingDuration.toFixed(1) : '',
      analysis.error ? 'Error' : 'Success'
    ];
  });
  
  // Add mission header if provided
  let csvContent = '';
  if (missionData?.name) {
    csvContent += `# Mission: ${escapeCSVCell(missionData.name)}\n`;
    if (missionData.date) csvContent += `# Date: ${escapeCSVCell(missionData.date)}\n`;
    if (missionData.location) csvContent += `# Location: ${escapeCSVCell(missionData.location)}\n`;
    if (missionData.operator) csvContent += `# Operator: ${escapeCSVCell(missionData.operator)}\n`;
    csvContent += `# Generated: ${new Date().toISOString()}\n`;
    csvContent += `# Threshold: ${threshold}\n\n`;
  }
  
  // Properly escape CSV cells according to RFC 4180
  csvContent += [headers, ...rows]
    .map(row => row.map(cell => escapeCSVCell(String(cell))).join(','))
    .join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const filename = missionData?.name 
    ? `${sanitizeFilename(missionData.name)}_quality_report_${new Date().toISOString().split('T')[0]}.csv`
    : `drone_image_quality_report_${new Date().toISOString().split('T')[0]}.csv`;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * Properly escapes CSV cell content according to RFC 4180
 */
const escapeCSVCell = (cell: string): string => {
  // If cell contains quotes, commas, or newlines, wrap in quotes and escape internal quotes
  if (cell.includes('"') || cell.includes(',') || cell.includes('\n') || cell.includes('\r')) {
    return `"${cell.replace(/"/g, '""')}"`;
  }
  return `"${cell}"`;
};

/**
 * Sanitizes filename for safe file system usage
 */
const sanitizeFilename = (filename: string): string => {
  return filename.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
};

/**
 * Formats numbers to specified decimal places
 */
const formatNumber = (value: number, decimalPlaces: number): string => {
  if (isNaN(value)) return '0';
  return value.toFixed(decimalPlaces);
};