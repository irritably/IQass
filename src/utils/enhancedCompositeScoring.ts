/**
 * Enhanced Composite Scoring with Detailed Breakdown
 * 
 * This module provides improved composite scoring with detailed breakdowns,
 * configurable weights, and comprehensive recommendation logic.
 */

import { CompositeScoreBreakdown, QualityThresholds } from '../types';
import { configManager } from './configurationManager';

/**
 * Calculate enhanced composite score with detailed breakdown
 */
export const calculateEnhancedCompositeScore = (
  blurScore: number,
  exposureScore: number,
  noiseScore: number,
  technicalScore: number,
  descriptorScore: number = 0,
  useCase: 'general' | 'photogrammetric' = 'general',
  sceneType: string = 'mixed'
): CompositeScoreBreakdown => {
  
  // Get appropriate weights based on use case
  const weights = configManager.getCompositeWeights(useCase);
  
  // Calculate individual contributions
  const components = {
    blur: {
      rawScore: blurScore,
      weight: weights.blur,
      contribution: blurScore * weights.blur
    },
    exposure: {
      rawScore: exposureScore,
      weight: weights.exposure,
      contribution: exposureScore * weights.exposure
    },
    noise: {
      rawScore: noiseScore,
      weight: weights.noise,
      contribution: noiseScore * weights.noise
    },
    technical: {
      rawScore: technicalScore,
      weight: weights.technical,
      contribution: technicalScore * weights.technical
    },
    descriptor: {
      rawScore: descriptorScore,
      weight: weights.descriptor,
      contribution: descriptorScore * weights.descriptor
    }
  };
  
  // Calculate overall score
  const overall = Math.round(
    components.blur.contribution +
    components.exposure.contribution +
    components.noise.contribution +
    components.technical.contribution +
    components.descriptor.contribution
  );
  
  // Determine classification and confidence
  const { classification, confidence, reasoning } = determineQualityClassification(
    overall, 
    components, 
    sceneType
  );
  
  return {
    overall,
    components,
    calculation: {
      method: useCase === 'photogrammetric' ? 'photogrammetric_specialized' : 'weighted_average',
      weightsUsed: weights,
      normalization: `Scene-adapted for ${sceneType} with ${useCase} use case`
    },
    recommendation: {
      classification,
      confidence,
      reasoning
    },
    
    // Legacy compatibility
    blur: blurScore,
    exposure: exposureScore,
    noise: noiseScore,
    technical: technicalScore,
    descriptor: descriptorScore,
    recommendation: classification
  };
};

/**
 * Determine quality classification with confidence and reasoning
 */
const determineQualityClassification = (
  overallScore: number,
  components: CompositeScoreBreakdown['components'],
  sceneType: string
): {
  classification: 'excellent' | 'good' | 'acceptable' | 'poor' | 'unsuitable';
  confidence: number;
  reasoning: string[];
} => {
  
  const thresholds = configManager.getAdaptiveThresholds(sceneType);
  const reasoning: string[] = [];
  let confidence = 100;
  
  // Determine base classification
  let classification: 'excellent' | 'good' | 'acceptable' | 'poor' | 'unsuitable';
  
  if (overallScore >= 85) {
    classification = 'excellent';
    reasoning.push('High overall composite score');
  } else if (overallScore >= 70) {
    classification = 'good';
    reasoning.push('Good overall composite score');
  } else if (overallScore >= 55) {
    classification = 'acceptable';
    reasoning.push('Acceptable composite score');
  } else if (overallScore >= 40) {
    classification = 'poor';
    reasoning.push('Below-average composite score');
  } else {
    classification = 'unsuitable';
    reasoning.push('Low composite score');
  }
  
  // Analyze individual component scores for confidence and reasoning
  const componentScores = [
    { name: 'blur', score: components.blur.rawScore, weight: components.blur.weight },
    { name: 'exposure', score: components.exposure.rawScore, weight: components.exposure.weight },
    { name: 'noise', score: components.noise.rawScore, weight: components.noise.weight },
    { name: 'descriptor', score: components.descriptor.rawScore, weight: components.descriptor.weight },
    { name: 'technical', score: components.technical.rawScore, weight: components.technical.weight }
  ];
  
  // Check for critical failures in high-weight components
  const criticalComponents = componentScores.filter(c => c.weight >= 0.2);
  const failedCritical = criticalComponents.filter(c => c.score < 40);
  
  if (failedCritical.length > 0) {
    const worstComponent = failedCritical.reduce((worst, current) => 
      current.score < worst.score ? current : worst
    );
    
    // Downgrade classification if critical component fails
    if (classification === 'excellent' && worstComponent.score < 30) {
      classification = 'good';
      confidence -= 20;
      reasoning.push(`Downgraded due to poor ${worstComponent.name} score (${worstComponent.score})`);
    } else if (classification === 'good' && worstComponent.score < 20) {
      classification = 'acceptable';
      confidence -= 25;
      reasoning.push(`Downgraded due to very poor ${worstComponent.name} score (${worstComponent.score})`);
    }
  }
  
  // Check for exceptional performance in key areas
  const exceptionalComponents = componentScores.filter(c => c.score >= 90 && c.weight >= 0.15);
  if (exceptionalComponents.length >= 2) {
    reasoning.push(`Exceptional performance in ${exceptionalComponents.map(c => c.name).join(' and ')}`);
    confidence += 10;
  }
  
  // Scene-specific adjustments
  if (sceneType === 'aerial_sky') {
    // For aerial imagery, be more lenient with exposure issues due to sky
    if (components.exposure.rawScore < 60 && components.blur.rawScore > 70) {
      reasoning.push('Aerial scene: exposure issues acceptable with good sharpness');
      confidence += 5;
    }
  } else if (sceneType === 'ground_detail') {
    // For ground detail, require higher feature scores
    if (components.descriptor.rawScore < 50) {
      reasoning.push('Ground detail scene: low feature score may affect reconstruction');
      confidence -= 10;
    }
  }
  
  // Check score consistency
  const scoreVariance = calculateScoreVariance(componentScores.map(c => c.score));
  if (scoreVariance > 1000) { // High variance
    confidence -= 15;
    reasoning.push('Inconsistent quality across different metrics');
  } else if (scoreVariance < 200) { // Low variance
    confidence += 5;
    reasoning.push('Consistent quality across all metrics');
  }
  
  // Ensure confidence is within bounds
  confidence = Math.max(10, Math.min(100, confidence));
  
  return { classification, confidence, reasoning };
};

