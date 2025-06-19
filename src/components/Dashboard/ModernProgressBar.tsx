import React from 'react';
import { ProcessingProgress, ProcessingStep } from '../../types';
import { Clock, Zap, CheckCircle, AlertTriangle, Image as ImageIcon } from 'lucide-react';

interface ModernProgressBarProps {
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

export const ModernProgressBar: React.FC<ModernProgressBarProps> = ({ progress }) => {
  if (!progress.isProcessing && progress.current === 0) return null;

  const percentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;
  const isComplete = progress.current === progress.total && !progress.isProcessing;
  
  const getETA = (): string => {
    if (progress.current === 0 || !progress.isProcessing || !progress.startTime) return '';
    
    const elapsed = Date.now() - progress.startTime;
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
    if (progress.current === 0 || !progress.isProcessing || !progress.startTime) return '';
    
    const elapsed = Date.now() - progress.startTime;
    const speed = (progress.current / (elapsed / 1000)).toFixed(1);
    return `${speed} images/sec`;
  };

  return (
    <div className="bg-gradient-to-br from-gray-800/50 to-gray-700/30 backdrop-blur-sm rounded-xl border border-gray-600/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            isComplete 
              ? 'bg-emerald-500 glow-emerald' 
              : progress.isProcessing 
              ? 'bg-blue-500 glow-blue' 
              : 'bg-gray-600'
          }`}>
            {isComplete ? (
              <CheckCircle className="w-6 h-6 text-white" />
            ) : progress.isProcessing ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-white" />
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-100">
              {isComplete 
                ? 'Analysis Complete!' 
                : progress.isProcessing 
                ? 'Processing Images' 
                : 'Processing Paused'
              }
            </h3>
            <p className="text-gray-400">
              {isComplete 
                ? `Successfully analyzed ${progress.total} images`
                : `Analyzing image ${progress.current} of ${progress.total}`
              }
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-100">
            {progress.current} / {progress.total}
          </div>
          <div className="text-sm text-gray-400">
            {percentage.toFixed(0)}% complete
          </div>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="relative mb-6">
        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ease-out relative ${
              isComplete 
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' 
                : progress.isProcessing 
                ? 'bg-gradient-to-r from-blue-500 to-cyan-400' 
                : 'bg-gradient-to-r from-amber-500 to-orange-400'
            }`}
            style={{ width: `${percentage}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
          </div>
        </div>
        
        {/* Progress indicator */}
        {progress.isProcessing && (
          <div 
            className="absolute top-0 h-full w-1 bg-white shadow-lg transition-all duration-300 rounded-full"
            style={{ left: `${percentage}%` }}
          />
        )}
      </div>
      
      {/* Status Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg">
          <Clock className="w-5 h-5 text-blue-400" />
          <div>
            <p className="text-sm text-gray-400">Time Remaining</p>
            <p className="font-medium text-gray-200">
              {isComplete 
                ? 'Completed' 
                : progress.isProcessing 
                ? getETA() 
                : 'Paused'
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg">
          <Zap className="w-5 h-5 text-cyan-400" />
          <div>
            <p className="text-sm text-gray-400">Processing Speed</p>
            <p className="font-medium text-gray-200">
              {isComplete 
                ? 'Analysis finished' 
                : progress.isProcessing 
                ? getProcessingSpeed() 
                : 'Speed: N/A'
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg">
          <div className={`w-3 h-3 rounded-full ${
            isComplete 
              ? 'bg-emerald-500' 
              : progress.isProcessing 
              ? 'bg-blue-500 animate-pulse' 
              : 'bg-amber-500'
          }`} />
          <div>
            <p className="text-sm text-gray-400">Status</p>
            <p className="font-medium text-gray-200">
              {isComplete 
                ? 'Ready for review' 
                : progress.isProcessing 
                ? getStepName(progress.currentStep || ProcessingStep.PROCESS)
                : 'Processing stopped'
              }
            </p>
          </div>
        </div>
      </div>
      
      {/* Detailed Progress for Current Image */}
      {progress.isProcessing && progress.currentImageName && (
        <div className="p-4 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-lg border border-blue-500/30">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <ImageIcon className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-200">
                  Currently Processing:
                </p>
                <p className="text-sm text-blue-300 truncate max-w-md">
                  {progress.currentImageName}
                </p>
                <p className="text-xs text-blue-400 mt-1">
                  {getStepName(progress.currentStep || ProcessingStep.PROCESS)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-blue-400">
                Step {progress.currentStep || 1} of 5
              </p>
              {progress.imageDuration && (
                <p className="text-xs text-blue-300">
                  {(progress.imageDuration / 1000).toFixed(1)}s elapsed
                </p>
              )}
            </div>
          </div>
          
          {/* Sub-progress for current image */}
          {progress.currentImageProgress && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-blue-300 mb-1">
                <span>Step Progress</span>
                <span>{progress.currentImageProgress.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-blue-800/50 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-400 to-cyan-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.currentImageProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Success Message */}
      {isComplete && (
        <div className="p-4 bg-gradient-to-r from-emerald-600/20 to-emerald-500/20 rounded-lg border border-emerald-500/30">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="text-sm font-medium text-emerald-200">
                Analysis Complete
              </p>
              <p className="text-sm text-emerald-300">
                All images have been successfully analyzed. You can now review the results and export your data.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};