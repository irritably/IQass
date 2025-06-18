import React, { useState, useCallback } from 'react';
import { CompactUpload } from './components/CompactUpload';
import { QualitySidebar } from './components/QualitySidebar';
import { WorkspaceArea } from './components/WorkspaceArea';
import { FloatingResultCard } from './components/FloatingResultCard';
import { SessionManager } from './components/SessionManager';
import { ImageAnalysis, ProcessingProgress, AnalysisStats } from './types';
import { analyzeImage } from './utils/imageAnalysis';
import { calculateQualityStatistics } from './utils/qualityAssessment';
import { AnalysisSession } from './utils/sessionManager';
import { Camera, Zap, Activity } from 'lucide-react';

function App() {
  const [analyses, setAnalyses] = useState<ImageAnalysis[]>([]);
  const [progress, setProgress] = useState<ProcessingProgress>({
    current: 0,
    total: 0,
    isProcessing: false
  });
  const [threshold, setThreshold] = useState(70);
  const [showSessionManager, setShowSessionManager] = useState(false);
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());

  /**
   * Calculates comprehensive statistics for all analyzed images
   */
  const calculateStats = useCallback((analyses: ImageAnalysis[]): AnalysisStats => {
    const baseStats = calculateQualityStatistics(analyses, threshold);
    
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
      
      setProgress(prev => ({
        ...prev,
        current: i,
        currentImageName: file.name,
        currentStep: 1,
        currentStepName: 'Analyzing...',
        currentImageProgress: 0
      }));

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
        current: i + 1,
        currentImageProgress: 100
      }));

      setAnalyses(prev => [...prev, ...newAnalyses.slice(i, i + 1)]);
    }

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Futuristic Header */}
      <header className="relative bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & Title */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Camera className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Drone Quality AI
                </h1>
                <p className="text-sm text-gray-500 font-medium">Real-time photogrammetric analysis</p>
              </div>
            </div>

            {/* Status Indicators */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-100 rounded-full">
                <Activity className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  {analyses.length} analyzed
                </span>
              </div>
              
              {progress.isProcessing && (
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-blue-100 rounded-full">
                  <Zap className="w-4 h-4 text-blue-600 animate-pulse" />
                  <span className="text-sm font-medium text-blue-700">
                    Processing...
                  </span>
                </div>
              )}

              {/* Compact Upload in Top Right */}
              <CompactUpload 
                onFilesSelected={handleFilesSelected}
                isProcessing={progress.isProcessing}
                progress={progress}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Quality Control Sidebar */}
        <QualitySidebar
          threshold={threshold}
          onThresholdChange={setThreshold}
          analyses={analyses}
          stats={stats}
          onOpenSessionManager={() => setShowSessionManager(true)}
        />

        {/* Main Workspace */}
        <main className="flex-1 overflow-hidden">
          <WorkspaceArea
            analyses={analyses}
            threshold={threshold}
            selectedCards={selectedCards}
            onCardSelect={setSelectedCards}
            progress={progress}
          />
        </main>
      </div>

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