import React from 'react';
import { ProcessingProgress } from '../types';

interface ProgressBarProps {
  progress: ProcessingProgress;
  currentStage?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, currentStage }) => {
  if (!progress.isProcessing) return null;

  const percentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">Processing Images</h3>
        <span className="text-sm text-gray-600">
          {progress.current} of {progress.total}
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
        <div
          className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">
          {currentStage || 'Analyzing image quality using advanced computer vision algorithms...'}
        </span>
        <span className="font-medium text-blue-600">
          {Math.round(percentage)}%
        </span>
      </div>
      
      {progress.current > 0 && (
        <div className="mt-2 text-xs text-gray-500">
          Using Web Workers for optimal performance
        </div>
      )}
    </div>
  );
};