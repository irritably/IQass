import React from 'react';
import { ImageAnalysis } from '../types';
import { BarChart3 } from 'lucide-react';

interface QualityHistogramProps {
  analyses: ImageAnalysis[];
}

export const QualityHistogram: React.FC<QualityHistogramProps> = ({ analyses }) => {
  if (analyses.length === 0) return null;

  // Calculate histogram data for composite scores
  const scoreRanges = [
    { label: '90-100', min: 90, max: 100, color: 'bg-green-500' },
    { label: '80-89', min: 80, max: 89, color: 'bg-green-400' },
    { label: '70-79', min: 70, max: 79, color: 'bg-blue-500' },
    { label: '60-69', min: 60, max: 69, color: 'bg-blue-400' },
    { label: '50-59', min: 50, max: 59, color: 'bg-yellow-500' },
    { label: '40-49', min: 40, max: 49, color: 'bg-yellow-400' },
    { label: '30-39', min: 30, max: 39, color: 'bg-orange-500' },
    { label: '20-29', min: 20, max: 29, color: 'bg-red-500' },
    { label: '10-19', min: 10, max: 19, color: 'bg-red-400' },
    { label: '0-9', min: 0, max: 9, color: 'bg-red-600' }
  ];

  const histogramData = scoreRanges.map(range => {
    const count = analyses.filter(analysis => {
      const score = analysis.compositeScore?.overall || 0;
      return score >= range.min && score <= range.max;
    }).length;
    
    return {
      ...range,
      count,
      percentage: analyses.length > 0 ? (count / analyses.length) * 100 : 0
    };
  });

  const maxCount = Math.max(...histogramData.map(d => d.count));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <BarChart3 className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Quality Score Distribution</h3>
      </div>

      <div className="space-y-3">
        {histogramData.map((data, index) => (
          <div key={index} className="flex items-center space-x-3">
            <div className="w-12 text-sm font-medium text-gray-600 text-right">
              {data.label}
            </div>
            <div className="flex-1 relative">
              <div className="w-full bg-gray-100 rounded-full h-6 relative overflow-hidden">
                <div
                  className={`h-full ${data.color} transition-all duration-500 ease-out`}
                  style={{ width: `${maxCount > 0 ? (data.count / maxCount) * 100 : 0}%` }}
                />
                {data.count > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                    {data.count}
                  </div>
                )}
              </div>
            </div>
            <div className="w-12 text-sm text-gray-500 text-right">
              {data.percentage.toFixed(0)}%
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {analyses.filter(a => (a.compositeScore?.overall || 0) >= 80).length}
            </div>
            <div className="text-gray-600">Excellent/Good</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-yellow-600">
              {analyses.filter(a => {
                const score = a.compositeScore?.overall || 0;
                return score >= 50 && score < 80;
              }).length}
            </div>
            <div className="text-gray-600">Acceptable</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-red-600">
              {analyses.filter(a => (a.compositeScore?.overall || 0) < 50).length}
            </div>
            <div className="text-gray-600">Poor/Unsuitable</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {analyses.length > 0 ? (analyses.reduce((sum, a) => sum + (a.compositeScore?.overall || 0), 0) / analyses.length).toFixed(1) : '0'}
            </div>
            <div className="text-gray-600">Average Score</div>
          </div>
        </div>
      </div>
    </div>
  );
};