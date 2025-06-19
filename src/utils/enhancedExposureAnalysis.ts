import { ExposureAnalysis } from '../types';
import { EXPOSURE_WEIGHTS } from './config';

export const analyzeEnhancedExposure = (imageData: ImageData): ExposureAnalysis => {
  const { data, width, height } = imageData;
  const totalPixels = width * height;
  
  // Convert RGB to YCrCb color space for better exposure analysis
  const yCrCbData = convertToYCrCb(data);
  
  // Calculate basic exposure metrics
  const basicMetrics = calculateBasicExposureMetrics(yCrCbData.y, width, height);
  
  // Calculate enhanced spatial and color metrics
  const spatialMetrics = calculateSpatialExposureMetrics(yCrCbData.y, width, height);
  const colorMetrics = calculateColorBalance(yCrCbData);
  
  // Calculate perceptual exposure score using advanced algorithms
  const perceptualScore = calculatePerceptualExposureScore(yCrCbData, width, height);
  
  // Apply bias correction and normalization
  const correctedMetrics = applyBiasCorrection(basicMetrics, spatialMetrics);
  
  // Calculate weighting contributions for documentation
  const weightingContribution = {
    highlightRecovery: EXPOSURE_WEIGHTS.highlightRecovery,
    shadowDetail: EXPOSURE_WEIGHTS.shadowDetail,
    localContrast: EXPOSURE_WEIGHTS.localContrast
  };
  
  return {
    ...basicMetrics,
    ...spatialMetrics,
    colorBalance: colorMetrics,
    perceptualExposureScore: perceptualScore,
    exposureScore: calculateEnhancedExposureScore(basicMetrics, spatialMetrics, perceptualScore),
    weightingContribution
  };
};

interface YCrCbData {
  y: Float32Array;  // Luminance
  cr: Float32Array; // Red chrominance
  cb: Float32Array; // Blue chrominance
}

const convertToYCrCb = (rgbData: Uint8ClampedArray): YCrCbData => {
  const pixelCount = rgbData.length / 4;
  const y = new Float32Array(pixelCount);
  const cr = new Float32Array(pixelCount);
  const cb = new Float32Array(pixelCount);
  
  for (let i = 0; i < rgbData.length; i += 4) {
    const r = rgbData[i] / 255;
    const g = rgbData[i + 1] / 255;
    const b = rgbData[i + 2] / 255;
    
    const pixelIndex = i / 4;
    
    // ITU-R BT.601 conversion
    y[pixelIndex] = 0.299 * r + 0.587 * g + 0.114 * b;
    cr[pixelIndex] = 0.5 + 0.5 * r - 0.4187 * g - 0.0813 * b;
    cb[pixelIndex] = 0.5 - 0.1687 * r - 0.3313 * g + 0.5 * b;
  }
  
  return { y, cr, cb };
};

const calculateBasicExposureMetrics = (luminance: Float32Array, width: number, height: number) => {
  const totalPixels = width * height;
  
  // Calculate histogram
  const histogram = new Array(256).fill(0);
  const luminanceValues: number[] = [];
  
  for (let i = 0; i < luminance.length; i++) {
    const lum = Math.round(luminance[i] * 255);
    histogram[lum]++;
    luminanceValues.push(lum);
  }
  
  // Basic exposure calculations
  const overexposureThreshold = 250;
  const underexposureThreshold = 5;
  
  const overexposedPixels = histogram.slice(overexposureThreshold).reduce((sum, count) => sum + count, 0);
  const underexposedPixels = histogram.slice(0, underexposureThreshold).reduce((sum, count) => sum + count, 0);
  
  const overexposurePercentage = (overexposedPixels / totalPixels) * 100;
  const underexposurePercentage = (underexposedPixels / totalPixels) * 100;
  
  // Calculate average brightness
  const averageBrightness = luminanceValues.reduce((sum, val) => sum + val, 0) / luminanceValues.length;
  
  // Calculate dynamic range
  const sortedLuminance = [...luminanceValues].sort((a, b) => a - b);
  const p5 = sortedLuminance[Math.floor(sortedLuminance.length * 0.05)];
  const p95 = sortedLuminance[Math.floor(sortedLuminance.length * 0.95)];
  const dynamicRange = p95 - p5;
  
  // Calculate contrast ratio
  const maxLuminance = Math.max(...luminanceValues);
  const minLuminance = Math.min(...luminanceValues);
  const contrastRatio = maxLuminance > 0 ? (maxLuminance + 0.05) / (minLuminance + 0.05) : 1;
  
  // Determine histogram balance (now includes low-contrast)
  let histogramBalance: ExposureAnalysis['histogramBalance'];
  if (overexposurePercentage > 5) {
    histogramBalance = 'overexposed';
  } else if (underexposurePercentage > 5) {
    histogramBalance = 'underexposed';
  } else if (contrastRatio > 15) {
    histogramBalance = 'high-contrast';
  } else if (contrastRatio < 3) {
    histogramBalance = 'low-contrast';
  } else {
    histogramBalance = 'balanced';
  }
  
  return {
    overexposurePercentage: Math.round(overexposurePercentage * 100) / 100,
    underexposurePercentage: Math.round(underexposurePercentage * 100) / 100,
    dynamicRange: Math.round(dynamicRange),
    averageBrightness: Math.round(averageBrightness),
    contrastRatio: Math.round(contrastRatio * 100) / 100,
    histogramBalance
  };
};

