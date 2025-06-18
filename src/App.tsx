import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { ProgressBar } from './components/ProgressBar';
import { QualitySettings } from './components/QualitySettings';
import { StatsOverview } from './components/StatsOverview';
import { ImageGrid } from './components/ImageGrid';
import { QualityHistogram } from './components/QualityHistogram';
import { ReportExport } from './components/ReportExport';
import { SessionManager } from './components/SessionManager';
import { ImageAnalysis, ProcessingProgress, AnalysisStats } from './types';
import { analyzeImage } from './utils/imageAnalysis';
import { calculateQualityStatistics } from './utils/qualityAssessment';
import { AnalysisSession } from './utils/sessionManager';
import { Save } from 'lucide-react';

function App() {
  const [analyses, setAnalyses] = useState<ImageAnalysis[]>([]);
  const [progress, setProgress] = useState<ProcessingProgress>({
    current: 0,
    total: 0,
    isProcessing: false
  });
  const [threshold, setThreshold] = useState(70); // Default threshold for composite scoring
  const [showSessionManager, setShowSessionManager] = useState(false);

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

    const averageDescriptorScore = analyses.length > 0
      ? analyses.reduce((sum, a) => sum + (a.descriptorAnalysis?.photogrammetricScore || 0), 0) / analyses.length
      : 0;

    const averageKeypointCount = analyses.length > 0
      ? analyses.reduce((sum, a) => sum + (a.descriptorAnalysis?.keypointCount || 0), 0) / analyses.length
      : 0;

    return {
      ...baseStats,
      averageExposureScore,
      averageNoiseScore,
      averageDescriptorScore,
      averageKeypointCount,
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
  }, []);

  /**
   * Handles loading a saved session
   */
  const handleLoadSession = useCallback((session: AnalysisSession) => {
    setAnalyses(session.analyses);
    setThreshold(session.threshold);
    setProgress({
      current: 0,
      total: 0,
      isProcessing: false
    });
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

          {/* Quality Histogram - Compact Version */}
          {analyses.length > 0 && (
            <QualityHistogram analyses={analyses} compact={true} />
          )}

          {/* Image Grid with Comparison Features */}
          <ImageGrid analyses={analyses} threshold={threshold} />

          {/* Session Management and Export Section */}
          {analyses.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Session Management */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Save className="w-5 h-5 mr-2" />
                  Session Management
                </h3>
                <p className="text-gray-600 mb-4">
                  Save your current analysis session to continue later or share with your team.
                </p>
                <button
                  onClick={() => setShowSessionManager(true)}
                  className="w-full flex items-center justify-center px-4 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Save className="w-5 h-5 mr-2" />
                  Manage Sessions
                </button>
              </div>

              {/* Export Section */}
              <ReportExport analyses={analyses} threshold={threshold} />
            </div>
          )}
        </div>
      </main>

      {/* Session Manager Modal */}
      <SessionManager
        analyses={analyses}
        threshold={threshold}
        stats={stats}
        onLoadSession={handleLoadSession}
        isVisible={showSessionManager}
        onClose={() => setShowSessionManager(false)}
      />
    </div>
  );
}

export default App;