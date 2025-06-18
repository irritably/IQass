import React, { useState } from 'react';
import { FileUpload } from '../components/FileUpload';
import { ProgressBar } from '../components/ProgressBar';
import { QualitySettings } from '../components/QualitySettings';
import { PerformanceDashboard } from '../components/PerformanceDashboard';
import { ImageAnalysis, ProcessingProgress } from '../types';
import { Upload, Settings, Zap, Info } from 'lucide-react';

interface UploadAnalyzeViewProps {
  onFilesSelected: (files: File[]) => void;
  progress: ProcessingProgress;
  threshold: number;
  onThresholdChange: (threshold: number) => void;
  analyses: ImageAnalysis[];
  isProcessing: boolean;
}

export const UploadAnalyzeView: React.FC<UploadAnalyzeViewProps> = ({
  onFilesSelected,
  progress,
  threshold,
  onThresholdChange,
  analyses,
  isProcessing
}) => {
  const [showPerformanceDashboard, setShowPerformanceDashboard] = useState(false);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* View Header */}
        <div className="text-center">
          <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4">
            <Upload className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Upload & Analyze</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload your drone images and configure analysis settings for comprehensive quality assessment
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Upload className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Image Upload</h3>
          </div>
          <FileUpload 
            onFilesSelected={onFilesSelected}
            isProcessing={isProcessing}
          />
        </div>

        {/* Progress Section */}
        {(progress.isProcessing || progress.current > 0) && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Zap className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Processing Progress</h3>
              </div>
              <button
                onClick={() => setShowPerformanceDashboard(true)}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Zap className="w-4 h-4 mr-1" />
                Performance
              </button>
            </div>
            <ProgressBar 
              progress={progress} 
              onOpenPerformanceDashboard={() => setShowPerformanceDashboard(true)}
            />
          </div>
        )}

        {/* Quality Settings Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Settings className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Quality Settings</h3>
            {analyses.length > 0 && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                Live Preview
              </span>
            )}
          </div>
          <QualitySettings 
            threshold={threshold}
            onThresholdChange={onThresholdChange}
            analyses={analyses}
          />
        </div>

        {/* Help and Tips */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-900 mb-2">Getting Started Tips</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                <div>
                  <h5 className="font-medium mb-1">File Upload</h5>
                  <ul className="space-y-1">
                    <li>• Drag and drop multiple files for batch processing</li>
                    <li>• Add custom tags to organize your images</li>
                    <li>• Supported formats: JPG, PNG, TIFF (max 50MB)</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium mb-1">Performance Features</h5>
                  <ul className="space-y-1">
                    <li>• GPU acceleration provides 10-30x speedup</li>
                    <li>• Click performance indicators for detailed insights</li>
                    <li>• System automatically optimizes for your hardware</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Dashboard Modal */}
      <PerformanceDashboard
        isVisible={showPerformanceDashboard}
        onClose={() => setShowPerformanceDashboard(false)}
      />
    </div>
  );
};