const calculateSpatialExposureMetrics = (luminance: Float32Array, width: number, height: number) => {
  // Calculate local contrast using sliding window
  const localContrast = calculateLocalContrast(luminance, width, height);
  
  // Calculate highlight recovery potential
  const highlightRecovery = calculateHighlightRecovery(luminance, width, height);
  
  // Calculate shadow detail preservation
  const shadowDetail = calculateShadowDetail(luminance, width, height);
  
  // Calculate spatial exposure variance
  const spatialExposureVariance = calculateSpatialVariance(luminance, width, height);
  
  return {
    localContrast: Math.round(localContrast),
    highlightRecovery: Math.round(highlightRecovery),
    shadowDetail: Math.round(shadowDetail),
    spatialExposureVariance: Math.round(spatialExposureVariance * 100) / 100
  };
};

const calculateLocalContrast = (luminance: Float32Array, width: number, height: number): number => {
  let totalContrast = 0;
  let sampleCount = 0;
  const windowSize = 9; // 9x9 window
  const halfWindow = Math.floor(windowSize / 2);
  
  for (let y = halfWindow; y < height - halfWindow; y += 3) {
    for (let x = halfWindow; x < width - halfWindow; x += 3) {
      let minVal = 1.0;
      let maxVal = 0.0;
      
      for (let dy = -halfWindow; dy <= halfWindow; dy++) {
        for (let dx = -halfWindow; dx <= halfWindow; dx++) {
          const idx = (y + dy) * width + (x + dx);
          const val = luminance[idx];
          minVal = Math.min(minVal, val);
          maxVal = Math.max(maxVal, val);
        }
      }
      
      const localContrast = maxVal - minVal;
      totalContrast += localContrast;
      sampleCount++;
    }
  }
  
  return sampleCount > 0 ? (totalContrast / sampleCount) * 100 : 0;
};

const calculateHighlightRecovery = (luminance: Float32Array, width: number, height: number): number => {
  const highlightThreshold = 0.9; // 90% brightness
  let recoverableHighlights = 0;
  let totalHighlights = 0;
  
  for (let i = 0; i < luminance.length; i++) {
    if (luminance[i] > highlightThreshold) {
      totalHighlights++;
      
      // Check if highlight has detail (not completely blown out)
      if (luminance[i] < 0.98) {
        recoverableHighlights++;
      }
    }
  }
  
  return totalHighlights > 0 ? (recoverableHighlights / totalHighlights) * 100 : 100;
};

const calculateShadowDetail = (luminance: Float32Array, width: number, height: number): number => {
  const shadowThreshold = 0.1; // 10% brightness
  let detailedShadows = 0;
  let totalShadows = 0;
  
  for (let i = 0; i < luminance.length; i++) {
    if (luminance[i] < shadowThreshold) {
      totalShadows++;
      
      // Check if shadow has detail (not completely black)
      if (luminance[i] > 0.02) {
        detailedShadows++;
      }
    }
  }
  
  return totalShadows > 0 ? (detailedShadows / totalShadows) * 100 : 100;
};

const calculateSpatialVariance = (luminance: Float32Array, width: number, height: number): number => {
  // Divide image into regions and calculate exposure variance
  const regions = 4; // 4x4 grid
  const regionWidth = Math.floor(width / regions);
  const regionHeight = Math.floor(height / regions);
  const regionExposures: number[] = [];
  
  for (let ry = 0; ry < regions; ry++) {
    for (let rx = 0; rx < regions; rx++) {
      let regionSum = 0;
      let regionCount = 0;
      
      for (let y = ry * regionHeight; y < (ry + 1) * regionHeight && y < height; y++) {
        for (let x = rx * regionWidth; x < (rx + 1) * regionWidth && x < width; x++) {
          regionSum += luminance[y * width + x];
          regionCount++;
        }
      }
      
      if (regionCount > 0) {
        regionExposures.push(regionSum / regionCount);
      }
    }
  }
  
  // Calculate variance of region exposures
  const meanExposure = regionExposures.reduce((sum, exp) => sum + exp, 0) / regionExposures.length;
  const variance = regionExposures.reduce((sum, exp) => sum + (exp - meanExposure) ** 2, 0) / regionExposures.length;
  
  return Math.sqrt(variance);
};

