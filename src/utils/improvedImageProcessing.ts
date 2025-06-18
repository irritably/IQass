/**
 * Improved Image Processing Algorithms
 * 
 * This module provides enhanced versions of the core image processing algorithms
 * with better robustness, scene adaptation, and accuracy.
 */

import { debugBlurScore } from './debugUtils';

/**
 * Enhanced blur detection with multiple kernels and scene adaptation
 */
export const calculateImprovedBlurScore = (imageData: ImageData): number => {
  try {
    const { data, width, height } = imageData;
    
    // Validate input
    if (!data || width <= 0 || height <= 0 || data.length === 0) {
      console.warn('Invalid image data for blur calculation');
      return 0;
    }
    
    // Convert to grayscale
    const grayscale = new Float32Array(width * height);
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      grayscale[i / 4] = gray;
    }
    
    // Multiple kernels for robust detection
    const kernels = {
      standard: [[-1, -1, -1], [-1, 8, -1], [-1, -1, -1]],
      cross: [[0, -1, 0], [-1, 4, -1], [0, -1, 0]],
      sobel: [[-1, -2, -1], [0, 0, 0], [1, 2, 1]]
    };
    
    const variances: Record<string, number> = {};
    
    for (const [name, kernel] of Object.entries(kernels)) {
      const responses: number[] = [];
      
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          let response = 0;
          for (let ky = 0; ky < 3; ky++) {
            for (let kx = 0; kx < 3; kx++) {
              const idx = (y + ky - 1) * width + (x + kx - 1);
              response += grayscale[idx] * kernel[ky][kx];
            }
          }
          responses.push(Math.abs(response));
        }
      }
      
      // Calculate variance
      if (responses.length === 0) continue;
      
      const mean = responses.reduce((sum, val) => sum + val, 0) / responses.length;
      const variance = responses.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / responses.length;
      variances[name] = variance;
    }
    
    // Use median variance for robustness
    const varianceValues = Object.values(variances);
    if (varianceValues.length === 0) return 0;
    
    varianceValues.sort((a, b) => a - b);
    const medianVariance = varianceValues[Math.floor(varianceValues.length / 2)];
    
    // Scene-adaptive normalization
    const sceneType = detectSceneType(imageData);
    const normalizationFactor = getSceneNormalizationFactor(sceneType);
    
    const normalizedScore = Math.min(100, Math.max(0, 
      Math.log(medianVariance + 1) * normalizationFactor
    ));
    
    const finalScore = Math.round(normalizedScore);
    
    // Debug output in development
    if (process.env.NODE_ENV === 'development') {
      debugBlurScore(imageData, finalScore, medianVariance);
    }
    
    return finalScore;
  } catch (error) {
    console.error('Error in improved blur calculation:', error);
    return 0;
  }
};

/**
 * Detect scene type for adaptive processing
 */
export const detectSceneType = (imageData: ImageData): 'aerial_sky' | 'ground_detail' | 'mixed' => {
  const { data } = imageData;
  let skyPixels = 0;
  let groundPixels = 0;
  const totalPixels = data.length / 4;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Sky detection (blue-ish, bright)
    if (b > r && b > g && (r + g + b) / 3 > 150) {
      skyPixels++;
    }
    // Ground detection (varied colors, lower brightness)
    else if ((r + g + b) / 3 < 180) {
      groundPixels++;
    }
  }
  
  const skyRatio = skyPixels / totalPixels;
  const groundRatio = groundPixels / totalPixels;
  
  if (skyRatio > 0.4) return "aerial_sky";
  if (groundRatio > 0.6) return "ground_detail";
  return "mixed";
};

/**
 * Get normalization factor based on scene type
 */
export const getSceneNormalizationFactor = (sceneType: string): number => {
  switch (sceneType) {
    case "aerial_sky": return 12; // Lower factor for sky (less texture expected)
    case "ground_detail": return 18; // Higher factor for detailed ground
    case "mixed": return 15; // Standard factor
    default: return 15;
  }
};

/**
 * Adaptive exposure thresholds based on metadata and scene
 */
