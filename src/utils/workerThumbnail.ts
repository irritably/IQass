// Worker-compatible thumbnail creation using OffscreenCanvas
export const createWorkerThumbnail = async (file: File): Promise<string> => {
  try {
    // Create image bitmap from file (Web Worker compatible)
    const imageBitmap = await createImageBitmap(file);
    
    // Calculate thumbnail dimensions
    const maxSize = 150;
    const ratio = Math.min(maxSize / imageBitmap.width, maxSize / imageBitmap.height);
    const width = Math.floor(imageBitmap.width * ratio);
    const height = Math.floor(imageBitmap.height * ratio);
    
    // Create OffscreenCanvas (Web Worker compatible)
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d', {
      alpha: false,
      desynchronized: true,
      willReadFrequently: false
    });
    
    if (!ctx) {
      imageBitmap.close();
      throw new Error('Failed to get OffscreenCanvas context');
    }
    
    // Configure high-quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Draw the image
    ctx.drawImage(imageBitmap, 0, 0, width, height);
    
    // Clean up the image bitmap
    imageBitmap.close();
    
    // Convert to blob and then to base64
    const blob = await canvas.convertToBlob({
      type: 'image/jpeg',
      quality: 0.8
    });
    
    // Convert blob to base64 using FileReader
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert blob to base64'));
        }
      };
      reader.onerror = () => reject(new Error('FileReader error'));
      reader.readAsDataURL(blob);
    });
    
  } catch (error) {
    console.error('Worker thumbnail creation failed:', error);
    // Return empty string as fallback
    return '';
  }
};

// Utility function to check if we're in a Web Worker context
export const isWorkerContext = (): boolean => {
  return typeof importScripts === 'function' && typeof document === 'undefined';
};