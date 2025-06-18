import React, { useState, useCallback } from 'react';
import { Navigation } from './components/Navigation';
import { UploadAnalyzeView } from './views/UploadAnalyzeView';
import { DashboardView } from './views/DashboardView';
import { AnalysisResultsView } from './views/AnalysisResultsView';
import { ViewType } from './types';
import { useImageAnalysisManager } from './hooks/useImageAnalysisManager';

function App() {
  // Navigation state
  const [currentView, setCurrentView] = useState<ViewType>('upload');

  // Use the image analysis manager hook
  const {
    analyses,
    progress,
    threshold,
    stats,
    handleFilesSelected,
    handleThresholdChange,
    isProcessing,
    hasAnalyses
  } = useImageAnalysisManager();

  /**
   * Handles view navigation with smart defaults
   */
  const handleViewChange = useCallback((view: ViewType) => {
    setCurrentView(view);
  }, []);

  // Auto-navigate to dashboard after processing completes
  React.useEffect(() => {
    if (!isProcessing && hasAnalyses && currentView === 'upload') {
      const timer = setTimeout(() => setCurrentView('dashboard'), 1000);
      return () => clearTimeout(timer);
    }
  }, [isProcessing, hasAnalyses, currentView]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <Navigation 
        currentView={currentView}
        onViewChange={handleViewChange}
        analysisCount={analyses.length}
        isProcessing={isProcessing}
      />
      
      {/* Main Content */}
      <main>
        {currentView === 'upload' && (
          <UploadAnalyzeView
            onFilesSelected={handleFilesSelected}
            progress={progress}
            threshold={threshold}
            onThresholdChange={handleThresholdChange}
            analyses={analyses}
            isProcessing={isProcessing}
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