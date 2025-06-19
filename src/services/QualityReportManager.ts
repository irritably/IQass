/**
 * Quality Report Manager Service
 * 
 * This service encapsulates quality reporting functionality, providing
 * a centralized approach to managing analysis statistics and report generation.
 */

import { ImageAnalysis, AnalysisStats, MissionMetadata } from '../types';
import { calculateQualityStatistics, generateImageRecommendations, getQualityLevel } from '../utils/qualityAssessment';

export class QualityReportManager {
  private cachedStats: AnalysisStats | null = null;
  private lastAnalysesHash: string = '';
  private lastThreshold: number = -1;

  constructor(
    private analyses: ImageAnalysis[],
    private threshold: number,
    private missionData?: MissionMetadata
  ) {}

  /**
   * Updates the analyses and threshold, invalidating cache if needed
   */
  updateData(analyses: ImageAnalysis[], threshold: number, missionData?: MissionMetadata): void {
    const newHash = this.generateAnalysesHash(analyses);
    
    if (newHash !== this.lastAnalysesHash || threshold !== this.lastThreshold) {
      this.cachedStats = null;
      this.lastAnalysesHash = newHash;
      this.lastThreshold = threshold;
    }
    
    this.analyses = analyses;
    this.threshold = threshold;
    this.missionData = missionData;
  }

  /**
   * Gets quality statistics with caching for performance
   */
  getStatistics(): AnalysisStats {
    if (!this.cachedStats) {
      this.cachedStats = this.calculateEnhancedStatistics();
    }
    return this.cachedStats;
  }

  /**
   * Generates comprehensive quality report
   */
  generateReport() {
    const stats = this.getStatistics();
    const recommendations = generateImageRecommendations(this.analyses, this.threshold);
    
    return {
      stats,
      recommendations,
      missionData: this.missionData,
      metadata: {
        generatedAt: new Date().toISOString(),
        threshold: this.threshold,
        totalImages: this.analyses.length,
        version: '1.0'
      }
    };
  }

  /**
   * Gets quality distribution breakdown
   */
  getQualityDistribution() {
    const stats = this.getStatistics();
    return {
      excellent: stats.excellentCount,
      good: stats.goodCount,
      acceptable: stats.acceptableCount,
      poor: stats.poorCount,
      unsuitable: stats.unsuitableCount,
      total: stats.totalImages
    };
  }

  /**
   * Gets performance metrics
   */
  getPerformanceMetrics() {
    const stats = this.getStatistics();
    const validProcessingTimes = this.analyses
      .filter(a => a.processingDuration && !isNaN(a.processingDuration))
      .map(a => a.processingDuration!);

    if (validProcessingTimes.length === 0) {
      return {
        averageProcessingTime: 0,
        totalProcessingTime: 0,
        fastestImage: null,
        slowestImage: null,
        throughput: 0
      };
    }

    const totalTime = validProcessingTimes.reduce((sum, time) => sum + time, 0);
    const minTime = Math.min(...validProcessingTimes);
    const maxTime = Math.max(...validProcessingTimes);

    return {
      averageProcessingTime: stats.averageProcessingTime,
      totalProcessingTime: totalTime,
      fastestImage: this.analyses.find(a => a.processingDuration === minTime),
      slowestImage: this.analyses.find(a => a.processingDuration === maxTime),
      throughput: validProcessingTimes.length / (totalTime / 1000) // images per second
    };
  }

  /**
   * Gets camera statistics breakdown
   */
  getCameraStatistics() {
    const cameraStats: { [key: string]: number } = {};
    
    for (const analysis of this.analyses) {
      const camera = analysis.metadata?.camera;
      if (camera?.make && camera?.model) {
        const cameraKey = `${camera.make} ${camera.model}`;
        cameraStats[cameraKey] = (cameraStats[cameraKey] || 0) + 1;
      }
    }
    
    return cameraStats;
  }

  /**
   * Validates data consistency
   */
  validateDataConsistency(): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Check for quality classification consistency
    for (const analysis of this.analyses) {
      const calculatedQuality = getQualityLevel(analysis.compositeScore?.overall || 0);
      if (analysis.quality !== calculatedQuality) {
        issues.push(`Quality mismatch for ${analysis.name}: stored=${analysis.quality}, calculated=${calculatedQuality}`);
      }
    }
    
    // Check for missing critical data
    const missingCompositeScores = this.analyses.filter(a => !a.compositeScore).length;
    if (missingCompositeScores > 0) {
      issues.push(`${missingCompositeScores} images missing composite scores`);
    }
    
    // Check for invalid processing times
    const invalidTimes = this.analyses.filter(a => 
      a.processingDuration !== undefined && (isNaN(a.processingDuration) || a.processingDuration < 0)
    ).length;
    if (invalidTimes > 0) {
      issues.push(`${invalidTimes} images have invalid processing times`);
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Enhanced statistics calculation with additional metrics
   */
  private calculateEnhancedStatistics(): AnalysisStats {
    const baseStats = calculateQualityStatistics(this.analyses, this.threshold);
    const cameraStats = this.getCameraStatistics();
    
    // Calculate additional exposure and noise averages
    const validExposureScores = this.analyses
      .filter(a => a.exposureAnalysis?.exposureScore !== undefined)
      .map(a => a.exposureAnalysis!.exposureScore);
    
    const validNoiseScores = this.analyses
      .filter(a => a.noiseAnalysis?.noiseScore !== undefined)
      .map(a => a.noiseAnalysis!.noiseScore);
    
    const averageExposureScore = validExposureScores.length > 0
      ? validExposureScores.reduce((sum, score) => sum + score, 0) / validExposureScores.length
      : 0;
    
    const averageNoiseScore = validNoiseScores.length > 0
      ? validNoiseScores.reduce((sum, score) => sum + score, 0) / validNoiseScores.length
      : 0;

    return {
      ...baseStats,
      averageExposureScore,
      averageNoiseScore,
      cameraStats,
      qualityDistribution: {
        excellent: baseStats.excellentCount,
        good: baseStats.goodCount,
        acceptable: baseStats.acceptableCount,
        poor: baseStats.poorCount,
        unsuitable: baseStats.unsuitableCount
      }
    };
  }

  /**
   * Generates a hash of analyses for cache invalidation
   */
  private generateAnalysesHash(analyses: ImageAnalysis[]): string {
    const hashData = analyses.map(a => `${a.id}-${a.compositeScore?.overall || 0}`).join('|');
    return btoa(hashData).slice(0, 16); // Simple hash for cache invalidation
  }
}

/**
 * Factory function to create a QualityReportManager instance
 */
export const createQualityReportManager = (
  analyses: ImageAnalysis[],
  threshold: number,
  missionData?: MissionMetadata
): QualityReportManager => {
  return new QualityReportManager(analyses, threshold, missionData);
};