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

function App() {
  const [analyses, setAnalyses] = useState<ImageAnalysis[]>([]);
  const [progress, setProgress] = useState<ProcessingProgress>({
    current: 0,
    total: 0,
    isProcessing: false
  });
  const [threshold, setThreshold] = useState(70); // Updated default threshold for composite scoring

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

      setProgress(prev => ({
        ...prev,
        current: i + 1
      }));

      // Update analyses incrementally for better UX
      setAnalyses(prev => [...prev, ...newAnalyses.slice(i, i + 1)]);
    }

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