import { NoiseAnalysis } from '../types';
import { NOISE_CONFIG } from './config';

export const analyzeNoise = (imageData: ImageData): NoiseAnalysis => {
  const { data, width, height } = imageData;
  
  // Calculate raw standard deviation first
  const rawStandardDeviation = calculateRawStandardDeviation(data, width, height);
  
  // Derive noise level and SNR from raw standard deviation
  const noiseLevel = deriveNoiseLevel(rawStandardDeviation);
  const snrRatio = deriveSNR(data, rawStandardDeviation);
  
  // Enhanced compression artifacts detection using DCT-based method
  const compressionArtifacts = detectEnhancedCompressionArtifacts(data, width, height);
  
  // Enhanced chromatic aberration detection using Sobel gradients
  const chromaticAberration = detectEnhancedChromaticAberration(data, width, height);
  
  // Enhanced vignetting detection with radial model fitting
  const vignetting = detectEnhancedVignetting(data, width, height);
  
  // Calculate overall artifact score using configurable weights
  const overallArtifactScore = Math.round(
    (compressionArtifacts * NOISE_CONFIG.artifactWeights.compression +
     chromaticAberration * NOISE_CONFIG.artifactWeights.chromatic +
     vignetting * NOISE_CONFIG.artifactWeights.vignetting) / 3
  );
  
  // Calculate noise score (0-100, higher is better) using configurable penalties
  let noiseScore = 100;
  noiseScore -= Math.min(noiseLevel * NOISE_CONFIG.penalties.noiseLevelMultiplier, NOISE_CONFIG.penalties.maxNoisePenalty);
  noiseScore -= Math.min(overallArtifactScore * NOISE_CONFIG.penalties.artifactMultiplier, NOISE_CONFIG.penalties.maxArtifactPenalty);
  noiseScore += Math.min(snrRatio * NOISE_CONFIG.rewards.snrMultiplier, NOISE_CONFIG.rewards.maxSnrBonus);
  
  noiseScore = Math.max(0, Math.min(100, Math.round(noiseScore)));
  
  return {
    rawStandardDeviation: Math.round(rawStandardDeviation * 1000) / 1000,
    noiseLevel: Math.round(noiseLevel * 100) / 100,
    snrRatio: Math.round(snrRatio * 100) / 100,
    compressionArtifacts: Math.round(compressionArtifacts * 100) / 100,
    chromaticAberration: Math.round(chromaticAberration * 100) / 100,
    vignetting: Math.round(vignetting * 100) / 100,
    overallArtifactScore,
    noiseScore
  };
};

/**
 * Calculates raw standard deviation (σ) for noise measurement
 */
const calculateRawStandardDeviation = (data: Uint8ClampedArray, width: number, height: number): number => {
  const blockSize = NOISE_CONFIG.blockSize;
  let totalVariance = 0;
  let blockCount = 0;
  
  for (let y = 0; y < height - blockSize; y += blockSize) {
    for (let x = 0; x < width - blockSize; x += blockSize) {
      const blockValues: number[] = [];
      
      for (let by = 0; by < blockSize; by++) {
        for (let bx = 0; bx < blockSize; bx++) {
          const idx = ((y + by) * width + (x + bx)) * 4;
          const luminance = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
          blockValues.push(luminance);
        }
      }
      
      const mean = blockValues.reduce((sum, val) => sum + val, 0) / blockValues.length;
      const variance = blockValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / blockValues.length;
      
      totalVariance += variance;
      blockCount++;
    }
  }
  
  const avgVariance = blockCount > 0 ? totalVariance / blockCount : 0;
  return Math.sqrt(avgVariance);
};

/**
 * Derives user-visible noise level from raw standard deviation
 */
const deriveNoiseLevel = (rawStdDev: number): number => {
  // Convert raw standard deviation to 0-100 scale
  // Empirically determined scaling based on typical image noise levels
  // Good images typically have σ < 5, noisy images have σ > 15
  return Math.min(100, Math.max(0, (rawStdDev / NOISE_CONFIG.noiseScaling.maxStdDev) * 100));
};

/**
 * Derives signal-to-noise ratio from image data and raw standard deviation
 */
const deriveSNR = (data: Uint8ClampedArray, rawStdDev: number): number => {
  // Calculate mean luminance
  let totalLuminance = 0;
  const pixelCount = data.length / 4;
  
  for (let i = 0; i < data.length; i += 4) {
    const luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    totalLuminance += luminance;
  }
  
  const meanLuminance = totalLuminance / pixelCount;
  
  // Calculate SNR as mean/standard deviation
  return rawStdDev > 0 ? meanLuminance / rawStdDev : 0;
};