const calculateColorBalance = (yCrCbData: YCrCbData) => {
  const { y, cr, cb } = yCrCbData;
  
  // Calculate average values for each channel
  const avgY = y.reduce((sum, val) => sum + val, 0) / y.length;
  const avgCr = cr.reduce((sum, val) => sum + val, 0) / cr.length;
  const avgCb = cb.reduce((sum, val) => sum + val, 0) / cb.length;
  
  return {
    y: Math.round(avgY * 100) / 100,
    cr: Math.round(avgCr * 100) / 100,
    cb: Math.round(avgCb * 100) / 100
  };
};

const calculatePerceptualExposureScore = (yCrCbData: YCrCbData, width: number, height: number): number => {
  const { y } = yCrCbData;
  
  // Simplified perceptual quality assessment based on luminance distribution
  let score = 100;
  
  // Calculate luminance histogram
  const histogram = new Array(256).fill(0);
  for (let i = 0; i < y.length; i++) {
    const bin = Math.floor(y[i] * 255);
    histogram[bin]++;
  }
  
  // Check for proper exposure distribution (bell curve-like)
  const totalPixels = y.length;
  const midtoneRange = histogram.slice(64, 192).reduce((sum, count) => sum + count, 0);
  const midtonePercentage = (midtoneRange / totalPixels) * 100;
  
  if (midtonePercentage < 40) {
    score -= (40 - midtonePercentage) * 0.5;
  }
  
  // Penalize extreme clipping
  const shadowClipping = histogram.slice(0, 10).reduce((sum, count) => sum + count, 0) / totalPixels * 100;
  const highlightClipping = histogram.slice(245, 256).reduce((sum, count) => sum + count, 0) / totalPixels * 100;
  
  score -= shadowClipping * 3;
  score -= highlightClipping * 3;
  
  // Reward good contrast
  const contrast = calculateImageContrast(y);
  if (contrast > 0.3 && contrast < 0.8) {
    score += 10;
  } else {
    score -= Math.abs(contrast - 0.55) * 20;
  }
  
  return Math.max(0, Math.min(100, Math.round(score)));
};

const calculateImageContrast = (luminance: Float32Array): number => {
  let sum = 0;
  let sumSquares = 0;
  
  for (let i = 0; i < luminance.length; i++) {
    sum += luminance[i];
    sumSquares += luminance[i] * luminance[i];
  }
  
  const mean = sum / luminance.length;
  const variance = (sumSquares / luminance.length) - (mean * mean);
  
  return Math.sqrt(variance);
};

const applyBiasCorrection = (basicMetrics: any, spatialMetrics: any) => {
  // Apply histogram equalization-based correction to reduce threshold sensitivity
  const correctionFactor = calculateCorrectionFactor(basicMetrics);
  
  return {
    ...basicMetrics,
    ...spatialMetrics,
    correctedAverageBrightness: basicMetrics.averageBrightness * correctionFactor,
    correctionFactor: Math.round(correctionFactor * 100) / 100
  };
};

const calculateCorrectionFactor = (metrics: any): number => {
  // Simple gray-world assumption correction
  const targetBrightness = 128; // Middle gray
  const currentBrightness = metrics.averageBrightness;
  
  if (currentBrightness === 0) return 1;
  
  const factor = targetBrightness / currentBrightness;
  
  // Limit correction factor to reasonable range
  return Math.max(0.5, Math.min(2.0, factor));
};

const calculateEnhancedExposureScore = (
  basicMetrics: any,
  spatialMetrics: any,
  perceptualScore: number
): number => {
  let score = 100;
  
  // Weight different components using configuration
  const weights = EXPOSURE_WEIGHTS;
  
  // Basic exposure penalties
  score -= Math.min(basicMetrics.overexposurePercentage * 2, 30);
  score -= Math.min(basicMetrics.underexposurePercentage * 2, 30);
  
  // Dynamic range bonus
  const optimalDynamicRange = 200;
  const dynamicRangeScore = Math.min(basicMetrics.dynamicRange / optimalDynamicRange, 1) * 20;
  score = Math.max(0, score - 20 + dynamicRangeScore);
  
  // Spatial quality adjustments with documented weights
  const spatialScore = (
    spatialMetrics.localContrast * weights.localContrast +
    spatialMetrics.highlightRecovery * weights.highlightRecovery +
    spatialMetrics.shadowDetail * weights.shadowDetail
  );
  
  // Combine all scores
  const finalScore = 
    (score * weights.basic) +
    (spatialScore * weights.spatial) +
    (perceptualScore * weights.perceptual);
  
  return Math.max(0, Math.min(100, Math.round(finalScore)));
};