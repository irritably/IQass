import { CompositeQualityScore, QualityWeights } from '../types';
import { DEFAULT_QUALITY_WEIGHTS, QUALITY_THRESHOLDS } from './config';

/**
 * Calculates composite quality score with configurable weights
 */
export const calculateCompositeScore = (
  blurScore: number,
  exposureScore: number,
  noiseScore: number,
  technicalScore: number,
  descriptorScore: number = 0,
  customWeights?: QualityWeights
): CompositeQualityScore => {
  // Use custom weights or default configuration
  const weights = customWeights || DEFAULT_QUALITY_WEIGHTS;
  
  const overall = Math.round(
    blurScore * weights.blur +
    exposureScore * weights.exposure +
    noiseScore * weights.noise +
    technicalScore * weights.technical +
    descriptorScore * weights.descriptor
  );
  
  // Determine recommendation based on composite score with configurable thresholds
  let recommendation: CompositeQualityScore['recommendation'];
  if (overall >= QUALITY_THRESHOLDS.excellent) recommendation = 'excellent';
  else if (overall >= QUALITY_THRESHOLDS.good) recommendation = 'good';
  else if (overall >= QUALITY_THRESHOLDS.acceptable) recommendation = 'acceptable';
  else if (overall >= QUALITY_THRESHOLDS.poor) recommendation = 'poor';
  else recommendation = 'unsuitable';
  
  return {
    blur: blurScore,
    exposure: exposureScore,
    noise: noiseScore,
    technical: technicalScore,
    descriptor: descriptorScore,
    overall,
    recommendation
  };
};

export const getRecommendationColor = (recommendation: CompositeQualityScore['recommendation']): string => {
  switch (recommendation) {
    case 'excellent':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'good':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'acceptable':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'poor':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'unsuitable':
      return 'text-red-600 bg-red-50 border-red-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

export const getScoreColor = (score: number): string => {
  if (score >= QUALITY_THRESHOLDS.excellent) return 'text-green-600';
  if (score >= QUALITY_THRESHOLDS.good) return 'text-blue-600';
  if (score >= QUALITY_THRESHOLDS.acceptable) return 'text-yellow-600';
  if (score >= QUALITY_THRESHOLDS.poor) return 'text-orange-600';
  return 'text-red-600';
};

// Enhanced photogrammetric quality assessment
export const calculatePhotogrammetricSuitability = (
  blurScore: number,
  descriptorScore: number,
  exposureScore: number,
  noiseScore: number
): number => {
  // Specialized scoring for photogrammetric reconstruction
  const photogrammetricWeights = {
    descriptor: 0.40,  // 40% - Most critical for feature matching
    blur: 0.30,        // 30% - Essential for sharp features
    exposure: 0.20,    // 20% - Important for consistent lighting
    noise: 0.10        // 10% - Less critical but still relevant
  };
  
  return Math.round(
    descriptorScore * photogrammetricWeights.descriptor +
    blurScore * photogrammetricWeights.blur +
    exposureScore * photogrammetricWeights.exposure +
    noiseScore * photogrammetricWeights.noise
  );
};