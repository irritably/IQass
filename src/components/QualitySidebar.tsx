import React, { useState } from 'react';
import { Settings, BarChart3, Save, Download, ChevronLeft, ChevronRight, Target, Zap, Activity } from 'lucide-react';
import { ImageAnalysis, AnalysisStats } from '../types';

interface QualitySidebarProps {
  threshold: number;
  onThresholdChange: (threshold: number) => void;
  analyses: ImageAnalysis[];
  stats: AnalysisStats;
  onOpenSessionManager: () => void;
}

export const QualitySidebar: React.FC<QualitySidebarProps> = ({
  threshold,
  onThresholdChange,
  analyses,
  stats,
  onOpenSessionManager
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Calculate live statistics
  const recommendedCount = analyses.filter(a => (a.compositeScore?.overall || 0) >= threshold).length;
  const passRate = analyses.length > 0 ? (recommendedCount / analyses.length) * 100 : 0;

  // Quick presets
  const presets = [
    { name: 'General', value: 40, color: 'bg-green-500' },
    { name: 'Standard', value: 60, color: 'bg-blue-500' },
    { name: 'Precision', value: 75, color: 'bg-purple-500' },
    { name: 'Research', value: 85, color: 'bg-red-500' }
  ];

  if (isCollapsed) {
    return (
      <div className="w-16 bg-white/80 backdrop-blur-xl border-r border-white/20 shadow-lg flex flex-col items-center py-6 space-y-4">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
        
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
          <Settings className="w-5 h-5 text-white" />
        </div>

        {analyses.length > 0 && (
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">{threshold}</div>
            <div className="text-xs text-gray-500">Threshold</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-80 bg-white/80 backdrop-blur-xl border-r border-white/20 shadow-lg flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Quality Control</h2>
              <p className="text-sm text-gray-500">Real-time analysis</p>
            </div>
          </div>
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Live Stats */}
        {analyses.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 border border-green-200/50">
              <div className="text-2xl font-bold text-green-600">{recommendedCount}</div>
              <div className="text-xs text-green-700 font-medium">Recommended</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 border border-blue-200/50">
              <div className="text-2xl font-bold text-blue-600">{passRate.toFixed(0)}%</div>
              <div className="text-xs text-blue-700 font-medium">Pass Rate</div>
            </div>
          </div>
        )}
      </div>

      {/* Threshold Control */}
      <div className="p-6 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-gray-700">Quality Threshold</label>
            <div className="px-3 py-1 bg-blue-100 rounded-full">
              <span className="text-sm font-bold text-blue-700">{threshold}</span>
            </div>
          </div>
          
          {/* Futuristic Slider */}
          <div className="relative">
            <input
              type="range"
              min="0"
              max="100"
              value={threshold}
              onChange={(e) => onThresholdChange(Number(e.target.value))}
              className="w-full h-3 bg-gradient-to-r from-red-200 via-yellow-200 to-green-200 rounded-full appearance-none cursor-pointer slider-thumb"
            />
            <div 
              className="absolute top-0 h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full pointer-events-none transition-all duration-200"
              style={{ width: `${threshold}%` }}
            />
          </div>
          
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Poor</span>
            <span>Good</span>
            <span>Excellent</span>
          </div>
        </div>

        {/* Quick Presets */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Presets</h3>
          <div className="grid grid-cols-2 gap-2">
            {presets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => onThresholdChange(preset.value)}
                className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                  threshold === preset.value
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className={`w-3 h-3 ${preset.color} rounded-full mx-auto mb-1`} />
                <div className="text-xs font-medium text-gray-700">{preset.name}</div>
                <div className="text-xs text-gray-500">{preset.value}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Live Histogram */}
        {analyses.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              Quality Distribution
            </h3>
            <QualityHistogram analyses={analyses} threshold={threshold} />
          </div>
        )}

        {/* Performance Metrics */}
        {analyses.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <Activity className="w-4 h-4 mr-2" />
              Performance
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Avg Score:</span>
                <span className="font-medium">{stats.averageCompositeScore?.toFixed(1) || '0'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Features:</span>
                <span className="font-medium">{Math.round(stats.averageKeypointCount || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Processing:</span>
                <span className="font-medium text-green-600 flex items-center">
                  <Zap className="w-3 h-3 mr-1" />
                  GPU
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-auto p-6 border-t border-gray-200/50 space-y-3">
        <button
          onClick={onOpenSessionManager}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <Save className="w-4 h-4" />
          <span>Sessions</span>
        </button>
        
        {analyses.length > 0 && (
          <button className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        )}
      </div>
    </div>
  );
};

// Mini histogram component
const QualityHistogram: React.FC<{ analyses: ImageAnalysis[]; threshold: number }> = ({ analyses, threshold }) => {
  const bins = Array(5).fill(0);
  
  analyses.forEach(analysis => {
    const score = analysis.compositeScore?.overall || 0;
    const binIndex = Math.min(Math.floor(score / 20), 4);
    bins[binIndex]++;
  });

  const maxCount = Math.max(...bins, 1);

  return (
    <div className="space-y-2">
      {bins.map((count, index) => {
        const rangeStart = index * 20;
        const rangeEnd = (index + 1) * 20;
        const isAboveThreshold = rangeEnd > threshold;
        
        return (
          <div key={index} className="flex items-center space-x-2">
            <div className="w-8 text-xs text-gray-500">{rangeStart}-{rangeEnd}</div>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isAboveThreshold ? 'bg-green-400' : 'bg-red-400'
                }`}
                style={{ width: `${(count / maxCount) * 100}%` }}
              />
            </div>
            <div className="w-6 text-xs text-gray-500">{count}</div>
          </div>
        );
      })}
    </div>
  );
};