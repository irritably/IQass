/**
 * Performance Indicator Component
 * 
 * Lightweight component that shows performance status during processing,
 * providing users with immediate feedback about GPU acceleration and processing speed.
 */

import React from 'react';
import { Zap, Cpu, TrendingUp, Info } from 'lucide-react';

interface PerformanceIndicatorProps {
  isProcessing: boolean;
  isGpuAccelerated: boolean;
  speedup?: number;
  processingSpeed?: number; // images per second
  onClick?: () => void;
  className?: string;
}

export const PerformanceIndicator: React.FC<PerformanceIndicatorProps> = ({
  isProcessing,
  isGpuAccelerated,
  speedup,
  processingSpeed,
  onClick,
  className = ''
}) => {
  if (!isProcessing && !speedup) return null;

  const getStatusColor = () => {
    if (!isGpuAccelerated) return 'text-gray-600 bg-gray-100';
    if (speedup && speedup > 10) return 'text-green-600 bg-green-100';
    if (speedup && speedup > 3) return 'text-blue-600 bg-blue-100';
    return 'text-yellow-600 bg-yellow-100';
  };

  const getStatusText = () => {
    if (!isGpuAccelerated) return 'CPU Processing';
    if (speedup) return `GPU: ${speedup.toFixed(1)}x faster`;
    return 'GPU Accelerated';
  };

  const getIcon = () => {
    if (!isGpuAccelerated) return <Cpu className="w-4 h-4" />;
    return <Zap className="w-4 h-4" />;
  };

  return (
    <div
      className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer hover:shadow-md ${getStatusColor()} ${className}`}
      onClick={onClick}
      title="Click to view performance details"
    >
      {getIcon()}
      <span>{getStatusText()}</span>
      
      {processingSpeed && (
        <>
          <span className="text-gray-400">•</span>
          <div className="flex items-center space-x-1">
            <TrendingUp className="w-3 h-3" />
            <span>{processingSpeed.toFixed(1)}/s</span>
          </div>
        </>
      )}
      
      {onClick && <Info className="w-3 h-3 opacity-60" />}
    </div>
  );
};

/**
 * Compact Performance Badge
 * For use in smaller UI areas
 */
interface PerformanceBadgeProps {
  isGpuAccelerated: boolean;
  speedup?: number;
  size?: 'sm' | 'md';
}

export const PerformanceBadge: React.FC<PerformanceBadgeProps> = ({
  isGpuAccelerated,
  speedup,
  size = 'sm'
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm';
  
  if (!isGpuAccelerated && !speedup) return null;

  return (
    <span className={`inline-flex items-center space-x-1 rounded-full font-medium ${sizeClasses} ${
      isGpuAccelerated ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
    }`}>
      {isGpuAccelerated ? <Zap className="w-3 h-3" /> : <Cpu className="w-3 h-3" />}
      <span>
        {isGpuAccelerated 
          ? speedup ? `${speedup.toFixed(1)}x` : 'GPU'
          : 'CPU'
        }
      </span>
    </span>
  );
};

/**
 * Performance Status Bar
 * For use in progress bars and status displays
 */
interface PerformanceStatusBarProps {
  isGpuAccelerated: boolean;
  speedup?: number;
  averageProcessingTime?: number;
  totalProcessed?: number;
}

export const PerformanceStatusBar: React.FC<PerformanceStatusBarProps> = ({
  isGpuAccelerated,
  speedup,
  averageProcessingTime,
  totalProcessed
}) => {
  return (
    <div className="flex items-center justify-between text-sm text-gray-600">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          {isGpuAccelerated ? (
            <Zap className="w-4 h-4 text-green-600" />
          ) : (
            <Cpu className="w-4 h-4 text-gray-600" />
          )}
          <span>
            {isGpuAccelerated ? 'GPU Accelerated' : 'CPU Processing'}
          </span>
        </div>
        
        {speedup && speedup > 1 && (
          <div className="flex items-center space-x-1">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span className="text-blue-600 font-medium">
              {speedup.toFixed(1)}x speedup
            </span>
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-4 text-xs">
        {averageProcessingTime && (
          <span>Avg: {averageProcessingTime.toFixed(1)}ms</span>
        )}
        {totalProcessed && (
          <span>Processed: {totalProcessed}</span>
        )}
      </div>
    </div>
  );
};