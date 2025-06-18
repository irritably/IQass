import React, { useState, useCallback, useMemo } from 'react';
import { Navigation } from './components/Navigation';
import { UploadAnalyzeView } from './views/UploadAnalyzeView';
import { DashboardView } from './views/DashboardView';
import { AnalysisResultsView } from './views/AnalysisResultsView';
import { ImageAnalysis, ProcessingProgress, AnalysisStats, ViewType } from './types';
import { analyzeImage } from './utils/imageAnalysis';
import { calculateQualityStatistics } from './utils/qualityAssessment';

function App() {
  // Core application state
  const [analyses, setAnalyses] = useState<ImageAnalysis[]>([]);
  const [progress, setProgress] = useState<ProcessingProgress>({
    current: 0,
    total: 0,
    isProcessing: false
  });
  const [threshold, setThreshold] = useState(70);
  
  // Navigation state
  const [currentView, setCurrentView] = useState<ViewType>('upload');

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
   * Handles file selection and processes images sequentially
   */
  const handleFilesSelected = useCallback(async (files: File[]) => {
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
        const analysis = await analyzeImage(file);
        newAnalyses.push(analysis);
      } catch (error) {
        // Create error analysis if processing fails
        newAnalyses.push({
          id: Math.random().toString(36).substr(2, 9),
          file,
          name: file.name,
          size: file.size,
          blurScore: 0,
          quality: 'unsuitable',
          thumbnail: '',
          processed: true,
          error: 'Analysis failed'
        });
      }

      // Update progress
      setProgress(prev => ({
        ...prev,
        current: i + 1,
        currentImageProgress: 100
      }));

      // Update analyses incrementally for better UX
      setAnalyses(prev => [...prev, ...newAnalyses.slice(i, i + 1)]);
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

    // Auto-navigate to dashboard after processing completes
    if (newAnalyses.length > 0) {
      setTimeout(() => setCurrentView('dashboard'), 1000);
    }
  }, []);

  /**
   * Handles view navigation with smart defaults
   */
  const handleViewChange = useCallback((view: ViewType) => {
    setCurrentView(view);
  }, []);

  // Calculate stats for current analyses
  const stats = useMemo(() => calculateStats(analyses), [analyses, calculateStats]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <Navigation 
        currentView={currentView}
        onViewChange={handleViewChange}
        analysisCount={analyses.length}
        isProcessing={progress.isProcessing}
      />
      
      {/* Main Content */}
      <main>
        {currentView === 'upload' && (
          <UploadAnalyzeView
            onFilesSelected={handleFilesSelected}
            progress={progress}
            threshold={threshold}
            onThresholdChange={setThreshold}
            analyses={analyses}
            isProcessing={progress.isProcessing}
          />
        )}

        {currentView === 'dashboard' && (
          <DashboardView
            analyses={analyses}
            threshold={threshold}
            stats={stats}
          />
        )}

        {currentView === 'results' && (
          <AnalysisResultsView
            analyses={analyses}
            threshold={threshold}
          />
        )}
      </main>
    </div>
  );
}

export default App;