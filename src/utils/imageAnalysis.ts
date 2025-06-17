import { ImageAnalysis } from '../types';
import { analyzeEnhancedExposure } from './enhancedExposureAnalysis';
import { analyzeNoise } from './noiseAnalysis';
import { extractMetadata, calculateTechnicalScore } from './metadataExtraction';
import { calculateCompositeScore } from './compositeScoring';
import { analyzeDescriptors } from './descriptorAnalysis';

// Optimized blur detection with reduced memory allocation
export const calculateBlurScore = (imageData: ImageData): number => {
  const { data, width, height } = imageData;
  
  // Pre-allocate arrays to reduce garbage collection
  const grayscaleSize = width * height;
  const grayscale = new Float32Array(grayscaleSize);
  
  // Convert to grayscale using optimized loop
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    grayscale[j] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  
  // Apply Laplacian kernel with boundary checking
  let sum = 0;
  let sumSquares = 0;
  let count = 0;
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const value = 
        -1 * grayscale[idx - width - 1] + -1 * grayscale[idx - width] + -1 * grayscale[idx - width + 1] +
        -1 * grayscale[idx - 1] + 8 * grayscale[idx] + -1 * grayscale[idx + 1] +
        -1 * grayscale[idx + width - 1] + -1 * grayscale[idx + width] + -1 * grayscale[idx + width + 1];
      
      const absValue = Math.abs(value);
      sum += absValue;
      sumSquares += absValue * absValue;
      count++;
    }
  }
  
  // Calculate variance more efficiently
  const mean = sum / count;
  const variance = (sumSquares / count) - (mean * mean);
  
  // Normalize to 0-100 scale (empirically determined scaling)
  const normalizedScore = Math.min(100, Math.max(0, Math.log(variance + 1) * 15));
  
  return Math.round(normalizedScore);
};

export const getQualityLevel = (compositeScore: number): ImageAnalysis['quality'] => {
  if (compositeScore >= 85) return 'excellent';
  if (compositeScore >= 70) return 'good';
  if (compositeScore >= 40) return 'poor';
  return 'unsuitable';
};

// Optimized thumbnail creation with better memory management
export const createThumbnail = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', {
      alpha: false,
      desynchronized: true,
      willReadFrequently: false
    });
    
    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }
    
    const img = new Image();
    
    img.onload = () => {
      try {
        const maxSize = 150;
        const ratio = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        // Use high-quality scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
        
        // Clean up
        URL.revokeObjectURL(img.src);
        
        resolve(thumbnail);
      } catch (error) {
        URL.revokeObjectURL(img.src);
        reject(error);
      }
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image for thumbnail'));
    };
    
    img.src = URL.createObjectURL(file);
  });
};

// Fallback analysis function for when workers are not available
export const analyzeImageFallback = async (file: File): Promise<ImageAnalysis> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', {
      alpha: false,
      desynchronized: true,
      willReadFrequently: true
    });
    
    if (!ctx) {
      resolve(createErrorAnalysis(file, 'Failed to get canvas context'));
      return;
    }
    
    const img = new Image();
    
    img.onload = async () => {
      try {
        // Resize for analysis (faster processing)
        const maxAnalysisSize = 800;
        const ratio = Math.min(maxAnalysisSize / img.width, maxAnalysisSize / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        // Use optimized canvas settings
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Perform all analyses
        const blurScore = calculateBlurScore(imageData);
        const exposureAnalysis = analyzeEnhancedExposure(imageData);
        const noiseAnalysis = analyzeNoise(imageData);
        const descriptorAnalysis = analyzeDescriptors(imageData);
        const metadata = await extractMetadata(file);
        const technicalScore = calculateTechnicalScore(metadata);
        
        // Calculate composite score with descriptor analysis
        const compositeScore = calculateCompositeScore(
          blurScore,
          exposureAnalysis.exposureScore,
          noiseAnalysis.noiseScore,
          technicalScore,
          descriptorAnalysis.photogrammetricScore
        );
        
        const quality = getQualityLevel(compositeScore.overall);
        const thumbnail = await createThumbnail(file);
        
        // Clean up
        URL.revokeObjectURL(img.src);
        
        resolve({
          id: Math.random().toString(36).substr(2, 9),
          file,
          name: file.name,
          size: file.size,
          blurScore,
          quality,
          thumbnail,
          processed: true,
          exposureAnalysis,
          noiseAnalysis,
          descriptorAnalysis,
          metadata,
          compositeScore
        });
      } catch (error) {
        URL.revokeObjectURL(img.src);
        resolve(createErrorAnalysis(file, error instanceof Error ? error.message : 'Analysis failed'));
      }
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      resolve(createErrorAnalysis(file, 'Failed to load image'));
    };
    
    img.src = URL.createObjectURL(file);
  });
};

