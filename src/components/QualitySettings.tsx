import React, { useMemo } from 'react';
import { Settings, Info, BarChart3, Target, Lightbulb } from 'lucide-react';
import { ImageAnalysis } from '../types';

interface QualitySettingsProps {
  threshold: number;
  onThresholdChange: (threshold: number) => void;
  analyses?: ImageAnalysis[]; // Optional for live visualization
}

export const QualitySettings: React.FC<QualitySettingsProps> = ({ 
  threshold, 
  onThresholdChange,
  analyses = []
}) => {
  // Calculate live statistics based on current threshold
  const thresholdStats = useMemo(() => {
    if (analyses.length === 0) {
      return { recommended: 0, notRecommended: 0, percentage: 0 };
    }

    const recommended = analyses.filter(a => (a.compositeScore?.overall || 0) >= threshold).length;
    const notRecommended = analyses.length - recommended;
    const percentage = (recommended / analyses.length) * 100;

    return { recommended, notRecommended, percentage };
  }, [analyses, threshold]);

  // Generate histogram data for threshold visualization
  const histogramData = useMemo(() => {
    if (analyses.length === 0) return [];

    const bins = Array(10).fill(0);
    analyses.forEach(analysis => {
      const score = analysis.compositeScore?.overall || 0;
      const binIndex = Math.min(Math.floor(score / 10), 9);
      bins[binIndex]++;
    });

    return bins.map((count, index) => ({
      range: `${index * 10}-${(index + 1) * 10}`,
      count,
      isAboveThreshold: (index + 1) * 10 > threshold,
      percentage: analyses.length > 0 ? (count / analyses.length) * 100 : 0
    }));
  }, [analyses, threshold]);

  const maxCount = Math.max(...histogramData.map(d => d.count), 1);

  // Preset configurations for different project types
  const presets = [
    { 
      name: 'General Mapping', 
      value: 40, 
      description: 'Basic aerial mapping and surveying',
      icon: '🗺️',
      color: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
    },
    { 
      name: 'Standard Photogrammetry', 
      value: 60, 
      description: 'Standard 3D reconstruction projects',
      icon: '📐',
      color: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
    },
    { 
      name: 'High-Precision Work', 
      value: 75, 
      description: 'Engineering and precision mapping',
      icon: '🎯',
      color: 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100'
    },
    { 
      name: 'Research Quality', 
      value: 85, 
      description: 'Academic and research applications',
      icon: '🔬',
      color: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
    }
  ];

  const getThresholdColor = (value: number) => {
    if (value >= 80) return 'from-green-500 to-emerald-500';
    if (value >= 60) return 'from-blue-500 to-cyan-500';
    if (value >= 40) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  const getPassRateColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Settings className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Quality Threshold Settings</h3>
          <p className="text-sm text-gray-600 mt-1">Configure quality requirements for your project</p>
        </div>
      </div>
      
      <div className="space-y-8">
        {/* Enhanced Threshold Slider with Live Feedback */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="block text-base font-semibold text-gray-700">
              Minimum Quality Score for Reconstruction
            </label>
            <div className={`text-2xl font-bold px-4 py-2 rounded-lg bg-gradient-to-r ${getThresholdColor(threshold)} text-white shadow-md`}>
              {threshold}
            </div>
          </div>
          
          <div className="relative">
            <input
              type="range"
              min="0"
              max="100"
              value={threshold}
              onChange={(e) => onThresholdChange(Number(e.target.value))}
              className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                background: `linear-gradient(to right, 
                  #ef4444 0%, 
                  #f59e0b ${threshold * 0.4}%, 
                  #10b981 ${threshold}%, 
                  #e5e7eb ${threshold}%, 
                  #e5e7eb 100%)`
              }}
            />
            <div className="flex justify-between text-sm text-gray-500 mt-2">
              <span className="font-medium">0 (Very Poor)</span>
              <span className="font-medium">50 (Acceptable)</span>
              <span className="font-medium">100 (Excellent)</span>
            </div>
          </div>
        </div>

        {/* Enhanced Live Statistics Display */}
        {analyses.length > 0 && (
          <div className="grid grid-cols-3 gap-6 p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {thresholdStats.recommended}
              </div>
              <div className="text-sm font-medium text-gray-700">Recommended</div>
              <div className="text-xs text-gray-500 mt-1">
                {analyses.length > 0 ? ((thresholdStats.recommended / analyses.length) * 100).toFixed(1) : 0}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 mb-1">
                {thresholdStats.notRecommended}
              </div>
              <div className="text-sm font-medium text-gray-700">Not Recommended</div>
              <div className="text-xs text-gray-500 mt-1">
                {analyses.length > 0 ? ((thresholdStats.notRecommended / analyses.length) * 100).toFixed(1) : 0}%
              </div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold mb-1 ${getPassRateColor(thresholdStats.percentage)}`}>
                {thresholdStats.percentage.toFixed(1)}%
              </div>
              <div className="text-sm font-medium text-gray-700">Pass Rate</div>
              <div className="text-xs text-gray-500 mt-1">
                Quality threshold: {threshold}
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Interactive Histogram */}
        {analyses.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-gray-600" />
                <h4 className="text-lg font-semibold text-gray-900">Quality Distribution</h4>
              </div>
              <div className="text-sm text-gray-500">
                {analyses.length} images analyzed
              </div>
            </div>
            
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              {histogramData.map((data, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="w-16 text-sm font-medium text-gray-700 text-right">
                    {data.range}
                  </div>
                  <div className="flex-1 relative">
                    <div className="w-full bg-gray-200 rounded-full h-6 relative overflow-hidden">
                      <div
                        className={`h-6 rounded-full transition-all duration-500 ${
                          data.isAboveThreshold 
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                            : 'bg-gradient-to-r from-red-400 to-red-500'
                        }`}
                        style={{ width: `${(data.count / maxCount) * 100}%` }}
                      />
                      {data.count > 0 && (
                        <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white">
                          {data.count}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="w-12 text-sm text-gray-600 text-right font-medium">
                    {data.percentage.toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enhanced Preset Configurations */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-gray-600" />
            <h4 className="text-lg font-semibold text-gray-900">Quick Presets</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {presets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => onThresholdChange(preset.value)}
                className={`p-4 text-left border-2 rounded-xl transition-all duration-200 ${
                  threshold === preset.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md ring-2 ring-blue-200'
                    : `border-gray-200 ${preset.color} shadow-sm hover:shadow-md`
                }`}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-2xl">{preset.icon}</span>
                  <div className="font-semibold text-base">{preset.name}</div>
                </div>
                <div className="text-sm opacity-90 mb-2">{preset.description}</div>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">Threshold: {preset.value}</div>
                  {threshold === preset.value && (
                    <div className="text-blue-600">
                      <Target className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Enhanced Help Information */}
        <div className="flex items-start space-x-3 text-sm text-blue-700 bg-blue-50 p-4 rounded-xl border border-blue-200">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Lightbulb className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold mb-3">Threshold Guidelines:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <ul className="space-y-2">
                  <li className="flex items-start space-x-2">
                    <span className="font-semibold text-blue-800">40-50:</span>
                    <span>General mapping and basic surveying</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="font-semibold text-blue-800">60-70:</span>
                    <span>Standard photogrammetric reconstruction</span>
                  </li>
                </ul>
              </div>
              <div>
                <ul className="space-y-2">
                  <li className="flex items-start space-x-2">
                    <span className="font-semibold text-blue-800">75+:</span>
                    <span>High-precision engineering and research work</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="font-semibold text-blue-800">Note:</span>
                    <span>Higher thresholds ensure better quality but may reduce usable images</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};