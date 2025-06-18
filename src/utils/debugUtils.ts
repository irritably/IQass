/**
 * Debug Utilities for Image Analysis
 * 
 * This module provides comprehensive debugging tools for identifying and fixing
 * critical issues in the image analysis pipeline.
 */

import { ImageAnalysis, ExposureAnalysis, DescriptorAnalysis, CompositeQualityScore } from '../types';

/**
 * Debug blur score calculation with detailed analysis
 */
export const debugBlurScore = (
  imageData: ImageData, 
  blurScore: number, 
  laplacianVariance: number
) => {
  if (process.env.NODE_ENV !== 'development') return;

  console.group("🔍 Blur Analysis Debug");
  console.log("Image dimensions:", imageData.width, "x", imageData.height);
  console.log("Raw Laplacian Variance:", laplacianVariance);
  console.log("Applied Log Normalization:", Math.log(laplacianVariance + 1));
  console.log("Scaling factor (15x):", Math.log(laplacianVariance + 1) * 15);
  console.log("Final Blur Score (0-100):", blurScore);
  
  // Validate reasonable ranges
  if (laplacianVariance < 10) {
    console.warn("⚠️ Very low variance - possibly overblurred or uniform image");
  }
  if (laplacianVariance > 10000) {
    console.warn("⚠️ Extremely high variance - check calculation or very noisy image");
  }
  
  // Scene analysis
  const pixelCount = imageData.width * imageData.height;
  const avgVariancePerPixel = laplacianVariance / pixelCount;
  console.log("Average variance per pixel:", avgVariancePerPixel.toFixed(4));
  
  // Threshold recommendations
  if (blurScore < 30) {
    console.log("📊 Recommendation: Image likely unsuitable for photogrammetry");
  } else if (blurScore < 50) {
    console.log("📊 Recommendation: Marginal quality - review manually");
  } else if (blurScore > 80) {
    console.log("📊 Recommendation: Excellent sharpness for reconstruction");
  }
  
  console.groupEnd();
  
  return {
    laplacianVariance,
    normalizedScore: Math.log(laplacianVariance + 1) * 15,
    avgVariancePerPixel,
    recommendation: getBlurRecommendation(blurScore)
  };
};

/**
 * Debug exposure analysis with validation
 */
export const debugExposureAnalysis = (
  imageData: ImageData, 
  exposureAnalysis: ExposureAnalysis
) => {
  if (process.env.NODE_ENV !== 'development') return;

  console.group("📸 Exposure Analysis Debug");
  
  const { data } = imageData;
  
  // Validate histogram calculations
  const histogram = new Array(256).fill(0);
  const luminanceValues: number[] = [];
  
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    histogram[Math.floor(lum)]++;
    luminanceValues.push(lum);
  }
  
  // Verify percentile calculations
  const sortedPixels = [...luminanceValues].sort((a, b) => a - b);
  const p5 = sortedPixels[Math.floor(sortedPixels.length * 0.05)];
  const p95 = sortedPixels[Math.floor(sortedPixels.length * 0.95)];
  const calculatedDynamicRange = p95 - p5;
  
  console.log("Exposure Metrics:");
  console.log("  Overexposure %:", exposureAnalysis.overexposurePercentage);
  console.log("  Underexposure %:", exposureAnalysis.underexposurePercentage);
  console.log("  Dynamic Range (reported):", exposureAnalysis.dynamicRange);
  console.log("  Dynamic Range (calculated):", calculatedDynamicRange.toFixed(1));
  console.log("  Histogram Balance:", exposureAnalysis.histogramBalance);
  console.log("  Average Brightness:", exposureAnalysis.averageBrightness);
  
  // Validate percentile calculations
  console.log("Percentile Validation:");
  console.log("  P5:", p5.toFixed(1));
  console.log("  P95:", p95.toFixed(1));
  console.log("  Range Check:", Math.abs(calculatedDynamicRange - exposureAnalysis.dynamicRange) < 1 ? "✅ PASS" : "❌ FAIL");
  
  // Check for unrealistic values
  if (exposureAnalysis.overexposurePercentage > 50) {
    console.warn("⚠️ Excessive overexposure detected - may indicate processing error");
  }
  if (exposureAnalysis.dynamicRange < 50) {
    console.warn("⚠️ Very low dynamic range - check calculation or uniform image");
  }
  if (exposureAnalysis.averageBrightness < 20 || exposureAnalysis.averageBrightness > 235) {
    console.warn("⚠️ Extreme brightness values detected");
  }
  
  // Histogram analysis
  const peakBin = histogram.indexOf(Math.max(...histogram));
  const histogramSpread = histogram.filter(count => count > 0).length;
  
  console.log("Histogram Analysis:");
  console.log("  Peak bin:", peakBin, "(brightness level)");
  console.log("  Histogram spread:", histogramSpread, "bins");
  console.log("  Distribution:", getHistogramDistribution(histogram));
  
  console.groupEnd();
  
  return {
    calculatedDynamicRange,
    percentiles: { p5, p95 },
    histogramPeak: peakBin,
    histogramSpread,
    validation: {
      dynamicRangeMatch: Math.abs(calculatedDynamicRange - exposureAnalysis.dynamicRange) < 1,
      reasonableOverexposure: exposureAnalysis.overexposurePercentage <= 50,
      reasonableUnderexposure: exposureAnalysis.underexposurePercentage <= 50,
      reasonableBrightness: exposureAnalysis.averageBrightness >= 20 && exposureAnalysis.averageBrightness <= 235
    }
  };
};

