import { ImageAnalysis } from '../types';
import { analyzeEnhancedExposure } from './enhancedExposureAnalysis';
import { analyzeNoise } from './noiseAnalysis';
import { extractMetadata, calculateTechnicalScore } from './metadataExtraction';
import { calculateCompositeScore } from './compositeScoring';
import { analyzeDescriptors } from './descriptorAnalysis';

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

export const getQualityLevel = (compositeScore: number): ImageAnalysis['quality'] => {
  if (compositeScore >= 85) return 'excellent';
  if (compositeScore >= 70) return 'good';
  if (compositeScore >= 40) return 'poor';
  return 'unsuitable';
};

export const createThumbnail = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      const maxSize = 150;
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

export const analyzeImage = async (file: File): Promise<ImageAnalysis> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = async () => {
      try {
        // Resize for analysis (faster processing)
        const maxAnalysisSize = 800;
        const ratio = Math.min(maxAnalysisSize / img.width, maxAnalysisSize / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
        
        if (!imageData) {
          throw new Error('Failed to get image data');
        }
        
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
        resolve({
          id: Math.random().toString(36).substr(2, 9),
          file,
          name: file.name,
          size: file.size,
          blurScore: 0,
          quality: 'unsuitable',
          thumbnail: '',
          processed: true,
          error: error instanceof Error ? error.message : 'Analysis failed'
        });
      }
    };
    
    img.onerror = () => {
      resolve({
        id: Math.random().toString(36).substr(2, 9),
        file,
        name: file.name,
        size: file.size,
        blurScore: 0,
        quality: 'unsuitable',
        thumbnail: '',
        processed: true,
        error: 'Failed to load image'
      });
    };
    
    img.src = URL.createObjectURL(file);
  });
};

export const generateReport = (analyses: ImageAnalysis[], threshold: number) => {
  const stats = {
    totalImages: analyses.length,
    excellentCount: analyses.filter(a => a.compositeScore?.recommendation === 'excellent').length,
    goodCount: analyses.filter(a => a.compositeScore?.recommendation === 'good').length,
    acceptableCount: analyses.filter(a => a.compositeScore?.recommendation === 'acceptable').length,
    poorCount: analyses.filter(a => a.compositeScore?.recommendation === 'poor').length,
    unsuitableCount: analyses.filter(a => a.compositeScore?.recommendation === 'unsuitable').length,
    averageBlurScore: analyses.reduce((sum, a) => sum + a.blurScore, 0) / analyses.length,
    averageCompositeScore: analyses.reduce((sum, a) => sum + (a.compositeScore?.overall || 0), 0) / analyses.length,
    averageDescriptorScore: analyses.reduce((sum, a) => sum + (a.descriptorAnalysis?.photogrammetricScore || 0), 0) / analyses.length,
    averageKeypointCount: analyses.reduce((sum, a) => sum + (a.descriptorAnalysis?.keypointCount || 0), 0) / analyses.length,
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