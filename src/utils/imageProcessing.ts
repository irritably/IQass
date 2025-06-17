/**
 * Image Processing Utilities
 * 
 * This module contains core image processing functions for:
 * - Canvas operations and image loading
 * - Thumbnail generation
 * - Image data manipulation
 */

/**
 * Creates a thumbnail from an image file
 * @param file - The image file to create a thumbnail from
 * @param maxSize - Maximum size for the thumbnail (default: 150px)
 * @returns Promise resolving to a data URL of the thumbnail
 */
export const createThumbnail = (file: File, maxSize: number = 150): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      const ratio = Math.min(maxSize / img.width, maxSize / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Loads an image file and returns canvas context with image data
 * @param file - The image file to load
 * @param maxSize - Maximum size for analysis (default: 800px)
 * @returns Promise resolving to canvas context and image data
 */
export const loadImageForAnalysis = (file: File, maxSize: number = 800): Promise<{
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  imageData: ImageData;
}> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }
    
    img.onload = () => {
      try {
        // Resize for analysis (faster processing)
        const ratio = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        resolve({ canvas, ctx, imageData });
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Calculates blur score using Laplacian variance method
 * @param imageData - The image data to analyze
 * @returns Blur score from 0-100 (higher is sharper)
 */
export const calculateBlurScore = (imageData: ImageData): number => {
  const { data, width, height } = imageData;
  
  // Convert to grayscale and calculate Laplacian variance
  const grayscale: number[] = [];
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    grayscale.push(gray);
  }
  
  // Apply Laplacian kernel
  const laplacian: number[] = [];
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
  const mean = laplacian.reduce((sum, val) => sum + val, 0) / laplacian.length;
  const variance = laplacian.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / laplacian.length;
  
  // Normalize to 0-100 scale (empirically determined scaling)
  const normalizedScore = Math.min(100, Math.max(0, Math.log(variance + 1) * 15));
  
  return Math.round(normalizedScore);
};