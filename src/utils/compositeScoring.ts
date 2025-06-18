import { CompositeQualityScore } from '../types';

export const calculateCompositeScore = (
  blurScore: number,
  exposureScore: number,
  noiseScore: number
): CompositeQualityScore => {
  // Simplified weighted scoring system focused on core image quality
  const weights = {
    blur: 0.40,        // 40% - Most important for image sharpness
    exposure: 0.30,    // 30% - Critical for image quality
    noise: 0.30        // 30% - Important for detail preservation
  };
  
  const overall = Math.round(
    blurScore * weights.blur +
    exposureScore * weights.exposure +
    noiseScore * weights.noise
  );
  
  // Determine recommendation based on composite score
  let recommendation: CompositeQualityScore['recommendation'];
  if (overall >= 85) recommendation = 'excellent';
  else if (overall >= 70) recommendation = 'good';
  else if (overall >= 55) recommendation = 'acceptable';
  else if (overall >= 40) recommendation = 'poor';
  else recommendation = 'unsuitable';
  
  return {
    blur: blurScore,
    exposure: exposureScore,
    noise: noiseScore,
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
  if (score >= 85) return 'text-green-600';
  if (score >= 70) return 'text-blue-600';
  if (score >= 55) return 'text-yellow-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
};