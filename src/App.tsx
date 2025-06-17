import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { ProgressBar } from './components/ProgressBar';
import { QualitySettings } from './components/QualitySettings';
import { StatsOverview } from './components/StatsOverview';
import { ImageGrid } from './components/ImageGrid';
import { QualityHistogram } from './components/QualityHistogram';
import { ReportExport } from './components/ReportExport';
import { ImageAnalysis, ProcessingProgress, AnalysisStats } from './types';
import { WorkerManager } from './utils/workerManager';
import { analyzeImageFallback } from './utils/imageAnalysis';

function App() {
  const [analyses, setAnalyses] = useState<ImageAnalysis[]>([]);
  const [progress, setProgress] = useState<ProcessingProgress>({
    current: 0,
    total: 0,
    isProcessing: false
  });
  const [threshold, setThreshold] = useState(70);
  const [currentStage, setCurrentStage] = useState<string>('');
  const [useWorkers, setUseWorkers] = useState(true);
  
  const workerManagerRef = useRef<WorkerManager | null>(null);
  const processingQueueRef = useRef<File[]>([]);
  const currentTasksRef = useRef<Map<string, File>>(new Map());
  
  // NEW: Batching state for UI updates
  const analysisBufferRef = useRef<ImageAnalysis[]>([]);
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const completedCountRef = useRef<number>(0);

  // NEW: Batch UI update function
  const flushAnalysisBuffer = useCallback(() => {
    if (analysisBufferRef.current.length > 0) {
      setAnalyses(prev => [...prev, ...analysisBufferRef.current]);
      analysisBufferRef.current = [];
    }
    
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
      batchTimeoutRef.current = null;
    }
  }, []);

  // NEW: Debounced batch update function
  const scheduleBatchUpdate = useCallback(() => {
    // Clear existing timeout
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }
    
    // Immediate flush if buffer is large enough or all tasks are complete
    const bufferSize = analysisBufferRef.current.length;
    const allTasksComplete = currentTasksRef.current.size === 0;
    
    if (bufferSize >= 5 || allTasksComplete) {
      flushAnalysisBuffer();
    } else {
      // Schedule a delayed flush for smaller batches
      batchTimeoutRef.current = setTimeout(flushAnalysisBuffer, 200);
    }
  }, [flushAnalysisBuffer]);

  // Initialize worker manager
  useEffect(() => {
    if (useWorkers) {
      try {
        workerManagerRef.current = new WorkerManager({
          onProgress: (taskId: string, stage: string, progressValue: number) => {
            setCurrentStage(stage);
            // Update progress based on individual task progress
            const file = currentTasksRef.current.get(taskId);
            if (file) {
              const currentIndex = processingQueueRef.current.indexOf(file);
              if (currentIndex !== -1) {
                const overallProgress = currentIndex + (progressValue / 100);
                setProgress(prev => ({
                  ...prev,
                  current: Math.min(prev.total, Math.floor(overallProgress))
                }));
              }
            }
          },
          onComplete: (taskId: string, analysis: ImageAnalysis, error?: string) => {
            if (error) {
              console.error('Analysis failed:', error);
            }
            
            // NEW: Add to buffer instead of directly updating state
            analysisBufferRef.current.push(analysis);
            completedCountRef.current++;
            
            // Update progress counter
            setProgress(prev => ({
              ...prev,
              current: completedCountRef.current
            }));
            
            // Clean up task tracking
            currentTasksRef.current.delete(taskId);
            
            // Check if all tasks are complete
            if (currentTasksRef.current.size === 0) {
              setProgress(prev => ({
                ...prev,
                isProcessing: false
              }));
              setCurrentStage('');
            }
            
            // NEW: Schedule batch update
            scheduleBatchUpdate();
          }
        });
      } catch (error) {
        console.warn('Failed to initialize Web Workers, falling back to main thread:', error);
        setUseWorkers(false);
      }
    }

    return () => {
      if (workerManagerRef.current) {
        workerManagerRef.current.terminate();
      }
      // Clean up any pending batch timeout
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
    };
  }, [useWorkers, scheduleBatchUpdate]);

  const calculateStats = useCallback((analyses: ImageAnalysis[]): AnalysisStats => {
    const excellentCount = analyses.filter(a => a.compositeScore?.recommendation === 'excellent').length;
    const goodCount = analyses.filter(a => a.compositeScore?.recommendation === 'good').length;
    const acceptableCount = analyses.filter(a => a.compositeScore?.recommendation === 'acceptable').length;
    const poorCount = analyses.filter(a => a.compositeScore?.recommendation === 'poor').length;
    const unsuitableCount = analyses.filter(a => a.compositeScore?.recommendation === 'unsuitable').length;

    return {
      totalImages: analyses.length,
      excellentCount,
      goodCount,
      poorCount,
      unsuitableCount,
      averageBlurScore: analyses.length > 0 
        ? analyses.reduce((sum, a) => sum + a.blurScore, 0) / analyses.length 
        : 0,
      averageExposureScore: analyses.length > 0
        ? analyses.reduce((sum, a) => sum + (a.exposureAnalysis?.exposureScore || 0), 0) / analyses.length
        : 0,
      averageNoiseScore: analyses.length > 0
        ? analyses.reduce((sum, a) => sum + (a.noiseAnalysis?.noiseScore || 0), 0) / analyses.length
        : 0,
      averageCompositeScore: analyses.length > 0
        ? analyses.reduce((sum, a) => sum + (a.compositeScore?.overall || 0), 0) / analyses.length
        : 0,
      averageDescriptorScore: analyses.length > 0
        ? analyses.reduce((sum, a) => sum + (a.descriptorAnalysis?.photogrammetricScore || 0), 0) / analyses.length
        : 0,
      averageKeypointCount: analyses.length > 0
        ? analyses.reduce((sum, a) => sum + (a.descriptorAnalysis?.keypointCount || 0), 0) / analyses.length
        : 0,
      recommendedForReconstruction: analyses.filter(a => (a.compositeScore?.overall || 0) >= threshold).length,
      cameraStats: {},
      qualityDistribution: {
        excellent: excellentCount,
        good: goodCount,
        acceptable: acceptableCount,
        poor: poorCount,
        unsuitable: unsuitableCount
      }
    };
  }, [threshold]);

  const handleFilesSelected = useCallback(async (files: File[]) => {
    // Clear previous results and reset counters
    setAnalyses([]);
    analysisBufferRef.current = [];
    completedCountRef.current = 0;
    
    // Clear any pending batch timeout
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
      batchTimeoutRef.current = null;
    }
    
    // Initialize progress
    setProgress({
      current: 0,
      total: files.length,
      isProcessing: true
    });

    // Store files for progress tracking
    processingQueueRef.current = [...files];
    currentTasksRef.current.clear();

    if (useWorkers && workerManagerRef.current?.isAvailable()) {
      // Use Web Workers for processing
      setCurrentStage('Initializing parallel analysis...');
      
      for (const file of files) {
        try {
          const taskId = Math.random().toString(36).substr(2, 9);
          currentTasksRef.current.set(taskId, file);
          
          // Start analysis in worker (non-blocking)
          workerManagerRef.current.analyzeImage(file).catch(error => {
            console.error('Worker analysis failed:', error);
            // Fallback to main thread for this file
            analyzeImageFallback(file).then(analysis => {
              analysisBufferRef.current.push(analysis);
              completedCountRef.current++;
              setProgress(prev => ({
                ...prev,
                current: completedCountRef.current
              }));
              scheduleBatchUpdate();
            });
          });
        } catch (error) {
          console.error('Failed to start worker analysis:', error);
        }
      }
    } else {
      // Fallback to main thread processing
      setCurrentStage('Processing on main thread...');
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
          setCurrentStage(`Analyzing ${file.name}...`);
          const analysis = await analyzeImageFallback(file);
          
          // NEW: Use batching even for fallback processing
          analysisBufferRef.current.push(analysis);
          completedCountRef.current++;
          
          // Update progress
          setProgress(prev => ({
            ...prev,
            current: completedCountRef.current
          }));
          
          // Schedule batch update
          scheduleBatchUpdate();
        } catch (error) {
          console.error('Analysis failed:', error);
          const errorAnalysis: ImageAnalysis = {
            id: Math.random().toString(36).substr(2, 9),
            file,
            name: file.name,
            size: file.size,
            blurScore: 0,
            quality: 'unsuitable',
            thumbnail: '',
            processed: true,
            error: 'Analysis failed'
          };
          
          analysisBufferRef.current.push(errorAnalysis);
          completedCountRef.current++;
          setProgress(prev => ({
            ...prev,
            current: completedCountRef.current
          }));
          scheduleBatchUpdate();
        }

        // Small delay to prevent UI blocking
        if (i < files.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      setProgress(prev => ({
        ...prev,
        isProcessing: false
      }));
      setCurrentStage('');
      
      // Final flush for fallback processing
      flushAnalysisBuffer();
    }
  }, [useWorkers, scheduleBatchUpdate, flushAnalysisBuffer]);

  const stats = calculateStats(analyses);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Upload Section */}
          <FileUpload 
            onFilesSelected={handleFilesSelected}
            isProcessing={progress.isProcessing}
          />

          {/* Progress Bar */}
          <ProgressBar progress={progress} currentStage={currentStage} />

          {/* Performance Info */}
          {analyses.length === 0 && !progress.isProcessing && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <div className="text-blue-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-blue-900">Performance Optimized</h4>
                  <p className="text-sm text-blue-800 mt-1">
                    This application uses optimized Web Workers with parallel processing and batched UI updates for smooth performance even with large batches. 
                    {useWorkers ? ' Web Workers with enhanced concurrency are active.' : ' Fallback mode active - consider using a modern browser for best performance.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Settings */}
          {analyses.length > 0 && (
            <QualitySettings 
              threshold={threshold}
              onThresholdChange={setThreshold}
            />
          )}

          {/* Stats Overview */}
          {analyses.length > 0 && (
            <StatsOverview stats={stats} threshold={threshold} />
          )}

          {/* Quality Histogram */}
          {analyses.length > 0 && (
            <QualityHistogram analyses={analyses} />
          )}

          {/* Image Grid */}
          <ImageGrid analyses={analyses} threshold={threshold} />

          {/* Export Section */}
          <ReportExport analyses={analyses} threshold={threshold} />
        </div>
      </main>
    </div>
  );
}

export default App;