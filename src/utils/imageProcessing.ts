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
 * @param maxSize - Maximum size for analysis (default: 800px)
 * @returns Promise resolving to canvas context and image data
 */
export const loadImageForAnalysis = (file: File, maxSize: number = 800): Promise<{
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

        // Set canvas size
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        // Clear canvas with white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, newWidth, newHeight);
        
        // Draw image
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        
        // Get image data
        let imageData: ImageData;
        try {
          imageData = ctx.getImageData(0, 0, newWidth, newHeight);
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
 * Calculates blur score using Laplacian variance method
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
    
    // Convert to grayscale and calculate Laplacian variance
    const grayscale: number[] = [];
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      grayscale.push(gray);
    }
    
    // Apply Laplacian kernel (skip edges to avoid boundary issues)
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
    if (laplacian.length === 0) {
      console.warn('No valid pixels for blur calculation');
      return 0;
    }
    
    const mean = laplacian.reduce((sum, val) => sum + val, 0) / laplacian.length;
    const variance = laplacian.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / laplacian.length;
    
    // Normalize to 0-100 scale (empirically determined scaling)
    const normalizedScore = Math.min(100, Math.max(0, Math.log(variance + 1) * 15));
    
    return Math.round(normalizedScore);
  } catch (error) {
    console.error('Error calculating blur score:', error);
    return 0;
  }
};