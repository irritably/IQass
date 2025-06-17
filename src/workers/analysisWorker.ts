// Web Worker for image analysis to prevent UI blocking
import { ImageAnalysis } from '../types';
import { calculateBlurScore } from '../utils/imageAnalysis';
import { analyzeEnhancedExposure } from '../utils/enhancedExposureAnalysis';
import { analyzeNoise } from '../utils/noiseAnalysis';
import { analyzeDescriptors } from '../utils/descriptorAnalysis';
import { extractMetadata, calculateTechnicalScore } from '../utils/metadataExtraction';
import { calculateCompositeScore } from '../utils/compositeScoring';
import { createWorkerThumbnail } from '../utils/workerThumbnail';

export interface AnalysisTask {
  id: string;
  file: File;
  taskId: string;
}

export interface AnalysisResult {
  taskId: string;
  analysis: ImageAnalysis;
  error?: string;
}

export interface ProgressUpdate {
  taskId: string;
  stage: string;
  progress: number;
}

// Enhanced queue for managing analysis tasks with improved concurrency
class AnalysisQueue {
  private queue: AnalysisTask[] = [];
  private processing = new Set<string>(); // Track currently processing tasks
  private maxConcurrent: number;
  private memoryThreshold = 100 * 1024 * 1024; // 100MB memory threshold

  constructor() {
    // Dynamically set concurrency based on hardware capabilities
    this.maxConcurrent = Math.min(
      navigator.hardwareConcurrency || 4, // Use available CPU cores
      6 // Cap at 6 to prevent excessive memory usage
    );
    
    console.log(`Worker initialized with ${this.maxConcurrent} concurrent tasks`);
  }

  add(task: AnalysisTask) {
    this.queue.push(task);
    this.processNext();
  }

  private async processNext() {
    // Check if we can start more tasks
    while (this.processing.size < this.maxConcurrent && this.queue.length > 0) {
      const task = this.queue.shift()!;
      this.processing.add(task.taskId);
      
      // Process task without blocking other tasks
      this.processTask(task).finally(() => {
        this.processing.delete(task.taskId);
        // Try to process next task after this one completes
        this.processNext();
      });
    }
  }

  private async processTask(task: AnalysisTask) {
    const { file, taskId } = task;
    
    try {
      // Stage 1: Image loading and preprocessing
      self.postMessage({
        type: 'progress-update',
        data: { taskId, stage: `Loading ${file.name}...`, progress: 10 }
      });

      const imageData = await this.loadAndPreprocessImage(file);
      
      // Stage 2: Blur analysis
      self.postMessage({
        type: 'progress-update',
        data: { taskId, stage: `Analyzing sharpness for ${file.name}...`, progress: 25 }
      });

      const blurScore = calculateBlurScore(imageData);
      
      // Stage 3: Exposure analysis
      self.postMessage({
        type: 'progress-update',
        data: { taskId, stage: `Analyzing exposure for ${file.name}...`, progress: 40 }
      });

      const exposureAnalysis = analyzeEnhancedExposure(imageData);
      
      // Stage 4: Noise analysis
      self.postMessage({
        type: 'progress-update',
        data: { taskId, stage: `Analyzing noise for ${file.name}...`, progress: 55 }
      });

      const noiseAnalysis = analyzeNoise(imageData);
      
      // Stage 5: Descriptor analysis
      self.postMessage({
        type: 'progress-update',
        data: { taskId, stage: `Analyzing features for ${file.name}...`, progress: 70 }
      });

      const descriptorAnalysis = analyzeDescriptors(imageData);
      
      // Stage 6: Metadata extraction
      self.postMessage({
        type: 'progress-update',
        data: { taskId, stage: `Extracting metadata for ${file.name}...`, progress: 85 }
      });

      const metadata = await extractMetadata(file);
      const technicalScore = calculateTechnicalScore(metadata);
      
      // Stage 7: Thumbnail creation (using worker-compatible function)
      self.postMessage({
        type: 'progress-update',
        data: { taskId, stage: `Creating thumbnail for ${file.name}...`, progress: 90 }
      });

      const thumbnail = await createWorkerThumbnail(file);
      
      // Stage 8: Final calculations
      self.postMessage({
        type: 'progress-update',
        data: { taskId, stage: `Finalizing analysis for ${file.name}...`, progress: 95 }
      });

      const compositeScore = calculateCompositeScore(
        blurScore,
        exposureAnalysis.exposureScore,
        noiseAnalysis.noiseScore,
        technicalScore,
        descriptorAnalysis.photogrammetricScore
      );

      const quality = this.getQualityLevel(compositeScore.overall);

      const analysis: ImageAnalysis = {
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
      };

      // Aggressive memory cleanup
      this.cleanupImageData(imageData);

      self.postMessage({
        type: 'analysis-complete',
        data: { taskId, analysis }
      });

      // Force garbage collection hint after each task
      if (self.gc) {
        self.gc();
      }

    } catch (error) {
      console.error(`Analysis failed for ${file.name}:`, error);
      self.postMessage({
        type: 'analysis-complete',
        data: {
          taskId,
          analysis: {
            id: Math.random().toString(36).substr(2, 9),
            file,
            name: file.name,
            size: file.size,
            blurScore: 0,
            quality: 'unsuitable' as const,
            thumbnail: '',
            processed: true,
            error: error instanceof Error ? error.message : 'Analysis failed'
          }
        }
      });
    }
  }

