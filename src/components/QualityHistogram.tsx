import React from 'react';
import { ImageAnalysis } from '../types';
import { BarChart3, TrendingUp } from 'lucide-react';

interface QualityHistogramProps {
  analyses: ImageAnalysis[];
}

export const QualityHistogram: React.FC<QualityHistogramProps> = ({ analyses }) => {
  if (analyses.length === 0) return null;

  const scoreRanges = [
    { label: '90-100', min: 90, max: 100, color: 'bg-emerald-500', name: 'Excellent' },
    { label: '80-89', min: 80, max: 89, color: 'bg-emerald-400', name: 'Very Good' },
    { label: '70-79', min: 70, max: 79, color: 'bg-blue-500', name: 'Good' },
    { label: '60-69', min: 60, max: 69, color: 'bg-blue-400', name: 'Acceptable' },
    { label: '50-59', min: 50, max: 59, color: 'bg-amber-500', name: 'Fair' },
    { label: '40-49', min: 40, max: 49, color: 'bg-amber-400', name: 'Poor' },
    { label: '30-39', min: 30, max: 39, color: 'bg-orange-500', name: 'Very Poor' },
    { label: '20-29', min: 20, max: 29, color: 'bg-red-500', name: 'Unsuitable' },
    { label: '10-19', min: 10, max: 19, color: 'bg-red-400', name: 'Very Bad' },
    { label: '0-9', min: 0, max: 9, color: 'bg-red-600', name: 'Failed' }
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
    <div className="bg-gradient-to-br from-gray-800/50 to-gray-700/30 backdrop-blur-sm rounded-xl border border-gray-600/50 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-100">Quality Score Distribution</h3>
          <p className="text-sm text-gray-400">Breakdown of image quality across score ranges</p>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {histogramData.map((data, index) => (
          <div key={index} className="group">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-3">
                <div className="w-12 text-sm font-medium text-gray-300 text-right">
                  {data.label}
                </div>
                <div className="text-xs text-gray-500">{data.name}</div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-300 font-medium">{data.count}</span>
                <span className="text-xs text-gray-500">({data.percentage.toFixed(0)}%)</span>
              </div>
            </div>
            <div className="relative">
              <div className="w-full bg-gray-700/50 rounded-full h-8 relative overflow-hidden">
                <div
                  className={`h-full ${data.color} transition-all duration-700 ease-out relative group-hover:brightness-110`}
                  style={{ 
                    width: `${maxCount > 0 ? (data.count / maxCount) * 100 : 0}%`,
                    transitionDelay: `${index * 50}ms`
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                {data.count > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white drop-shadow-lg">
                    {data.count}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-600/50">
        <div className="text-center p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-emerald-400 font-medium">EXCELLENT/GOOD</span>
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {analyses.filter(a => (a.compositeScore?.overall || 0) >= 80).length}
          </div>
          <div className="text-xs text-emerald-300">High Quality</div>
        </div>
        
        <div className="text-center p-4 bg-amber-500/10 rounded-lg border border-amber-500/30">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <BarChart3 className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-amber-400 font-medium">ACCEPTABLE</span>
          </div>
          <div className="text-2xl font-bold text-amber-400">
            {analyses.filter(a => {
              const score = a.compositeScore?.overall || 0;
              return score >= 50 && score < 80;
            }).length}
          </div>
          <div className="text-xs text-amber-300">Moderate Quality</div>
        </div>
        
        <div className="text-center p-4 bg-red-500/10 rounded-lg border border-red-500/30">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <TrendingUp className="w-4 h-4 text-red-400 rotate-180" />
            <span className="text-xs text-red-400 font-medium">POOR/UNSUITABLE</span>
          </div>
          <div className="text-2xl font-bold text-red-400">
            {analyses.filter(a => (a.compositeScore?.overall || 0) < 50).length}
          </div>
          <div className="text-xs text-red-300">Low Quality</div>
        </div>
        
        <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-blue-400 font-medium">AVERAGE</span>
          </div>
          <div className="text-2xl font-bold text-blue-400">
            {analyses.length > 0 ? (analyses.reduce((sum, a) => sum + (a.compositeScore?.overall || 0), 0) / analyses.length).toFixed(1) : '0'}
          </div>
          <div className="text-xs text-blue-300">Overall Score</div>
        </div>
      </div>
    </div>
  );
};