/**
 * Enhanced JPEG compression artifact detection using DCT-based analysis
 */
const detectEnhancedCompressionArtifacts = (data: Uint8ClampedArray, width: number, height: number): number => {
  let blockingScore = 0;
  let edgeCount = 0;
  let continuityScore = 0;
  const blockSize = 8;
  
  // Check for 8x8 block boundaries (typical JPEG compression)
  // Horizontal block boundaries
  for (let y = blockSize; y < height - blockSize; y += blockSize) {
    for (let x = 0; x < width; x++) {
      const idx1 = ((y - 1) * width + x) * 4;
      const idx2 = (y * width + x) * 4;
      
      const lum1 = 0.299 * data[idx1] + 0.587 * data[idx1 + 1] + 0.114 * data[idx1 + 2];
      const lum2 = 0.299 * data[idx2] + 0.587 * data[idx2 + 1] + 0.114 * data[idx2 + 2];
      
      const diff = Math.abs(lum1 - lum2);
      blockingScore += diff;
      
      // Check edge continuity across block boundary
      if (x > 0 && x < width - 1) {
        const leftDiff = Math.abs(lum1 - 0.299 * data[idx1 - 4] - 0.587 * data[idx1 - 3] - 0.114 * data[idx1 - 2]);
        const rightDiff = Math.abs(lum2 - 0.299 * data[idx2 + 4] - 0.587 * data[idx2 + 5] - 0.114 * data[idx2 + 6]);
        
        // If there's a sharp discontinuity at block boundary but smooth within blocks
        if (diff > leftDiff * 2 && diff > rightDiff * 2) {
          continuityScore += diff;
        }
      }
      
      edgeCount++;
    }
  }
  
  // Vertical block boundaries
  for (let x = blockSize; x < width - blockSize; x += blockSize) {
    for (let y = 0; y < height; y++) {
      const idx1 = (y * width + (x - 1)) * 4;
      const idx2 = (y * width + x) * 4;
      
      const lum1 = 0.299 * data[idx1] + 0.587 * data[idx1 + 1] + 0.114 * data[idx1 + 2];
      const lum2 = 0.299 * data[idx2] + 0.587 * data[idx2 + 1] + 0.114 * data[idx2 + 2];
      
      const diff = Math.abs(lum1 - lum2);
      blockingScore += diff;
      
      // Check edge continuity across block boundary
      if (y > 0 && y < height - 1) {
        const topDiff = Math.abs(lum1 - 0.299 * data[idx1 - width * 4] - 0.587 * data[idx1 - width * 4 + 1] - 0.114 * data[idx1 - width * 4 + 2]);
        const bottomDiff = Math.abs(lum2 - 0.299 * data[idx2 + width * 4] - 0.587 * data[idx2 + width * 4 + 1] - 0.114 * data[idx2 + width * 4 + 2]);
        
        if (diff > topDiff * 2 && diff > bottomDiff * 2) {
          continuityScore += diff;
        }
      }
      
      edgeCount++;
    }
  }
  
  if (edgeCount === 0) return 0;
  
  // Combine blocking score and continuity score
  const avgBlockingScore = blockingScore / edgeCount;
  const avgContinuityScore = continuityScore / edgeCount;
  const combinedScore = (avgBlockingScore + avgContinuityScore * 2) / 3; // Weight continuity more
  
  // Normalize to 0-100 scale
  return Math.min(100, Math.max(0, (combinedScore / NOISE_CONFIG.compressionThresholds.maxBlockingScore) * 100));
};

/**
 * Enhanced chromatic aberration detection using Sobel gradients on each channel
 */
