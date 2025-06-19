/**
 * Enhanced Quality Assessment Utilities
 * 
 * This module provides functions for determining overall image quality
 * and generating quality-based recommendations with improved formatting.
 */

import { ImageAnalysis, CompositeQualityScore, MissionMetadata } from '../types';
import { EXPORT_CONFIG } from './config';

/**
 * Determines quality level based on composite score
 * @param compositeScore - The composite quality score (0-100)
 * @returns Quality level classification
 */
export const getQualityLevel = (compositeScore: number): ImageAnalysis['quality'] => {
  if (compositeScore >= 85) return 'excellent';
  if (compositeScore >= 70) return 'good';
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
 * Calculates comprehensive quality statistics with performance metrics
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

  const processingTimes = analyses
    .filter(a => a.processingDuration)
    .map(a => a.processingDuration!);

  return {
    totalImages: analyses.length,
    excellentCount: analyses.filter(a => a.compositeScore?.recommendation === 'excellent').length,
    goodCount: analyses.filter(a => a.compositeScore?.recommendation === 'good').length,
    acceptableCount: analyses.filter(a => a.compositeScore?.recommendation === 'acceptable').length,
    poorCount: analyses.filter(a => a.compositeScore?.recommendation === 'poor').length,
    unsuitableCount: analyses.filter(a => a.compositeScore?.recommendation === 'unsuitable').length,
    averageBlurScore: analyses.reduce((sum, a) => sum + a.blurScore, 0) / analyses.length,
    averageCompositeScore: analyses.reduce((sum, a) => sum + (a.compositeScore?.overall || 0), 0) / analyses.length,
    averageDescriptorScore: analyses.reduce((sum, a) => sum + (a.descriptorAnalysis?.photogrammetricScore || 0), 0) / analyses.length,
    averageKeypointCount: analyses.reduce((sum, a) => sum + (a.descriptorAnalysis?.keypointCount || 0), 0) / analyses.length,
    averageProcessingTime: processingTimes.length > 0 
      ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length 
      : 0,
    recommendedForReconstruction: analyses.filter(a => (a.compositeScore?.overall || 0) >= threshold).length
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
    quality: analysis.compositeScore?.recommendation || 'unsuitable',
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
 * Exports quality data to CSV format with improved formatting
 * @param analyses - Array of image analyses
 * @param threshold - Quality threshold for recommendations
 * @param missionData - Optional mission metadata
 */
export const exportQualityDataToCSV = (
  analyses: ImageAnalysis[], 
  threshold: number,
  missionData?: MissionMetadata
) => {
  const headers = [
    'Filename', 'Composite Score', 'Blur Score', 'Exposure Score', 'Noise Score', 
    'Technical Score', 'Descriptor Score', 'Keypoint Count', 'Keypoint Density',
    'Feature Distribution', 'Photogrammetric Suitability', 'Recommendation', 
    'Recommended for Reconstruction', 'File Size (MB)', 'Camera Make', 'Camera Model', 
    'ISO', 'Aperture', 'Shutter Speed', 'Focal Length', 'Processing Time (ms)', 'Status'
  ];
  
  const rows = analyses.map(analysis => [
    analysis.name,
    formatNumber(analysis.compositeScore?.overall || 0, EXPORT_CONFIG.csvDecimalPlaces),
    formatNumber(analysis.blurScore, EXPORT_CONFIG.csvDecimalPlaces),
    formatNumber(analysis.exposureAnalysis?.exposureScore || 0, EXPORT_CONFIG.csvDecimalPlaces),
    formatNumber(analysis.noiseAnalysis?.noiseScore || 0, EXPORT_CONFIG.csvDecimalPlaces),
    '0', // Technical score placeholder - properly calculated in metadata extraction
    formatNumber(analysis.descriptorAnalysis?.photogrammetricScore || 0, EXPORT_CONFIG.csvDecimalPlaces),
    (analysis.descriptorAnalysis?.keypointCount || 0).toString(),
    formatNumber(analysis.descriptorAnalysis?.keypointDensity || 0, EXPORT_CONFIG.csvDecimalPlaces),
    formatNumber(analysis.descriptorAnalysis?.keypointDistribution?.uniformity || 0, EXPORT_CONFIG.csvDecimalPlaces),
    analysis.descriptorAnalysis?.reconstructionSuitability || 'unsuitable',
    analysis.compositeScore?.recommendation || 'unsuitable',
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
  ]);
  
  // Add mission header if provided
  let csvContent = '';
  if (missionData?.name) {
    csvContent += `# Mission: ${missionData.name}\n`;
    if (missionData.date) csvContent += `# Date: ${missionData.date}\n`;
    if (missionData.location) csvContent += `# Location: ${missionData.location}\n`;
    if (missionData.operator) csvContent += `# Operator: ${missionData.operator}\n`;
    csvContent += `# Generated: ${new Date().toISOString()}\n`;
    csvContent += `# Threshold: ${threshold}\n\n`;
  }
  
  csvContent += [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const filename = missionData?.name 
    ? `${missionData.name}_quality_report_${new Date().toISOString().split('T')[0]}.csv`
    : `drone_image_quality_report_${new Date().toISOString().split('T')[0]}.csv`;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * Formats numbers to specified decimal places
 */
const formatNumber = (value: number, decimalPlaces: number): string => {
  return value.toFixed(decimalPlaces);
};