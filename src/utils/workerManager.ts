// Worker manager for handling Web Worker lifecycle and communication
import { ImageAnalysis } from '../types';
import type { AnalysisTask, AnalysisResult, ProgressUpdate, WorkerMessage, WorkerResponse } from '../workers/analysisWorker';

export interface WorkerManagerCallbacks {
  onProgress: (taskId: string, stage: string, progress: number) => void;
  onComplete: (taskId: string, analysis: ImageAnalysis, error?: string) => void;
}

export class WorkerManager {
  private worker: Worker | null = null;
  private callbacks: WorkerManagerCallbacks;
  private pendingTasks = new Map<string, { resolve: Function; reject: Function }>();

  constructor(callbacks: WorkerManagerCallbacks) {
    this.callbacks = callbacks;
    this.initializeWorker();
  }

  private initializeWorker() {
    try {
      // Create worker from the analysis worker file
      this.worker = new Worker(
        new URL('../workers/analysisWorker.ts', import.meta.url),
        { type: 'module' }
      );

      this.worker.addEventListener('message', this.handleWorkerMessage.bind(this));
      this.worker.addEventListener('error', this.handleWorkerError.bind(this));
    } catch (error) {
      console.error('Failed to initialize worker:', error);
      this.worker = null;
    }
  }

  private handleWorkerMessage(event: MessageEvent<WorkerResponse>) {
    const { type, data } = event.data;

    switch (type) {
      case 'progress-update':
        const progressData = data as ProgressUpdate;
        this.callbacks.onProgress(progressData.taskId, progressData.stage, progressData.progress);
        break;

      case 'analysis-complete':
        const resultData = data as AnalysisResult;
        this.callbacks.onComplete(resultData.taskId, resultData.analysis, resultData.error);
        
        // Resolve pending promise
        const pendingTask = this.pendingTasks.get(resultData.taskId);
        if (pendingTask) {
          if (resultData.error) {
            pendingTask.reject(new Error(resultData.error));
          } else {
            pendingTask.resolve(resultData.analysis);
          }
          this.pendingTasks.delete(resultData.taskId);
        }
        break;

      default:
        console.warn('Unknown worker response type:', type);
    }
  }

  private handleWorkerError(error: ErrorEvent) {
    console.error('Worker error:', error);
    
    // Reject all pending tasks
    this.pendingTasks.forEach(({ reject }) => {
      reject(new Error('Worker error occurred'));
    });
    this.pendingTasks.clear();
    
    // Attempt to reinitialize worker
    this.terminate();
    setTimeout(() => this.initializeWorker(), 1000);
  }

  analyzeImage(file: File): Promise<ImageAnalysis> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not available'));
        return;
      }

      const taskId = Math.random().toString(36).substr(2, 9);
      
      // Store promise resolvers
      this.pendingTasks.set(taskId, { resolve, reject });

      // Send task to worker
      const message: WorkerMessage = {
        type: 'analyze-image',
        data: {
          id: Math.random().toString(36).substr(2, 9),
          file,
          taskId
        }
      };

      this.worker.postMessage(message);
    });
  }

  clearQueue() {
    if (this.worker) {
      const message: WorkerMessage = { type: 'clear-queue' };
      this.worker.postMessage(message);
    }
    
    // Reject all pending tasks
    this.pendingTasks.forEach(({ reject }) => {
      reject(new Error('Queue cleared'));
    });
    this.pendingTasks.clear();
  }

  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    
    // Reject all pending tasks
    this.pendingTasks.forEach(({ reject }) => {
      reject(new Error('Worker terminated'));
    });
    this.pendingTasks.clear();
  }

  isAvailable(): boolean {
    return this.worker !== null;
  }
}