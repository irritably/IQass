import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { ProgressBar } from './components/ProgressBar';
import { QualitySettings } from './components/QualitySettings';
import { StatsOverview } from './components/StatsOverview';
import { ImageGrid } from './components/ImageGrid';
import { QualityHistogram } from './components/QualityHistogram';
import { ReportExport } from './components/ReportExport';
import { DevToolsPanel } from './components/DevToolsPanel';
import { DevPerformancePanel } from './components/DevPerformancePanel';
import { ImageAnalysis, ProcessingProgress, AnalysisStats } from './types';
import { analyzeImage } from './utils/imageAnalysis';
import { calculateQualityStatistics } from './utils/qualityAssessment';
import { measurePerformance } from './utils/devSettings';
import { debugUtils } from './utils/debugUtils';

function App() {
  const [analyses, setAnalyses] = useState<ImageAnalysis[]>([]);
  const [progress, setProgress] = useState<ProcessingProgress>({
    current: 0,
    total: 0,
    isProcessing: false
  });
  const [threshold, setThreshold] = useState(70); // Default threshold for composite scoring
  const [devToolsVisible, setDevToolsVisible] = useState(false);

  /**
   * Calculates comprehensive statistics for all analyzed images
   */
  const calculateStats = useCallback((analyses: ImageAnalysis[]): AnalysisStats => {
    const baseStats = calculateQualityStatistics(analyses, threshold);
    
    // Calculate additional metrics for the stats overview
    const averageExposureScore = analyses.length > 0
      ? analyses.reduce((sum, a) => sum + (a.exposureAnalysis?.exposureScore || 0), 0) / analyses.length
      : 0;
    
    const averageNoiseScore = analyses.length > 0
      ? analyses.reduce((sum, a) => sum + (a.noiseAnalysis?.noiseScore || 0), 0) / analyses.length
      : 0;

    return {
      ...baseStats,
      averageExposureScore,
      averageNoiseScore,
      cameraStats: {}, // TODO: Implement camera statistics aggregation
      qualityDistribution: {
        excellent: baseStats.excellentCount,
        good: baseStats.goodCount,
        acceptable: baseStats.acceptableCount,
        poor: baseStats.poorCount,
        unsuitable: baseStats.unsuitableCount
      }
    };
  }, [threshold]);

  /**
   * Handles file selection and processes images sequentially with performance monitoring
   */
  const handleFilesSelected = useCallback(async (files: File[]) => {
    // Capture initial state for debugging
    debugUtils.captureState('batch_processing_start', {
      fileCount: files.length,
      threshold,
      timestamp: Date.now()
    });

    // Take memory snapshot before processing
    measurePerformance.memory('batch_start', files.length);

    setProgress({
      current: 0,
      total: files.length,
      isProcessing: true,
      startTime: Date.now()
    });

    const newAnalyses: ImageAnalysis[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Update progress with current image info
      setProgress(prev => ({
        ...prev,
        current: i,
        currentImageName: file.name,
        currentStep: 1,
        currentStepName: 'Loading image...',
        currentImageProgress: 0
      }));

      try {
        // Measure individual image analysis performance
        const measurementId = measurePerformance.start('image_analysis', {
          fileName: file.name,
          fileSize: file.size,
          imageIndex: i
        });

        const analysis = await analyzeImage(file);
        
        const duration = measurePerformance.end(measurementId);
        
        // Log performance for this image
        debugUtils.analyzeAlgorithm(
          'complete_image_analysis',
          analysis.file.size,
          duration,
          {
            fileName: file.name,
            blurScore: analysis.blurScore,
            compositeScore: analysis.compositeScore?.overall || 0
          }
        );

        newAnalyses.push(analysis);
      } catch (error) {
        // Create error analysis if processing fails
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

        newAnalyses.push(errorAnalysis);

        // Log error for debugging
        debugUtils.logImageStep(
          errorAnalysis.id,
          'analysis_error',
          { width: 0, height: 0 },
          0,
          null,
          { error: error instanceof Error ? error.message : 'Unknown error' }
        );
      }

      // Update progress
      setProgress(prev => ({
        ...prev,
        current: i + 1,
        currentImageProgress: 100
      }));

      // Update analyses incrementally for better UX
      setAnalyses(prev => [...prev, ...newAnalyses.slice(i, i + 1)]);

      // Take periodic memory snapshots
      if ((i + 1) % 10 === 0) {
        measurePerformance.memory(`batch_progress_${i + 1}`, i + 1);
      }
    }

    // Mark processing as complete
    setProgress(prev => ({
      ...prev,
      isProcessing: false,
      currentImageName: undefined,
      currentStep: undefined,
      currentStepName: undefined,
      currentImageProgress: undefined
    }));

    // Final memory snapshot and state capture
    measurePerformance.memory('batch_complete', files.length);
    debugUtils.captureState('batch_processing_complete', {
      processedCount: newAnalyses.length,
      successCount: newAnalyses.filter(a => !a.error).length,
      errorCount: newAnalyses.filter(a => a.error).length,
      averageScore: newAnalyses.reduce((sum, a) => sum + (a.compositeScore?.overall || 0), 0) / newAnalyses.length,
      timestamp: Date.now()
    });
  }, [threshold]);

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
          <ProgressBar progress={progress} />

          {/* Settings with Live Visualization */}
          {analyses.length > 0 && (
            <QualitySettings 
              threshold={threshold}
              onThresholdChange={setThreshold}
              analyses={analyses}
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

          {/* Image Grid with Comparison Features */}
          <ImageGrid analyses={analyses} threshold={threshold} />

          {/* Export Section */}
          <ReportExport analyses={analyses} threshold={threshold} />
        </div>
      </main>

      {/* Development Tools Panel */}
      <DevToolsPanel 
        isVisible={devToolsVisible}
        onToggle={() => setDevToolsVisible(!devToolsVisible)}
      />

      {/* Development Performance Panel */}
      <DevPerformancePanel />
    </div>
  );
}

export default App;