const createErrorAnalysis = (file: File, error: string): ImageAnalysis => ({
  id: Math.random().toString(36).substr(2, 9),
  file,
  name: file.name,
  size: file.size,
  blurScore: 0,
  quality: 'unsuitable',
  thumbnail: '',
  processed: true,
  error
});

export const generateReport = (analyses: ImageAnalysis[], threshold: number) => {
  const stats = {
    totalImages: analyses.length,
    excellentCount: analyses.filter(a => a.compositeScore?.recommendation === 'excellent').length,
    goodCount: analyses.filter(a => a.compositeScore?.recommendation === 'good').length,
    acceptableCount: analyses.filter(a => a.compositeScore?.recommendation === 'acceptable').length,
    poorCount: analyses.filter(a => a.compositeScore?.recommendation === 'poor').length,
    unsuitableCount: analyses.filter(a => a.compositeScore?.recommendation === 'unsuitable').length,
    averageBlurScore: analyses.length > 0 ? analyses.reduce((sum, a) => sum + a.blurScore, 0) / analyses.length : 0,
    averageCompositeScore: analyses.length > 0 ? analyses.reduce((sum, a) => sum + (a.compositeScore?.overall || 0), 0) / analyses.length : 0,
    averageDescriptorScore: analyses.length > 0 ? analyses.reduce((sum, a) => sum + (a.descriptorAnalysis?.photogrammetricScore || 0), 0) / analyses.length : 0,
    averageKeypointCount: analyses.length > 0 ? analyses.reduce((sum, a) => sum + (a.descriptorAnalysis?.keypointCount || 0), 0) / analyses.length : 0,
    recommendedForReconstruction: analyses.filter(a => (a.compositeScore?.overall || 0) >= threshold).length
  };
  
  return {
    stats,
    recommendations: analyses.map(analysis => ({
      filename: analysis.name,
      blurScore: analysis.blurScore,
      compositeScore: analysis.compositeScore?.overall || 0,
      descriptorScore: analysis.descriptorAnalysis?.photogrammetricScore || 0,
      keypointCount: analysis.descriptorAnalysis?.keypointCount || 0,
      quality: analysis.compositeScore?.recommendation || 'unsuitable',
      recommended: (analysis.compositeScore?.overall || 0) >= threshold,
      fileSize: `${(analysis.size / 1024 / 1024).toFixed(2)} MB`,
      exposureScore: analysis.exposureAnalysis?.exposureScore || 0,
      noiseScore: analysis.noiseAnalysis?.noiseScore || 0,
      photogrammetricSuitability: analysis.descriptorAnalysis?.reconstructionSuitability || 'unsuitable',
      cameraInfo: analysis.metadata?.camera.make && analysis.metadata?.camera.model 
        ? `${analysis.metadata.camera.make} ${analysis.metadata.camera.model}`
        : 'Unknown'
    }))
  };
};

export const exportToCSV = (analyses: ImageAnalysis[], threshold: number) => {
  const headers = [
    'Filename', 'Composite Score', 'Blur Score', 'Exposure Score', 'Noise Score', 
    'Technical Score', 'Descriptor Score', 'Keypoint Count', 'Keypoint Density',
    'Feature Distribution', 'Photogrammetric Suitability', 'Recommendation', 
    'Recommended for Reconstruction', 'File Size (MB)', 'Camera Make', 'Camera Model', 
    'ISO', 'Aperture', 'Shutter Speed', 'Focal Length', 'Status'
  ];
  
  const rows = analyses.map(analysis => [
    analysis.name,
    analysis.compositeScore?.overall?.toString() || '0',
    analysis.blurScore.toString(),
    analysis.exposureAnalysis?.exposureScore?.toString() || '0',
    analysis.noiseAnalysis?.noiseScore?.toString() || '0',
    '0', // Technical score placeholder
    analysis.descriptorAnalysis?.photogrammetricScore?.toString() || '0',
    analysis.descriptorAnalysis?.keypointCount?.toString() || '0',
    analysis.descriptorAnalysis?.keypointDensity?.toFixed(2) || '0',
    analysis.descriptorAnalysis?.keypointDistribution?.uniformity?.toString() || '0',
    analysis.descriptorAnalysis?.reconstructionSuitability || 'unsuitable',
    analysis.compositeScore?.recommendation || 'unsuitable',
    (analysis.compositeScore?.overall || 0) >= threshold ? 'Yes' : 'No',
    (analysis.size / 1024 / 1024).toFixed(2),
    analysis.metadata?.camera.make || '',
    analysis.metadata?.camera.model || '',
    analysis.metadata?.settings.iso?.toString() || '',
    analysis.metadata?.settings.aperture?.toString() || '',
    analysis.metadata?.settings.shutterSpeed || '',
    analysis.metadata?.settings.focalLength?.toString() || '',
    analysis.error ? 'Error' : 'Success'
  ]);
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `drone_image_quality_report_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};