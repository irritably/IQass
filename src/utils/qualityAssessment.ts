/**
 * Quality Assessment Utilities
 * 
 * This module provides functions for determining overall image quality
 * and generating quality-based recommendations.
 */

import { ImageAnalysis, CompositeQualityScore } from '../types';

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
 * @returns Detailed report with statistics and recommendations
 */
export const generateQualityReport = (analyses: ImageAnalysis[], threshold: number) => {
  const stats = calculateQualityStatistics(analyses, threshold);
  const recommendations = generateImageRecommendations(analyses, threshold);
  
  return { stats, recommendations };
};

/**
 * Calculates comprehensive quality statistics
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
      recommendedForReconstruction: 0
    };
  }

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
    recommendedForReconstruction: analyses.filter(a => (a.compositeScore?.overall || 0) >= threshold).length
  };
};

/**
 * Generates individual image recommendations
 * @param analyses - Array of image analyses
 * @param threshold - Quality threshold for recommendations
 * @returns Array of detailed recommendations for each image
 */
export const generateImageRecommendations = (analyses: ImageAnalysis[], threshold: number) => {
  return analyses.map(analysis => ({
    filename: analysis.name,
    blurScore: analysis.blurScore,
    compositeScore: analysis.compositeScore?.overall || 0,
    descriptorScore: analysis.descriptorAnalysis?.photogrammetricScore || 0,
    keypointCount: analysis.descriptorAnalysis?.keypointCount || 0,
    quality: analysis.compositeScore?.recommendation || 'unsuitable',
    recommended: (analysis.compositeScore?.overall || 0) >= threshold,
    fileSize: `${(analysis.size / 1024 / 1024).toFixed(2)} MB`,
    exposureScore: analysis.exposureAnalysis?.exposureScore || 0,
    noiseScore: analysis.noiseAnalysis?.noiseScore || 0,
    photogrammetricSuitability: analysis.descriptorAnalysis?.reconstructionSuitability || 'unsuitable',
    cameraInfo: analysis.metadata?.camera.make && analysis.metadata?.camera.model 
      ? `${analysis.metadata.camera.make} ${analysis.metadata.camera.model}`
      : 'Unknown'
  }));
};

/**
 * Exports quality data to CSV format
 * @param analyses - Array of image analyses
 * @param threshold - Quality threshold for recommendations
 */
export const exportQualityDataToCSV = (analyses: ImageAnalysis[], threshold: number) => {
  const headers = [
    'Filename', 'Composite Score', 'Blur Score', 'Exposure Score', 'Noise Score', 
    'Technical Score', 'Descriptor Score', 'Keypoint Count', 'Keypoint Density',
    'Feature Distribution', 'Photogrammetric Suitability', 'Recommendation', 
    'Recommended for Reconstruction', 'File Size (MB)', 'Camera Make', 'Camera Model', 
    'ISO', 'Aperture', 'Shutter Speed', 'Focal Length', 'Status'
  ];
  
  const rows = analyses.map(analysis => [
    analysis.name,
    analysis.compositeScore?.overall?.toString() || '0',
    analysis.blurScore.toString(),
    analysis.exposureAnalysis?.exposureScore?.toString() || '0',
    analysis.noiseAnalysis?.noiseScore?.toString() || '0',
    '0', // Technical score placeholder
    analysis.descriptorAnalysis?.photogrammetricScore?.toString() || '0',
    analysis.descriptorAnalysis?.keypointCount?.toString() || '0',
    analysis.descriptorAnalysis?.keypointDensity?.toFixed(2) || '0',
    analysis.descriptorAnalysis?.keypointDistribution?.uniformity?.toString() || '0',
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
    analysis.error ? 'Error' : 'Success'
  ]);
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `drone_image_quality_report_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};