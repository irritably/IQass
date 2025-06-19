import { NoiseAnalysis } from '../types';
import { NOISE_CONFIG } from './config';

export const analyzeNoise = (imageData: ImageData): NoiseAnalysis => {
  const { data, width, height } = imageData;
  
  // Calculate raw standard deviation first
  const rawStandardDeviation = calculateRawStandardDeviation(data, width, height);
  
  // Derive noise level and SNR from raw standard deviation
  const noiseLevel = deriveNoiseLevel(rawStandardDeviation);
  const snrRatio = deriveSNR(data, rawStandardDeviation);
  
  // Detect compression artifacts (simplified JPEG blocking detection)
  const compressionArtifacts = detectCompressionArtifacts(data, width, height);
  
  // Detect chromatic aberration (simplified color fringing detection)
  const chromaticAberration = detectChromaticAberration(data, width, height);
  
  // Detect vignetting
  const vignetting = detectVignetting(data, width, height);
  
  // Calculate overall artifact score
  const overallArtifactScore = Math.round(
    (compressionArtifacts + chromaticAberration + vignetting) / 3
  );
  
  // Calculate noise score (0-100, higher is better)
  let noiseScore = 100;
  noiseScore -= Math.min(noiseLevel * 2, 40); // Penalize high noise
  noiseScore -= Math.min(overallArtifactScore, 30); // Penalize artifacts
  noiseScore += Math.min(snrRatio / 2, 20); // Reward good SNR
  
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
  return Math.min(100, Math.max(0, (rawStdDev / 20) * 100));
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

const detectCompressionArtifacts = (data: Uint8ClampedArray, width: number, height: number): number => {
  // Simplified JPEG blocking artifact detection
  let blockingScore = 0;
  let edgeCount = 0;
  const blockSize = 8;
  
  // Check for 8x8 block boundaries (typical JPEG compression)
  for (let y = blockSize; y < height - blockSize; y += blockSize) {
    for (let x = 0; x < width; x++) {
      const idx1 = ((y - 1) * width + x) * 4;
      const idx2 = (y * width + x) * 4;
      
      const lum1 = 0.299 * data[idx1] + 0.587 * data[idx1 + 1] + 0.114 * data[idx1 + 2];
      const lum2 = 0.299 * data[idx2] + 0.587 * data[idx2 + 1] + 0.114 * data[idx2 + 2];
      
      const diff = Math.abs(lum1 - lum2);
      blockingScore += diff;
      edgeCount++;
    }
  }
  
  // Check vertical block boundaries
  for (let x = blockSize; x < width - blockSize; x += blockSize) {
    for (let y = 0; y < height; y++) {
      const idx1 = (y * width + (x - 1)) * 4;
      const idx2 = (y * width + x) * 4;
      
      const lum1 = 0.299 * data[idx1] + 0.587 * data[idx1 + 1] + 0.114 * data[idx1 + 2];
      const lum2 = 0.299 * data[idx2] + 0.587 * data[idx2 + 1] + 0.114 * data[idx2 + 2];
      
      const diff = Math.abs(lum1 - lum2);
      blockingScore += diff;
      edgeCount++;
    }
  }
  
  if (edgeCount === 0) return 0;
  
  // Normalize to 0-100 scale
  const avgBlockingScore = blockingScore / edgeCount;
  return Math.min(100, Math.max(0, (avgBlockingScore / 10) * 100));
};

const detectChromaticAberration = (data: Uint8ClampedArray, width: number, height: number): number => {
  // Simplified chromatic aberration detection by analyzing color channel misalignment
  let aberrationScore = 0;
  let edgeCount = 0;
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      
      // Calculate edge strength for each channel
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      
      const rNext = data[idx + 4];
      const gNext = data[idx + 5];
      const bNext = data[idx + 6];
      
      const rEdge = Math.abs(r - rNext);
      const gEdge = Math.abs(g - gNext);
      const bEdge = Math.abs(b - bNext);
      
      // Only analyze significant edges
      const maxEdge = Math.max(rEdge, gEdge, bEdge);
      if (maxEdge > 20) {
        // Check for color channel imbalance at edges
        const channelImbalance = Math.abs(rEdge - gEdge) + Math.abs(gEdge - bEdge) + Math.abs(bEdge - rEdge);
        aberrationScore += channelImbalance / maxEdge; // Normalize by edge strength
        edgeCount++;
      }
    }
  }
  
  if (edgeCount === 0) return 0;
  
  // Normalize to 0-100 scale
  const avgAberration = aberrationScore / edgeCount;
  return Math.min(100, Math.max(0, avgAberration * 10));
};

const detectVignetting = (data: Uint8ClampedArray, width: number, height: number): number => {
  const centerX = width / 2;
  const centerY = height / 2;
  
  let centerBrightness = 0;
  let cornerBrightness = 0;
  let centerCount = 0;
  let cornerCount = 0;
  
  // Sample center region (10% of image size)
  const centerRadius = Math.min(width, height) * 0.1;
  for (let y = Math.floor(centerY - centerRadius); y < centerY + centerRadius; y++) {
    for (let x = Math.floor(centerX - centerRadius); x < centerX + centerRadius; x++) {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        const idx = (y * width + x) * 4;
        const luminance = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
        centerBrightness += luminance;
        centerCount++;
      }
    }
  }
  
  // Sample corner regions (5% of image size each)
  const cornerRadius = Math.min(width, height) * 0.05;
  const corners = [
    [cornerRadius, cornerRadius],
    [width - cornerRadius, cornerRadius],
    [cornerRadius, height - cornerRadius],
    [width - cornerRadius, height - cornerRadius]
  ];
  
  corners.forEach(([cx, cy]) => {
    for (let y = cy - cornerRadius; y < cy + cornerRadius; y++) {
      for (let x = cx - cornerRadius; x < cx + cornerRadius; x++) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const idx = (y * width + x) * 4;
          const luminance = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
          cornerBrightness += luminance;
          cornerCount++;
        }
      }
    }
  });
  
  if (centerCount === 0 || cornerCount === 0) return 0;
  
  const avgCenterBrightness = centerBrightness / centerCount;
  const avgCornerBrightness = cornerBrightness / cornerCount;
  
  // Calculate vignetting as percentage brightness difference
  const vignettingRatio = avgCenterBrightness > 0 ? 
    Math.max(0, (avgCenterBrightness - avgCornerBrightness) / avgCenterBrightness) : 0;
  
  return Math.min(100, vignettingRatio * 100);
};