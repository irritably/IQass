import React, { useMemo } from 'react';
import { Settings, Info, BarChart3 } from 'lucide-react';
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
      isAboveThreshold: (index + 1) * 10 > threshold
    }));
  }, [analyses, threshold]);

  const maxCount = Math.max(...histogramData.map(d => d.count), 1);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Settings className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Quality Threshold Settings</h3>
      </div>
      
      <div className="space-y-6">
        {/* Threshold Slider with Live Feedback */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Minimum Quality Score for Use
            </label>
            <div className="text-sm font-medium text-blue-600">
              {threshold}
            </div>
          </div>
          
          <input
            type="range"
            min="0"
            max="100"
            value={threshold}
            onChange={(e) => onThresholdChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #ef4444 0%, #f59e0b ${threshold}%, #10b981 ${threshold}%, #10b981 100%)`
            }}
          />
          
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0 (Very Poor)</span>
            <span>50 (Acceptable)</span>
            <span>100 (Excellent)</span>
          </div>
        </div>

        {/* Live Statistics Display */}
        {analyses.length > 0 && (
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {thresholdStats.recommended}
              </div>
              <div className="text-sm text-gray-600">Recommended</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {thresholdStats.notRecommended}
              </div>
              <div className="text-sm text-gray-600">Not Recommended</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {thresholdStats.percentage.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Pass Rate</div>
            </div>
          </div>
        )}

        {/* Interactive Histogram */}
        {analyses.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-gray-600" />
              <h4 className="text-sm font-medium text-gray-900">Quality Distribution</h4>
            </div>
            
            <div className="space-y-2">
              {histogramData.map((data, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-12 text-xs font-medium text-gray-600 text-right">
                    {data.range}
                  </div>
                  <div className="flex-1 relative">
                    <div className="w-full bg-gray-100 rounded-full h-4 relative overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          data.isAboveThreshold 
                            ? 'bg-green-500' 
                            : 'bg-red-400'
                        }`}
                        style={{ width: `${(data.count / maxCount) * 100}%` }}
                      />
                      {data.count > 0 && (
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                          {data.count}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="w-8 text-xs text-gray-500 text-right">
                    {data.count > 0 ? ((data.count / analyses.length) * 100).toFixed(0) + '%' : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Help Information */}
        <div className="flex items-start space-x-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium mb-1">Threshold Guidelines:</p>
            <ul className="space-y-1 text-sm">
              <li>• <strong>40-50:</strong> General use and basic applications</li>
              <li>• <strong>60-70:</strong> Professional work requiring good quality</li>
              <li>• <strong>75+:</strong> High-precision applications and critical work</li>
              <li>• Higher thresholds ensure better quality but may reduce usable images</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};