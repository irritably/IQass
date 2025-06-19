import React from 'react';
import { ProcessingProgress, ProcessingStep } from '../types';
import { Clock, Zap, CheckCircle, AlertTriangle } from 'lucide-react';

interface ProgressBarProps {
  progress: ProcessingProgress;
}

const getStepName = (step: ProcessingStep): string => {
  switch (step) {
    case ProcessingStep.UPLOAD:
      return 'Uploading files';
    case ProcessingStep.EXTRACT:
      return 'Extracting metadata';
    case ProcessingStep.PROCESS:
      return 'Processing image';
    case ProcessingStep.ANALYZE:
      return 'Analyzing quality';
    case ProcessingStep.EXPORT:
      return 'Finalizing results';
    default:
      return 'Processing';
  }
};

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  if (!progress.isProcessing && progress.current === 0) return null;

  const percentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;
  const isComplete = progress.current === progress.total && !progress.isProcessing;
  
  // Calculate ETA based on processing speed
  const getETA = (): string => {
    if (progress.current === 0 || !progress.isProcessing) return '';
    
    const elapsed = Date.now() - (progress.startTime || Date.now());
    const avgTimePerImage = elapsed / progress.current;
    const remaining = progress.total - progress.current;
    const etaMs = remaining * avgTimePerImage;
    
    if (etaMs < 60000) {
      return `${Math.ceil(etaMs / 1000)}s remaining`;
    } else {
      const minutes = Math.ceil(etaMs / 60000);
      return `${minutes}m remaining`;
    }
  };

  const getProcessingSpeed = (): string => {
    if (progress.current === 0 || !progress.isProcessing) return '';
    
    const elapsed = Date.now() - (progress.startTime || Date.now());
    const speed = (progress.current / (elapsed / 1000)).toFixed(1);
    return `${speed} images/sec`;
  };

  const getCurrentStepName = (): string => {
    if (progress.currentStep) {
      return getStepName(progress.currentStep);
    }
    return progress.currentStepName || 'Processing';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isComplete 
              ? 'bg-green-100' 
              : progress.isProcessing 
              ? 'bg-blue-100' 
              : 'bg-gray-100'
          }`}>
            {isComplete ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : progress.isProcessing ? (
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-gray-600" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {isComplete 
                ? 'Analysis Complete!' 
                : progress.isProcessing 
                ? 'Processing Images' 
                : 'Processing Paused'
              }
            </h3>
            <p className="text-sm text-gray-600">
              {isComplete 
                ? `Successfully analyzed ${progress.total} images`
                : `Analyzing image ${progress.current} of ${progress.total}`
              }
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">
            {progress.current} / {progress.total}
          </div>
          <div className="text-sm text-gray-500">
            {percentage.toFixed(0)}% complete
          </div>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="relative">
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ease-out ${
              isComplete 
                ? 'bg-green-500' 
                : progress.isProcessing 
                ? 'bg-blue-500' 
                : 'bg-yellow-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        {/* Progress indicator */}
        {progress.isProcessing && (
          <div 
            className="absolute top-0 h-full w-1 bg-white shadow-lg transition-all duration-300"
            style={{ left: `${percentage}%` }}
          />
        )}
      </div>
      
      {/* Status Information */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* ETA */}
        <div className="flex items-center space-x-2 text-sm">
          <Clock className="w-4 h-4 text-gray-500" />
          <span className="text-gray-600">
            {isComplete 
              ? 'Completed' 
              : progress.isProcessing 
              ? getETA() 
              : 'Paused'
            }
          </span>
        </div>
        
        {/* Processing Speed */}
        <div className="flex items-center space-x-2 text-sm">
          <Zap className="w-4 h-4 text-gray-500" />
          <span className="text-gray-600">
            {isComplete 
              ? 'Analysis finished' 
              : progress.isProcessing 
              ? getProcessingSpeed() 
              : 'Speed: N/A'
            }
          </span>
        </div>
        
        {/* Current Status */}
        <div className="flex items-center space-x-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${
            isComplete 
              ? 'bg-green-500' 
              : progress.isProcessing 
              ? 'bg-blue-500 animate-pulse' 
              : 'bg-yellow-500'
          }`} />
          <span className="text-gray-600">
            {isComplete 
              ? 'Ready for review' 
              : progress.isProcessing 
              ? getCurrentStepName()
              : 'Processing stopped'
            }
          </span>
        </div>
      </div>
      
      {/* Detailed Progress for Current Image */}
      {progress.isProcessing && progress.currentImageName && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">
                Currently Processing:
              </p>
              <p className="text-sm text-blue-700 truncate max-w-md">
                {progress.currentImageName}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-blue-600">
                Step {progress.currentStep || 1} of 5
              </p>
              <p className="text-xs text-blue-500">
                {getCurrentStepName()}
              </p>
              {progress.imageDuration && (
                <p className="text-xs text-blue-500">
                  {progress.imageDuration.toFixed(0)}ms elapsed
                </p>
              )}
            </div>
          </div>
          
          {/* Sub-progress for current image */}
          {progress.currentImageProgress && (
            <div className="mt-2">
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.currentImageProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Success Message */}
      {isComplete && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <p className="text-sm text-green-800">
              All images have been successfully analyzed. You can now review the results and export your data.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};