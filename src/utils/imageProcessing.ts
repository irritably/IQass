/**
 * Enhanced Image Processing Utilities
 * 
 * This module contains core image processing functions with multi-scale blur detection,
 * orientation correction, and dynamic resolution support.
 */

import { getProcessingResolution, BLUR_DETECTION_CONFIG } from './config';
import { getWebGLCapabilities } from './webglProcessing';
import { applyOrientationCorrection } from './metadataExtraction';

/**
 * Creates a thumbnail from an image file
 * @param file - The image file to create a thumbnail from
 * @param maxSize - Maximum size for the thumbnail (default: 150px)
 * @returns Promise resolving to a data URL of the thumbnail
 */
export const createThumbnail = (file: File, maxSize: number = 150): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Validate file type first
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'));
      return;
    }

    const img = new Image();
    let objectUrl: string | null = null;
    
    // Set up timeout to prevent hanging
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Thumbnail creation timeout'));
    }, 15000); // 15 second timeout

    const cleanup = () => {
      clearTimeout(timeout);
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        objectUrl = null;
      }
    };

    img.onload = () => {
      try {
        // Create canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          cleanup();
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Calculate dimensions
        const ratio = Math.min(maxSize / img.width, maxSize / img.height);
        const newWidth = Math.floor(img.width * ratio);
        const newHeight = Math.floor(img.height * ratio);
        
        // Set canvas size
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        // Clear canvas with white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, newWidth, newHeight);
        
        // Draw image
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        
        // Convert to data URL
        canvas.toBlob((blob) => {
          if (blob) {
            const reader = new FileReader();
            reader.onload = () => {
              cleanup();
              resolve(reader.result as string);
            };
            reader.onerror = () => {
              cleanup();
              reject(new Error('Failed to read blob'));
            };
            reader.readAsDataURL(blob);
          } else {
            cleanup();
            reject(new Error('Failed to create blob'));
          }
        }, 'image/jpeg', 0.8);
        
      } catch (drawError) {
        cleanup();
        reject(new Error('Failed to draw image on canvas'));
      }
    };
    
    img.onerror = () => {
      cleanup();
      reject(new Error('Failed to load image'));
    };

    // Create object URL and load image
    try {
      objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;
    } catch (urlError) {
      cleanup();
      reject(new Error('Failed to create object URL'));
    }
  });
};

/**
 * Loads an image file and returns canvas context with image data
 * @param file - The image file to load
 * @param orientation - EXIF orientation for correction
 * @param forceHighRes - Force high resolution processing
 * @returns Promise resolving to canvas context and image data
 */
export const loadImageForAnalysis = (
  file: File, 
  orientation?: number,
  forceHighRes: boolean = false
): Promise<{
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  imageData: ImageData;
}> => {
  return new Promise((resolve, reject) => {
    // Validate file type first
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'));
      return;
    }

    const img = new Image();
    let objectUrl: string | null = null;
    
    // Set up timeout to prevent hanging
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Image loading timeout - file may be corrupted or too large'));
    }, 30000); // 30 second timeout for analysis

    const cleanup = () => {
      clearTimeout(timeout);
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        objectUrl = null;
      }
    };

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          cleanup();
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Determine processing resolution based on capabilities and settings
        const capabilities = getWebGLCapabilities();
        const imagePixels = img.width * img.height;
        const maxSize = forceHighRes 
          ? getProcessingResolution(true, imagePixels)
          : getProcessingResolution(capabilities.webgl, imagePixels);

        // Calculate dimensions for analysis (limit size for performance)
        const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1); // Don't upscale
        const newWidth = Math.floor(img.width * ratio);
        const newHeight = Math.floor(img.height * ratio);
        
        // Validate dimensions
        if (newWidth <= 0 || newHeight <= 0) {
          cleanup();
          reject(new Error('Invalid image dimensions'));
          return;
        }

        // Set canvas size (may need to swap for certain orientations)
        const needsDimensionSwap = orientation && [5, 6, 7, 8].includes(orientation);
        canvas.width = needsDimensionSwap ? newHeight : newWidth;
        canvas.height = needsDimensionSwap ? newWidth : newHeight;
        
        // Clear canvas with white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Save context state before applying transformations
        ctx.save();
        
        // Apply orientation correction if needed
        if (orientation) {
          applyOrientationCorrection(canvas, ctx, orientation);
        }
        
        // Draw image
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        
        // Restore context state
        ctx.restore();
        
        // Get image data
        let imageData: ImageData;
        try {
          imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        } catch (imageDataError) {
          cleanup();
          reject(new Error('Failed to extract image data - image may be corrupted'));
          return;
        }

        // Validate image data
        if (!imageData || !imageData.data || imageData.data.length === 0) {
          cleanup();
          reject(new Error('Invalid image data extracted'));
          return;
        }

        cleanup();
        resolve({ canvas, ctx, imageData });
        
      } catch (error) {
        cleanup();
        reject(new Error(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };
    
    img.onerror = () => {
      cleanup();
      reject(new Error('Failed to load image - file may be corrupted or in an unsupported format'));
    };

    // Create object URL and load image
    try {
      objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;
    } catch (urlError) {
      cleanup();
      reject(new Error('Failed to create object URL - file may be corrupted'));
    }
  });
};

