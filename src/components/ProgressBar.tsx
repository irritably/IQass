import React from 'react';
import { ProcessingProgress, ProcessingStep } from '../types';
import { Clock, Zap, CheckCircle, AlertTriangle, Image as ImageIcon, Activity } from 'lucide-react';

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

const getStepDescription = (step: ProcessingStep): string => {
  switch (step) {
    case ProcessingStep.UPLOAD:
      return 'Validating and preparing files';
    case ProcessingStep.EXTRACT:
      return 'Reading EXIF data and camera settings';
    case ProcessingStep.PROCESS:
      return 'Loading and preparing image data';
    case ProcessingStep.ANALYZE:
      return 'Running blur, exposure, noise, and feature analysis';
    case ProcessingStep.EXPORT:
      return 'Calculating composite scores and recommendations';
    default:
      return 'Processing image data';
  }
};

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
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

  const getCurrentStepName = (): string => {
    if (progress.currentStep) {
      return getStepName(progress.currentStep);
    }
    return progress.currentStepName || 'Processing';
  };

  const getCurrentStepDescription = (): string => {
    if (progress.currentStep) {
      return getStepDescription(progress.currentStep);
    }
    return 'Analyzing image quality metrics';
  };

  return (
    <div className="card animate-fade-in-up">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 ${
              isComplete 
                ? 'bg-gradient-to-br from-emerald-500 to-green-500 glow-emerald' 
                : progress.isProcessing 
                ? 'bg-gradient-to-br from-blue-500 to-cyan-500 glow-blue' 
                : 'bg-gradient-to-br from-gray-600 to-gray-500'
            }`}>
              {isComplete ? (
                <CheckCircle className="w-7 h-7 text-white" />
              ) : progress.isProcessing ? (
                <div className="w-7 h-7 border-3 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <AlertTriangle className="w-7 h-7 text-white" />
              )}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-100">
                {isComplete 
                  ? 'Analysis Complete!' 
                  : progress.isProcessing 
                  ? 'Processing Images' 
                  : 'Processing Paused'
                }
              </h3>
              <p className="text-slate-400 mt-1">
                {isComplete 
                  ? `Successfully analyzed ${progress.total} images`
                  : `Analyzing image ${progress.current} of ${progress.total}`
                }
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-4xl font-bold text-slate-100">
              {progress.current} / {progress.total}
            </div>
            <div className="text-sm text-slate-400 mt-1">
              {percentage.toFixed(0)}% complete
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="relative mb-6">
          <div className="progress-bar h-4">
            <div
              className={`progress-fill ${
                isComplete 
                  ? 'bg-gradient-to-r from-emerald-500 to-green-400' 
                  : progress.isProcessing 
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-400' 
                  : 'bg-gradient-to-r from-amber-500 to-orange-400'
              }`}
              style={{ width: `${percentage}%` }}
            />
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="flex items-center space-x-3 p-4 bg-slate-700/30 rounded-xl border border-slate-600/50">
            <Clock className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-sm font-medium text-slate-300">Time Remaining</p>
              <p className="text-lg font-semibold text-slate-100">
                {isComplete 
                  ? 'Completed' 
                  : progress.isProcessing 
                  ? getETA() 
                  : 'Paused'
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-4 bg-slate-700/30 rounded-xl border border-slate-600/50">
            <Zap className="w-5 h-5 text-cyan-400" />
            <div>
              <p className="text-sm font-medium text-slate-300">Processing Speed</p>
              <p className="text-lg font-semibold text-slate-100">
                {isComplete 
                  ? 'Analysis finished' 
                  : progress.isProcessing 
                  ? getProcessingSpeed() 
                  : 'Speed: N/A'
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-4 bg-slate-700/30 rounded-xl border border-slate-600/50">
            <div className={`w-3 h-3 rounded-full ${
              isComplete 
                ? 'bg-emerald-500' 
                : progress.isProcessing 
                ? 'bg-blue-500 animate-pulse' 
                : 'bg-amber-500'
            }`} />
            <div>
              <p className="text-sm font-medium text-slate-300">Status</p>
              <p className="text-lg font-semibold text-slate-100">
                {isComplete 
                  ? 'Ready for review' 
                  : progress.isProcessing 
                  ? getCurrentStepName()
                  : 'Processing stopped'
                }
              </p>
            </div>
          </div>
        </div>
        
        {/* Detailed Progress for Current Image */}
        {progress.isProcessing && progress.currentImageName && (
          <div className="p-4 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-xl border border-blue-500/30 animate-fade-in-up">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <ImageIcon className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-200">
                    Currently Processing:
                  </p>
                  <p className="text-sm text-blue-300 truncate max-w-md font-medium">
                    {progress.currentImageName}
                  </p>
                  <p className="text-xs text-blue-400 mt-1">
                    {getCurrentStepDescription()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-blue-400 font-medium">
                  Step {progress.currentStep || 1} of 5
                </p>
                <p className="text-xs text-blue-300">
                  {getCurrentStepName()}
                </p>
                {progress.imageDuration && (
                  <p className="text-xs text-blue-300 mt-1">
                    {(progress.imageDuration / 1000).toFixed(1)}s elapsed
                  </p>
                )}
              </div>
            </div>
            
            {/* Sub-progress for current image */}
            {progress.currentImageProgress && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-blue-300 mb-2">
                  <span className="font-medium">Step Progress</span>
                  <span className="font-semibold">{progress.currentImageProgress.toFixed(0)}%</span>
                </div>
                <div className="progress-bar h-2">
                  <div
                    className="progress-fill bg-gradient-to-r from-blue-400 to-cyan-400"
                    style={{ width: `${progress.currentImageProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Success Message */}
        {isComplete && (
          <div className="p-4 bg-gradient-to-r from-emerald-600/20 to-green-600/20 rounded-xl border border-emerald-500/30 animate-fade-in-up">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-sm font-semibold text-emerald-200">
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
    </div>
  );
};