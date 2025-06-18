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
 * Enhanced CSV export with better formatting and error handling
 * @param analyses - Array of image analyses
 * @param threshold - Quality threshold for recommendations
 */
export const exportQualityDataToCSV = (analyses: ImageAnalysis[], threshold: number) => {
  try {
    const headers = [
      'Filename', 'Composite Score', 'Blur Score', 'Exposure Score', 'Noise Score', 
      'Technical Score', 'Descriptor Score', 'Keypoint Count', 'Keypoint Density',
      'Feature Distribution', 'Photogrammetric Suitability', 'Recommendation', 
      'Recommended for Reconstruction', 'File Size (MB)', 'Camera Make', 'Camera Model', 
      'ISO', 'Aperture', 'Shutter Speed', 'Focal Length', 'Status', 'Error Message'
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
      analysis.error ? 'Error' : 'Success',
      analysis.error || ''
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `drone_image_quality_report_${new Date().toISOString().split('T')[0]}.csv`;
    
    // Ensure the link is added to the DOM for Firefox compatibility
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('CSV export completed successfully');
  } catch (error) {
    console.error('Failed to export CSV:', error);
    alert('Failed to export CSV file. Please try again.');
  }
};

/**
 * Enhanced text report export with better formatting
 * @param analyses - Array of image analyses
 * @param threshold - Quality threshold for recommendations
 */
export const exportDetailedReport = (analyses: ImageAnalysis[], threshold: number) => {
  try {
    const report = generateQualityReport(analyses, threshold);
    const reportContent = generateReportText(report, threshold);

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `drone_image_quality_detailed_report_${new Date().toISOString().split('T')[0]}.txt`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('Detailed report export completed successfully');
  } catch (error) {
    console.error('Failed to export detailed report:', error);
    alert('Failed to export detailed report. Please try again.');
  }
};

/**
 * Generates formatted text report content
 * @param report - Quality report data
 * @param threshold - Quality threshold used
 * @returns Formatted report text
 */
const generateReportText = (report: any, threshold: number): string => {
  return `
DRONE IMAGE QUALITY ANALYSIS REPORT
Generated: ${new Date().toLocaleString()}
Threshold: ${threshold}

SUMMARY STATISTICS
==================
Total Images: ${report.stats.totalImages}
Average Blur Score: ${report.stats.averageBlurScore.toFixed(2)}
Average Composite Score: ${report.stats.averageCompositeScore.toFixed(2)}
Average Descriptor Score: ${report.stats.averageDescriptorScore.toFixed(2)}
Average Keypoint Count: ${Math.round(report.stats.averageKeypointCount)}
Recommended for Reconstruction: ${report.stats.recommendedForReconstruction} (${((report.stats.recommendedForReconstruction / report.stats.totalImages) * 100).toFixed(1)}%)

QUALITY DISTRIBUTION
===================
Excellent (85-100): ${report.stats.excellentCount}
Good (70-84): ${report.stats.goodCount}
Acceptable (55-69): ${report.stats.acceptableCount}
Poor (40-54): ${report.stats.poorCount}
Unsuitable (0-39): ${report.stats.unsuitableCount}

DETAILED RESULTS
===============
${report.recommendations.map((r: any) => 
  `${r.filename}: Composite ${r.compositeScore} | Blur ${r.blurScore} | Descriptor ${r.descriptorScore} | Keypoints ${r.keypointCount} (${r.quality}) - ${r.recommended ? 'RECOMMENDED' : 'NOT RECOMMENDED'}`
).join('\n')}

RECOMMENDATIONS
==============
- Use images with composite scores ≥ ${threshold} for photogrammetry reconstruction
- Consider retaking images with scores below ${threshold}
- For high-precision work, consider using only images with scores ≥ 70
- Review images flagged as "poor" or "unsuitable" for potential issues
- Pay attention to descriptor scores and keypoint counts for feature matching quality

QUALITY ASSESSMENT NOTES
========================
- Overall quality considers blur, exposure, noise, technical factors, and feature quality
- Photogrammetric suitability heavily weights feature detection and distribution
- Inconsistencies between overall and photogrammetric scores indicate specific issues
- Low feature scores may downgrade otherwise good images for reconstruction purposes
    `;
};