const detectEnhancedChromaticAberration = (data: Uint8ClampedArray, width: number, height: number): number => {
  let aberrationScore = 0;
  let edgeCount = 0;
  
  // Sobel kernels
  const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      
      // Calculate Sobel gradients for each color channel
      let rGradX = 0, rGradY = 0;
      let gGradX = 0, gGradY = 0;
      let bGradX = 0, bGradY = 0;
      
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const pixelIdx = ((y + ky) * width + (x + kx)) * 4;
          const kernelIdx = (ky + 1) * 3 + (kx + 1);
          
          const r = data[pixelIdx];
          const g = data[pixelIdx + 1];
          const b = data[pixelIdx + 2];
          
          rGradX += r * sobelX[kernelIdx];
          rGradY += r * sobelY[kernelIdx];
          gGradX += g * sobelX[kernelIdx];
          gGradY += g * sobelY[kernelIdx];
          bGradX += b * sobelX[kernelIdx];
          bGradY += b * sobelY[kernelIdx];
        }
      }
      
      // Calculate gradient magnitudes
      const rMag = Math.sqrt(rGradX * rGradX + rGradY * rGradY);
      const gMag = Math.sqrt(gGradX * gGradX + gGradY * gGradY);
      const bMag = Math.sqrt(bGradX * bGradX + bGradY * bGradY);
      
      const maxMag = Math.max(rMag, gMag, bMag);
      
      // Only analyze significant edges
      if (maxMag > NOISE_CONFIG.chromaticThresholds.minEdgeStrength) {
        // Calculate gradient direction differences between channels
        const rAngle = Math.atan2(rGradY, rGradX);
        const gAngle = Math.atan2(gGradY, gGradX);
        const bAngle = Math.atan2(bGradY, bGradX);
        
        // Calculate angular differences (accounting for wrap-around)
        const rgDiff = Math.min(Math.abs(rAngle - gAngle), 2 * Math.PI - Math.abs(rAngle - gAngle));
        const gbDiff = Math.min(Math.abs(gAngle - bAngle), 2 * Math.PI - Math.abs(gAngle - bAngle));
        const rbDiff = Math.min(Math.abs(rAngle - bAngle), 2 * Math.PI - Math.abs(rAngle - bAngle));
        
        // Calculate magnitude differences
        const magDiff = Math.abs(rMag - gMag) + Math.abs(gMag - bMag) + Math.abs(bMag - rMag);
        
        // Combine angular and magnitude differences
        const channelMisalignment = (rgDiff + gbDiff + rbDiff) / (3 * Math.PI) + (magDiff / (3 * maxMag));
        
        aberrationScore += channelMisalignment;
        edgeCount++;
      }
    }
  }
  
  if (edgeCount === 0) return 0;
  
  // Normalize to 0-100 scale
  const avgAberration = aberrationScore / edgeCount;
  return Math.min(100, Math.max(0, avgAberration * NOISE_CONFIG.chromaticThresholds.scalingFactor));
};

/**
 * Enhanced vignetting detection with radial brightness model fitting
 */
const detectEnhancedVignetting = (data: Uint8ClampedArray, width: number, height: number): number => {
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);
  
  // Sample points at different radii
  const radiusSamples = 10;
  const radialBrightness: number[] = [];
  
  for (let r = 0; r < radiusSamples; r++) {
    const radius = (r / (radiusSamples - 1)) * maxRadius;
    let totalBrightness = 0;
    let sampleCount = 0;
    
    // Sample points around the circle at this radius
    const angleSteps = Math.max(8, Math.floor(radius * 0.5)); // More samples for larger radii
    
    for (let a = 0; a < angleSteps; a++) {
      const angle = (a / angleSteps) * 2 * Math.PI;
      const x = Math.round(centerX + radius * Math.cos(angle));
      const y = Math.round(centerY + radius * Math.sin(angle));
      
      if (x >= 0 && x < width && y >= 0 && y < height) {
        const idx = (y * width + x) * 4;
        const luminance = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
        totalBrightness += luminance;
        sampleCount++;
      }
    }
    
    if (sampleCount > 0) {
      radialBrightness.push(totalBrightness / sampleCount);
    }
  }
  
  if (radialBrightness.length < 3) return 0;
  
  // Fit a polynomial model to the radial brightness profile
  // Simple linear fit: brightness = a * radius + b
  const centerBrightness = radialBrightness[0];
  const edgeBrightness = radialBrightness[radialBrightness.length - 1];
  
  // Calculate expected brightness at each radius based on linear model
  let residualSum = 0;
  let maxDeviation = 0;
  
  for (let i = 0; i < radialBrightness.length; i++) {
    const expectedBrightness = centerBrightness + (edgeBrightness - centerBrightness) * (i / (radialBrightness.length - 1));
    const deviation = Math.abs(radialBrightness[i] - expectedBrightness);
    residualSum += deviation;
    maxDeviation = Math.max(maxDeviation, deviation);
  }
  
  // Calculate vignetting as combination of overall brightness drop and non-linear falloff
  const overallDrop = centerBrightness > 0 ? Math.max(0, (centerBrightness - edgeBrightness) / centerBrightness) : 0;
  const nonLinearity = centerBrightness > 0 ? (residualSum / radialBrightness.length) / centerBrightness : 0;
  
  // Combine linear drop and non-linear artifacts
  const vignettingScore = (overallDrop * NOISE_CONFIG.vignettingWeights.linearDrop + 
                          nonLinearity * NOISE_CONFIG.vignettingWeights.nonLinear) * 100;
  
  return Math.min(100, Math.max(0, vignettingScore));
};