export const getAdaptiveExposureThresholds = (metadata: any, imageData: ImageData) => {
  // Determine if this is drone imagery
  const isDroneImage = (metadata?.location?.altitude && metadata.location.altitude > 50) ||
                      (metadata?.camera?.make && metadata.camera.make.toLowerCase().includes('dji')) ||
                      detectAerialCharacteristics(imageData);
  
  const isHighAltitude = metadata?.location?.altitude && metadata.location.altitude > 200;
  
  const thresholds = {
    base: {
      overexposure: 250,
      underexposure: 5,
      dynamicRangeMin: 120
    },
    drone: {
      overexposure: 245,  // More sensitive to sky overexposure
      underexposure: 10,  // Less sensitive to shadow underexposure
      dynamicRangeMin: 80 // Lower expectation for aerial scenes
    },
    highAltitude: {
      overexposure: 240,  // Very sensitive to sky overexposure
      underexposure: 15,  // Even less sensitive to shadows
      dynamicRangeMin: 60 // Much lower expectation
    }
  };
  
  if (isHighAltitude) return thresholds.highAltitude;
  if (isDroneImage) return thresholds.drone;
  return thresholds.base;
};

/**
 * Detect aerial characteristics in image
 */
export const detectAerialCharacteristics = (imageData: ImageData): boolean => {
  const { data } = imageData;
  let skyPixels = 0;
  const totalPixels = data.length / 4;
  
  // Check top third of image for sky characteristics
  const topThirdEnd = Math.floor(imageData.height / 3) * imageData.width * 4;
  
  for (let i = 0; i < topThirdEnd; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const brightness = (r + g + b) / 3;
    
    // Sky detection: blue-ish and bright
    if (b > r && b > g && brightness > 150) {
      skyPixels++;
    }
  }
  
  const skyRatio = skyPixels / (totalPixels / 3);
  return skyRatio > 0.3; // 30% of top third is sky-like
};

/**
 * Validate color space conversion with multiple standards
 */
export const validateColorSpaceConversion = (r: number, g: number, b: number, metadata?: any) => {
  // Current BT.601 conversion
  const y601 = 0.299 * r + 0.587 * g + 0.114 * b;
  
  // Modern BT.709 conversion
  const y709 = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  
  // BT.2020 for HDR content
  const y2020 = 0.2627 * r + 0.6780 * g + 0.0593 * b;
  
  const diff601_709 = Math.abs(y601 - y709);
  const diff601_2020 = Math.abs(y601 - y2020);
  
  // Determine appropriate color space
  const recommendedColorSpace = determineColorSpace(metadata);
  
  if (process.env.NODE_ENV === 'development') {
    console.group("🎨 Color Space Conversion Debug");
    console.log("Luminance Comparison (R:", r, "G:", g, "B:", b, "):");
    console.log("  BT.601 (current):", y601.toFixed(2));
    console.log("  BT.709 (modern):", y709.toFixed(2));
    console.log("  BT.2020 (HDR):", y2020.toFixed(2));
    console.log("Differences:");
    console.log("  BT.601 vs BT.709:", diff601_709.toFixed(2));
    console.log("  BT.601 vs BT.2020:", diff601_2020.toFixed(2));
    console.log("Recommended color space:", recommendedColorSpace);
    
    if (diff601_709 > 5) {
      console.warn("⚠️ Significant luminance difference - consider using", recommendedColorSpace);
    }
    console.groupEnd();
  }
  
  return {
    current: y601,
    bt709: y709,
    bt2020: y2020,
    difference: diff601_709,
    recommended: recommendedColorSpace,
    shouldUpdate: diff601_709 > 5
  };
};

/**
 * Determine appropriate color space based on metadata
 */
export const determineColorSpace = (metadata?: any): string => {
  // Check EXIF color space
  if (metadata?.colorSpace) {
    if (metadata.colorSpace.includes("sRGB")) return "BT.709";
    if (metadata.colorSpace.includes("Adobe")) return "BT.709";
  }
  
  // Check camera make/model for modern cameras
  if (metadata?.camera?.make) {
    const make = metadata.camera.make.toLowerCase();
    
    // Modern cameras typically use BT.709
    if (make.includes("canon") || make.includes("nikon") || 
        make.includes("sony") || make.includes("dji")) {
      return "BT.709";
    }
  }
  
  // Default to BT.601 for compatibility
  return "BT.601";
};

/**
 * Enhanced luminance calculation with color space detection
 */
export const calculateLuminance = (r: number, g: number, b: number, metadata?: any): number => {
  const colorSpace = determineColorSpace(metadata);
  
  switch (colorSpace) {
    case "BT.709":
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    case "BT.2020":
      return 0.2627 * r + 0.6780 * g + 0.0593 * b;
    case "BT.601":
    default:
      return 0.299 * r + 0.587 * g + 0.114 * b;
  }
};