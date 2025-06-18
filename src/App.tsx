import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { ProgressBar } from './components/ProgressBar';
import { QualitySettings } from './components/QualitySettings';
import { StatsOverview } from './components/StatsOverview';
import { ImageGrid } from './components/ImageGrid';
import { QualityHistogram } from './components/QualityHistogram';
import { ReportExport } from './components/ReportExport';
import { ImageAnalysis, ProcessingProgress, AnalysisStats } from './types';
import { analyzeImage } from './utils/imageAnalysis';
import { calculateQualityStatistics } from './utils/qualityAssessment';

function App() {
  const [analyses, setAnalyses] = useState<ImageAnalysis[]>([]);
  const [progress, setProgress] = useState<ProcessingProgress>({
    current: 0,
    total: 0,
    isProcessing: false
  });
  const [threshold, setThreshold] = useState(70); // Default threshold for composite scoring

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
      isProcessing: true
    });

    const newAnalyses: ImageAnalysis[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
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
        current: i + 1
      }));

      // Update analyses incrementally for better UX
      setAnalyses(prev => [...prev, ...newAnalyses.slice(i, i + 1)]);
    }

    // Mark processing as complete
    setProgress(prev => ({
      ...prev,
      isProcessing: false
    }));
  }, []);

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