/**
 * Debug feature detection with comprehensive analysis
 */
export const debugFeatureDetection = (
  descriptorAnalysis: DescriptorAnalysis, 
  imageData: ImageData
) => {
  if (process.env.NODE_ENV !== 'development') return;

  console.group("🎯 Feature Detection Debug");
  
  const { keypointCount, featureTypes, keypointDistribution } = descriptorAnalysis;
  const total = Object.values(featureTypes).reduce((sum, count) => sum + count, 0);
  const imageArea = imageData.width * imageData.height;
  
  console.log("Feature Detection Results:");
  console.log("  Total keypoints:", keypointCount);
  console.log("  Image dimensions:", imageData.width, "x", imageData.height);
  console.log("  Density:", descriptorAnalysis.keypointDensity.toFixed(2), "per 1000 pixels");
  
  console.log("Feature Type Distribution:");
  Object.entries(featureTypes).forEach(([type, count]) => {
    const percentage = total > 0 ? (count / total * 100).toFixed(1) : "0.0";
    console.log(`    ${type}: ${count} (${percentage}%)`);
  });
  
  console.log("Spatial Distribution:");
  console.log("  Uniformity:", keypointDistribution.uniformity + "%");
  console.log("  Coverage:", keypointDistribution.coverage + "%");
  console.log("  Clustering:", keypointDistribution.clustering);
  
  // Check for algorithm conflicts
  if (keypointDistribution.clustering > 80) {
    console.warn("⚠️ High clustering detected - may indicate algorithm bias or poor distribution");
  }
  
  // Validate density calculations
  const expectedDensity = keypointCount / (imageArea / 1000);
  const densityDiff = Math.abs(expectedDensity - descriptorAnalysis.keypointDensity);
  console.log("Density Validation:");
  console.log("  Expected:", expectedDensity.toFixed(2));
  console.log("  Reported:", descriptorAnalysis.keypointDensity.toFixed(2));
  console.log("  Difference:", densityDiff.toFixed(2), densityDiff < 0.1 ? "✅ PASS" : "❌ FAIL");
  
  // Feature quality assessment
  const qualityMetrics = descriptorAnalysis.descriptorQuality;
  console.log("Feature Quality:");
  console.log("  Distinctiveness:", qualityMetrics.distinctiveness);
  console.log("  Repeatability:", qualityMetrics.repeatability);
  console.log("  Matchability:", qualityMetrics.matchability);
  
  // Recommendations based on analysis
  const recommendations = generateFeatureRecommendations(descriptorAnalysis, imageArea);
  console.log("Recommendations:", recommendations);
  
  console.groupEnd();
  
  return {
    totalFeatures: total,
    densityValidation: densityDiff < 0.1,
    distributionQuality: getDistributionQuality(keypointDistribution),
    recommendations
  };
};