  private async loadAndPreprocessImage(file: File): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      // Create optimized canvas size based on file size
      const maxAnalysisSize = this.getOptimalCanvasSize(file.size);
      const canvas = new OffscreenCanvas(maxAnalysisSize, maxAnalysisSize);
      const ctx = canvas.getContext('2d', {
        alpha: false,
        desynchronized: true,
        willReadFrequently: true
      });
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Use createImageBitmap instead of Image (Web Worker compatible)
      createImageBitmap(file)
        .then((imageBitmap) => {
          try {
            // Calculate optimal dimensions
            const ratio = Math.min(maxAnalysisSize / imageBitmap.width, maxAnalysisSize / imageBitmap.height);
            canvas.width = Math.floor(imageBitmap.width * ratio);
            canvas.height = Math.floor(imageBitmap.height * ratio);
            
            // Use optimized rendering settings
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            // Draw the image bitmap to canvas
            ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            // Clean up the image bitmap
            imageBitmap.close();
            
            resolve(imageData);
          } catch (error) {
            imageBitmap.close();
            reject(error);
          }
        })
        .catch((error) => {
          reject(new Error(`Failed to create image bitmap for ${file.name}: ${error.message}`));
        });
    });
  }

  private getOptimalCanvasSize(fileSize: number): number {
    // Adjust canvas size based on file size to balance quality and performance
    if (fileSize > 10 * 1024 * 1024) { // > 10MB
      return 600; // Smaller canvas for very large files
    } else if (fileSize > 5 * 1024 * 1024) { // > 5MB
      return 700;
    } else {
      return 800; // Default size for smaller files
    }
  }

  private cleanupImageData(imageData: ImageData) {
    // Aggressive cleanup to help garbage collection
    try {
      // Clear the data array
      if (imageData.data) {
        imageData.data.fill(0);
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  private getQualityLevel(compositeScore: number): ImageAnalysis['quality'] {
    if (compositeScore >= 85) return 'excellent';
    if (compositeScore >= 70) return 'good';
    if (compositeScore >= 40) return 'poor';
    return 'unsuitable';
  }

  clear() {
    this.queue.length = 0;
    // Note: We can't cancel already processing tasks, but we can clear the queue
  }

  getStatus() {
    return {
      queueLength: this.queue.length,
      processing: this.processing.size,
      maxConcurrent: this.maxConcurrent
    };
  }
}

// Initialize enhanced queue
const analysisQueue = new AnalysisQueue();

// Handle messages from main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'analyze-image':
      analysisQueue.add(data as AnalysisTask);
      break;
    
    case 'clear-queue':
      analysisQueue.clear();
      break;

    case 'get-status':
      self.postMessage({
        type: 'status-update',
        data: analysisQueue.getStatus()
      });
      break;
      
    default:
      console.warn('Unknown message type:', type);
  }
});

// Periodic status updates for debugging
setInterval(() => {
  const status = analysisQueue.getStatus();
  if (status.queueLength > 0 || status.processing > 0) {
    console.log(`Worker status: Queue: ${status.queueLength}, Processing: ${status.processing}/${status.maxConcurrent}`);
  }
}, 2000);

// Export types for main thread
export type WorkerMessage = 
  | { type: 'analyze-image'; data: AnalysisTask }
  | { type: 'clear-queue' }
  | { type: 'get-status' };

export type WorkerResponse = 
  | { type: 'analysis-complete'; data: AnalysisResult }
  | { type: 'progress-update'; data: ProgressUpdate }
  | { type: 'status-update'; data: { queueLength: number; processing: number; maxConcurrent: number } };