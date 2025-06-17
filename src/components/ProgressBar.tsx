import React from 'react';
import { ProcessingProgress } from '../types';

interface ProgressBarProps {
  progress: ProcessingProgress;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
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
      
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <p className="text-sm text-gray-600 mt-2">
        Analyzing blur metrics using Laplacian variance detection...
      </p>
    </div>
  );
};