/**
 * Debug composite scoring with weight analysis
 */
export const debugCompositeScoring = (
  compositeScore: CompositeQualityScore, 
  individualScores: Record<string, number>
) => {
  if (process.env.NODE_ENV !== 'development') return;

  console.group("🏆 Composite Scoring Debug");
  
  const weights = { blur: 0.3, exposure: 0.25, noise: 0.2, technical: 0.1, descriptor: 0.15 };
  
  console.log("Individual Scores:");
  let calculatedTotal = 0;
  
  Object.entries(individualScores).forEach(([key, value]) => {
    if (weights[key as keyof typeof weights]) {
      const weighted = value * weights[key as keyof typeof weights];
      calculatedTotal += weighted;
      console.log(`  ${key}: ${value} (weight: ${weights[key as keyof typeof weights]}, weighted: ${weighted.toFixed(1)})`);
    }
  });
  
  console.log("Composite Score Validation:");
  console.log("  Reported overall:", compositeScore.overall);
  console.log("  Calculated total:", calculatedTotal.toFixed(1));
  console.log("  Difference:", Math.abs(compositeScore.overall - calculatedTotal).toFixed(1));
  console.log("  Validation:", Math.abs(compositeScore.overall - calculatedTotal) < 1 ? "✅ PASS" : "❌ FAIL");
  
  // Check for score conflicts
  const scores = Object.values(individualScores);
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);
  const scoreDiff = maxScore - minScore;
  
  console.log("Score Analysis:");
  console.log("  Score range:", minScore.toFixed(1), "-", maxScore.toFixed(1));
  console.log("  Score variance:", scoreDiff.toFixed(1));
  
  if (scoreDiff > 50) {
    console.warn("⚠️ Large score variance detected - review individual metrics");
    
    // Identify problematic scores
    Object.entries(individualScores).forEach(([key, score]) => {
      if (score < 30 && maxScore > 80) {
        console.warn(`  ${key} score (${score}) significantly lower than others`);
      }
    });
  }
  
  // Weight optimization suggestions
  const weightOptimization = analyzeWeightOptimization(individualScores, compositeScore.recommendation);
  console.log("Weight Analysis:", weightOptimization);
  
  console.groupEnd();
  
  return {
    calculatedScore: calculatedTotal,
    scoreVariance: scoreDiff,
    validation: Math.abs(compositeScore.overall - calculatedTotal) < 1,
    weightOptimization
  };
};

/**
 * Create consistency monitor for tracking analysis patterns
 */
export const createConsistencyMonitor = () => {
  const analysisHistory: any[] = [];
  const MAX_HISTORY = 50;
  
  return {
    recordAnalysis(result: ImageAnalysis) {
      const record = {
        timestamp: Date.now(),
        filename: result.name,
        scores: {
          blur: result.blurScore,
          composite: result.compositeScore?.overall || 0,
          exposure: result.exposureAnalysis?.exposureScore || 0,
          noise: result.noiseAnalysis?.noiseScore || 0,
          descriptor: result.descriptorAnalysis?.photogrammetricScore || 0
        },
        imageSize: result.file.size,
        dimensions: {
          width: 0, // Would need to extract from processing
          height: 0
        }
      };
      
      analysisHistory.push(record);
      
      // Keep only recent history
      if (analysisHistory.length > MAX_HISTORY) {
        analysisHistory.shift();
      }
      
      // Check for scoring drift
      this.checkScoringDrift();
    },
    
    checkScoringDrift() {
      if (analysisHistory.length < 20) return;
      
      const recent = analysisHistory.slice(-10);
      const older = analysisHistory.slice(-20, -10);
      
      Object.keys(recent[0].scores).forEach(scoreType => {
        const avgRecent = recent.reduce((sum, r) => sum + r.scores[scoreType], 0) / 10;
        const avgOlder = older.reduce((sum, r) => sum + r.scores[scoreType], 0) / 10;
        const drift = Math.abs(avgRecent - avgOlder);
        
        if (drift > 10) {
          console.warn(`📊 Scoring drift detected in ${scoreType}:`, 
            `Recent avg: ${avgRecent.toFixed(1)}, Older avg: ${avgOlder.toFixed(1)}, Drift: ${drift.toFixed(1)}`);
        }
      });
    },
    
    getStatistics() {
      if (analysisHistory.length === 0) return null;
      
      const stats = {
        totalAnalyses: analysisHistory.length,
        scoreAverages: {} as Record<string, number>
      };
      
      // Calculate score averages
      Object.keys(analysisHistory[0].scores).forEach(scoreType => {
        stats.scoreAverages[scoreType] = analysisHistory.reduce((sum, r) => sum + r.scores[scoreType], 0) / analysisHistory.length;
      });
      
      return stats;
    }
  };
};