/**
 * Calculate photogrammetric-specific score
 */
export const calculatePhotogrammetricScore = (
  blurScore: number,
  descriptorScore: number,
  exposureScore: number,
  noiseScore: number,
  sceneType: string = 'mixed'
): number => {
  
  const weights = configManager.getCompositeWeights('photogrammetric');
  
  return Math.round(
    descriptorScore * weights.descriptor +
    blurScore * weights.blur +
    exposureScore * weights.exposure +
    noiseScore * weights.noise
  );
};

/**
 * Get recommendation color classes for UI
 */
export const getRecommendationColor = (recommendation: string): string => {
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

/**
 * Get score color for UI display
 */
export const getScoreColor = (score: number): string => {
  if (score >= 85) return 'text-green-600';
  if (score >= 70) return 'text-blue-600';
  if (score >= 55) return 'text-yellow-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
};

/**
 * Generate detailed quality report
 */
export const generateQualityReport = (
  compositeScore: CompositeScoreBreakdown,
  sceneType: string = 'mixed'
): string => {
  const lines: string[] = [];
  
  lines.push(`Quality Assessment Report`);
  lines.push(`========================`);
  lines.push(`Overall Score: ${compositeScore.overall}/100 (${compositeScore.recommendation.classification})`);
  lines.push(`Confidence: ${compositeScore.recommendation.confidence}%`);
  lines.push(`Scene Type: ${sceneType}`);
  lines.push(`Analysis Method: ${compositeScore.calculation.method}`);
  lines.push('');
  
  lines.push(`Component Breakdown:`);
  lines.push(`-------------------`);
  Object.entries(compositeScore.components).forEach(([key, component]) => {
    lines.push(`${key.charAt(0).toUpperCase() + key.slice(1)}: ${component.rawScore}/100 (weight: ${(component.weight * 100).toFixed(0)}%, contribution: ${component.contribution.toFixed(1)})`);
  });
  lines.push('');
  
  lines.push(`Assessment Reasoning:`);
  lines.push(`--------------------`);
  compositeScore.recommendation.reasoning.forEach(reason => {
    lines.push(`• ${reason}`);
  });
  lines.push('');
  
  lines.push(`Recommendations:`);
  lines.push(`---------------`);
  const recommendations = generateRecommendations(compositeScore, sceneType);
  recommendations.forEach(rec => {
    lines.push(`• ${rec}`);
  });
  
  return lines.join('\n');
};

/**
 * Generate specific recommendations based on analysis
 */
export const generateRecommendations = (
  compositeScore: CompositeScoreBreakdown,
  sceneType: string = 'mixed'
): string[] => {
  const recommendations: string[] = [];
  const { components, overall, recommendation } = compositeScore;
  
  // Overall recommendations
  if (recommendation.classification === 'excellent') {
    recommendations.push('Image is excellent for photogrammetric reconstruction');
  } else if (recommendation.classification === 'good') {
    recommendations.push('Image is suitable for most photogrammetric applications');
  } else if (recommendation.classification === 'acceptable') {
    recommendations.push('Image is usable but may require additional overlap or careful processing');
  } else if (recommendation.classification === 'poor') {
    recommendations.push('Consider retaking this image if possible for better results');
  } else {
    recommendations.push('Image is not recommended for photogrammetric reconstruction');
  }
  
  // Component-specific recommendations
  if (components.blur.rawScore < 50) {
    recommendations.push('Improve camera stability or use faster shutter speed to reduce blur');
  }
  
  if (components.exposure.rawScore < 50) {
    if (sceneType === 'aerial_sky') {
      recommendations.push('Consider using graduated ND filter or HDR for aerial scenes with sky');
    } else {
      recommendations.push('Adjust exposure settings for better dynamic range');
    }
  }
  
  if (components.noise.rawScore < 50) {
    recommendations.push('Use lower ISO settings or better lighting conditions to reduce noise');
  }
  
  if (components.descriptor.rawScore < 50) {
    recommendations.push('Ensure adequate texture and features in the scene for good feature matching');
  }
  
  // Scene-specific recommendations
  if (sceneType === 'aerial_sky' && overall < 70) {
    recommendations.push('For aerial photography, ensure sufficient ground features are visible');
  } else if (sceneType === 'ground_detail' && components.descriptor.rawScore < 60) {
    recommendations.push('Ground detail scenes require high feature density for good reconstruction');
  }
  
  return recommendations;
};

/**
 * Helper function to calculate score variance
 */
const calculateScoreVariance = (scores: number[]): number => {
  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
  return variance;
};

/**
 * Legacy compatibility function
 */
export const calculateCompositeScore = (
  blurScore: number,
  exposureScore: number,
  noiseScore: number,
  technicalScore: number,
  descriptorScore: number = 0
): CompositeScoreBreakdown => {
  return calculateEnhancedCompositeScore(
    blurScore,
    exposureScore,
    noiseScore,
    technicalScore,
    descriptorScore,
    'general',
    'mixed'
  );
};