/**
 * Enhanced blur score calculation with multi-scale Laplacian analysis
 * @param imageData - The image data to analyze
 * @returns Blur score from 0-100 (higher is sharper)
 */
export const calculateBlurScore = (imageData: ImageData): number => {
  try {
    const { data, width, height } = imageData;
    
    // Validate input
    if (!data || width <= 0 || height <= 0 || data.length === 0) {
      console.warn('Invalid image data for blur calculation');
      return 0;
    }
    
    if (BLUR_DETECTION_CONFIG.useMultiScale) {
      return calculateMultiScaleBlurScore(data, width, height);
    } else {
      return calculateSingleScaleBlurScore(data, width, height);
    }
  } catch (error) {
    console.error('Error calculating blur score:', error);
    return 0;
  }
};

/**
 * Multi-scale Laplacian variance calculation for robust blur detection
 */
const calculateMultiScaleBlurScore = (
  data: Uint8ClampedArray, 
  width: number, 
  height: number
): number => {
  const { scaleFactors, normalizationFactor } = BLUR_DETECTION_CONFIG;
  const scaleScores: number[] = [];
  
  // Convert to grayscale once
  const grayscale = convertToGrayscale(data);
  
  for (const scaleFactor of scaleFactors) {
    if (scaleFactor === 1.0) {
      // Full resolution
      const variance = calculateLaplacianVariance(grayscale, width, height);
      scaleScores.push(variance);
    } else {
      // Downsampled resolution
      const scaledWidth = Math.floor(width * scaleFactor);
      const scaledHeight = Math.floor(height * scaleFactor);
      
      if (scaledWidth < 10 || scaledHeight < 10) continue; // Skip very small scales
      
      const scaledGrayscale = downsampleGrayscale(grayscale, width, height, scaledWidth, scaledHeight);
      const variance = calculateLaplacianVariance(scaledGrayscale, scaledWidth, scaledHeight);
      
      // Weight smaller scales less (they're more sensitive to noise)
      scaleScores.push(variance * scaleFactor);
    }
  }
  
  if (scaleScores.length === 0) return 0;
  
  // Combine scale scores (weighted average favoring larger scales)
  const weights = scaleFactors.slice(0, scaleScores.length);
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const weightedVariance = scaleScores.reduce((sum, score, i) => 
    sum + score * weights[i], 0) / totalWeight;
  
  // Normalize to 0-100 scale
  const normalizedScore = Math.min(100, Math.max(0, Math.log(weightedVariance + 1) * normalizationFactor));
  
  return Math.round(normalizedScore);
};

/**
 * Single-scale Laplacian variance calculation (fallback)
 */
const calculateSingleScaleBlurScore = (
  data: Uint8ClampedArray, 
  width: number, 
  height: number
): number => {
  const grayscale = convertToGrayscale(data);
  const variance = calculateLaplacianVariance(grayscale, width, height);
  
  // Normalize to 0-100 scale
  const normalizedScore = Math.min(100, Math.max(0, Math.log(variance + 1) * BLUR_DETECTION_CONFIG.normalizationFactor));
  
  return Math.round(normalizedScore);
};

/**
 * Converts RGBA image data to grayscale
 */
const convertToGrayscale = (data: Uint8ClampedArray): Float32Array => {
  const grayscale = new Float32Array(data.length / 4);
  
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    grayscale[i / 4] = gray;
  }
  
  return grayscale;
};

/**
 * Downsamples grayscale image to specified dimensions
 */
const downsampleGrayscale = (
  grayscale: Float32Array,
  originalWidth: number,
  originalHeight: number,
  newWidth: number,
  newHeight: number
): Float32Array => {
  const downsampled = new Float32Array(newWidth * newHeight);
  const xRatio = originalWidth / newWidth;
  const yRatio = originalHeight / newHeight;
  
  for (let y = 0; y < newHeight; y++) {
    for (let x = 0; x < newWidth; x++) {
      const srcX = Math.floor(x * xRatio);
      const srcY = Math.floor(y * yRatio);
      const srcIdx = srcY * originalWidth + srcX;
      
      if (srcIdx < grayscale.length) {
        downsampled[y * newWidth + x] = grayscale[srcIdx];
      }
    }
  }
  
  return downsampled;
};

/**
 * Calculates Laplacian variance for blur detection
 */
const calculateLaplacianVariance = (
  grayscale: Float32Array,
  width: number,
  height: number
): number => {
  const laplacian: number[] = [];
  
  // Apply Laplacian kernel (skip edges to avoid boundary issues)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const value = 
        -1 * grayscale[idx - width - 1] + -1 * grayscale[idx - width] + -1 * grayscale[idx - width + 1] +
        -1 * grayscale[idx - 1] + 8 * grayscale[idx] + -1 * grayscale[idx + 1] +
        -1 * grayscale[idx + width - 1] + -1 * grayscale[idx + width] + -1 * grayscale[idx + width + 1];
      laplacian.push(Math.abs(value));
    }
  }
  
  // Calculate variance
  if (laplacian.length === 0) return 0;
  
  const mean = laplacian.reduce((sum, val) => sum + val, 0) / laplacian.length;
  const variance = laplacian.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / laplacian.length;
  
  return variance;
};