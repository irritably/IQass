import React, { useState, useCallback } from 'react';
import { DashboardLayout } from './components/Layout/DashboardLayout';
import { ModernFileUpload } from './components/Dashboard/ModernFileUpload';
import { ModernProgressBar } from './components/Dashboard/ModernProgressBar';
import { QualitySettings } from './components/QualitySettings';
import { ModernStatsOverview } from './components/Dashboard/ModernStatsOverview';
import { ImageGrid } from './components/ImageGrid';
import { QualityHistogram } from './components/QualityHistogram';
import { ReportExport } from './components/ReportExport';
import { ImageAnalysis, ProcessingProgress, AnalysisStats, ProcessingStep } from './types';
import { analyzeImage } from './utils/imageAnalysis';
import { calculateQualityStatistics } from './utils/qualityAssessment';

function App() {
  const [analyses, setAnalyses] = useState<ImageAnalysis[]>([]);
  const [progress, setProgress] = useState<ProcessingProgress>({
    current: 0,
    total: 0,
    isProcessing: false
  });
  const [threshold, setThreshold] = useState(70);

  const calculateStats = useCallback((analyses: ImageAnalysis[]): AnalysisStats => {
    const baseStats = calculateQualityStatistics(analyses, threshold);
    
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
      cameraStats: {},
      qualityDistribution: {
        excellent: baseStats.excellentCount,
        good: baseStats.goodCount,
        acceptable: baseStats.acceptableCount,
        poor: baseStats.poorCount,
        unsuitable: baseStats.unsuitableCount
      }
    };
  }, [threshold]);

  const handleFilesSelected = useCallback(async (files: File[]) => {
    const startTime = Date.now();
    
    setProgress({
      current: 0,
      total: files.length,
      isProcessing: true,
      startTime
    });

    const newAnalyses: ImageAnalysis[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const imageStartTime = Date.now();
      
      setProgress(prev => ({
        ...prev,
        current: i,
        currentImageName: file.name,
        currentStep: ProcessingStep.EXTRACT,
        imageDuration: Date.now() - imageStartTime
      }));

      try {
        const analysis = await analyzeImage(file, (step, stepProgress) => {
          setProgress(prev => ({
            ...prev,
            currentStep: step,
            currentImageProgress: stepProgress,
            imageDuration: Date.now() - imageStartTime
          }));
        });
        
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
          error: 'Analysis failed',
          processingDuration: Date.now() - imageStartTime
        });
      }

      setProgress(prev => ({
        ...prev,
        current: i + 1,
        imageDuration: Date.now() - imageStartTime
      }));

      setAnalyses(prev => [...prev, ...newAnalyses.slice(i, i + 1)]);
    }

    setProgress(prev => ({
      ...prev,
      isProcessing: false,
      currentImageName: undefined,
      currentStep: undefined,
      currentImageProgress: undefined,
      imageDuration: undefined
    }));
  }, []);

  const stats = calculateStats(analyses);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Upload Section */}
        <div className="animate-fade-in-up">
          <ModernFileUpload 
            onFilesSelected={handleFilesSelected}
            isProcessing={progress.isProcessing}
          />
        </div>

        {/* Progress Bar */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <ModernProgressBar progress={progress} />
        </div>

        {/* Settings */}
        {analyses.length > 0 && (
          <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <QualitySettings 
              threshold={threshold}
              onThresholdChange={setThreshold}
            />
          </div>
        )}

        {/* Stats Overview */}
        {analyses.length > 0 && (
          <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <ModernStatsOverview stats={stats} threshold={threshold} />
          </div>
        )}

        {/* Quality Histogram */}
        {analyses.length > 0 && (
          <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <QualityHistogram analyses={analyses} />
          </div>
        )}

        {/* Image Grid */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <ImageGrid analyses={analyses} threshold={threshold} />
        </div>

        {/* Export Section */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <ReportExport analyses={analyses} threshold={threshold} />
        </div>
      </div>
    </DashboardLayout>
  );
}

export default App;