// Helper functions

const getBlurRecommendation = (score: number): string => {
  if (score > 80) return "excellent";
  if (score > 60) return "good";
  if (score > 40) return "acceptable";
  if (score > 20) return "poor";
  return "unsuitable";
};

const getHistogramDistribution = (histogram: number[]) => {
  const total = histogram.reduce((sum, count) => sum + count, 0);
  const shadows = histogram.slice(0, 85).reduce((sum, count) => sum + count, 0) / total * 100;
  const midtones = histogram.slice(85, 170).reduce((sum, count) => sum + count, 0) / total * 100;
  const highlights = histogram.slice(170, 256).reduce((sum, count) => sum + count, 0) / total * 100;
  
  return {
    shadows: shadows.toFixed(1) + "%",
    midtones: midtones.toFixed(1) + "%",
    highlights: highlights.toFixed(1) + "%"
  };
};

const generateFeatureRecommendations = (analysis: DescriptorAnalysis, imageArea: number): string[] => {
  const recommendations: string[] = [];
  
  if (analysis.keypointCount < 100) {
    recommendations.push("Low feature count - consider images with more texture");
  }
  
  if (analysis.keypointDensity < 0.5) {
    recommendations.push("Low feature density - may affect matching quality");
  }
  
  if (analysis.keypointDistribution.uniformity < 50) {
    recommendations.push("Poor feature distribution - features clustered in small areas");
  }
  
  if (analysis.keypointDistribution.coverage < 60) {
    recommendations.push("Low coverage - large areas without features");
  }
  
  if (analysis.descriptorQuality.matchability < 60) {
    recommendations.push("Low matchability - features may be difficult to match between images");
  }
  
  if (recommendations.length === 0) {
    recommendations.push("Good feature distribution and quality for photogrammetry");
  }
  
  return recommendations;
};

const getDistributionQuality = (distribution: DescriptorAnalysis['keypointDistribution']): string => {
  const score = (distribution.uniformity + distribution.coverage) / 2 - distribution.clustering / 2;
  if (score > 70) return "excellent";
  if (score > 50) return "good";
  if (score > 30) return "acceptable";
  return "poor";
};

const analyzeWeightOptimization = (scores: Record<string, number>, recommendation: string): string[] => {
  const suggestions: string[] = [];
  
  // For drone imagery, blur and features are most critical
  if (scores.blur < 50 && scores.descriptor < 50) {
    suggestions.push("Consider increasing blur and descriptor weights for drone imagery");
  }
  
  // If exposure is consistently problematic for aerial images
  if (scores.exposure < 40 && scores.blur > 70) {
    suggestions.push("Exposure weight may be too high for aerial imagery with sky");
  }
  
  // If noise is consistently good, weight might be too high
  if (scores.noise > 80 && recommendation !== "excellent") {
    suggestions.push("Noise weight might be too high if consistently good");
  }
  
  return suggestions.length > 0 ? suggestions : ["Current weights appear balanced"];
};