import React from 'react';
import { AnalysisStats } from '../types';
import { CheckCircle, AlertTriangle, XCircle, TrendingUp, Camera, Zap, Target, Grid, BarChart3 } from 'lucide-react';

interface StatsOverviewProps {
  stats: AnalysisStats;
  threshold: number;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ stats, threshold }) => {
  const qualityPercentage = stats.totalImages > 0 
    ? (stats.recommendedForReconstruction / stats.totalImages) * 100 
    : 0;

  const getQualityColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    color: string;
    trend?: 'up' | 'down' | 'stable';
  }> = ({ title, value, subtitle, icon, color, trend }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className={`text-3xl font-bold ${color} mb-1`}>{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 flex items-center">
              {subtitle}
              {trend && (
                <span className={`ml-2 ${
                  trend === 'up' ? 'text-green-500' : 
                  trend === 'down' ? 'text-red-500' : 'text-gray-400'
                }`}>
                  <TrendingUp className={`w-3 h-3 ${trend === 'down' ? 'rotate-180' : ''}`} />
                </span>
              )}
            </p>
          )}
        </div>
        <div className={`w-14 h-14 ${color.replace('text-', 'bg-').replace('-600', '-100')} rounded-xl flex items-center justify-center shadow-sm`}>
          <div className={color}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Images"
          value={stats.totalImages}
          subtitle="Analyzed"
          icon={<Camera className="w-7 h-7" />}
          color="text-blue-600"
        />

        <StatCard
          title="Recommended"
          value={stats.recommendedForReconstruction}
          subtitle={`${qualityPercentage.toFixed(1)}% suitable`}
          icon={<CheckCircle className="w-7 h-7" />}
          color="text-green-600"
          trend={qualityPercentage >= 80 ? 'up' : qualityPercentage >= 60 ? 'stable' : 'down'}
        />

        <StatCard
          title="Average Quality"
          value={stats.averageCompositeScore?.toFixed(1) || '0.0'}
          subtitle="Composite score"
          icon={<TrendingUp className="w-7 h-7" />}
          color={getQualityColor(stats.averageCompositeScore || 0)}
        />

        <StatCard
          title="Pass Rate"
          value={`${qualityPercentage.toFixed(1)}%`}
          subtitle={`Threshold: ${threshold}`}
          icon={<BarChart3 className="w-7 h-7" />}
          color={getQualityColor(qualityPercentage)}
        />
      </div>

      {/* Secondary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Average Sharpness"
          value={stats.averageBlurScore?.toFixed(1) || '0.0'}
          subtitle="Blur detection score"
          icon={<Zap className="w-6 h-6" />}
          color="text-purple-600"
        />

        <StatCard
          title="Average Exposure"
          value={stats.averageExposureScore?.toFixed(1) || '0.0'}
          subtitle="Lighting quality"
          icon={<TrendingUp className="w-6 h-6" />}
          color="text-orange-600"
        />

        <StatCard
          title="Average Features"
          value={Math.round(stats.averageKeypointCount || 0)}
          subtitle="Keypoints detected"
          icon={<Target className="w-6 h-6" />}
          color="text-cyan-600"
        />

        <StatCard
          title="Feature Quality"
          value={stats.averageDescriptorScore?.toFixed(1) || '0.0'}
          subtitle="Photogrammetric score"
          icon={<Grid className="w-6 h-6" />}
          color="text-emerald-600"
        />
      </div>

      {/* Quality Distribution Visualization */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Quality Distribution</h3>
          <div className="text-sm text-gray-500">
            Based on composite scores
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: 'Excellent', count: stats.excellentCount, color: 'bg-green-500', textColor: 'text-green-600' },
            { label: 'Good', count: stats.goodCount, color: 'bg-blue-500', textColor: 'text-blue-600' },
            { label: 'Acceptable', count: stats.qualityDistribution?.acceptable || 0, color: 'bg-yellow-500', textColor: 'text-yellow-600' },
            { label: 'Poor', count: stats.poorCount, color: 'bg-orange-500', textColor: 'text-orange-600' },
            { label: 'Unsuitable', count: stats.unsuitableCount, color: 'bg-red-500', textColor: 'text-red-600' }
          ].map((category, index) => (
            <div key={index} className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className={`text-2xl font-bold ${category.textColor} mb-1`}>
                {category.count}
              </div>
              <div className="text-sm font-medium text-gray-600 mb-2">
                {category.label}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${category.color} transition-all duration-500`}
                  style={{ 
                    width: `${stats.totalImages > 0 ? (category.count / stats.totalImages) * 100 : 0}%` 
                  }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {stats.totalImages > 0 ? ((category.count / stats.totalImages) * 100).toFixed(1) : 0}%
              </div>
            </div>
          ))}
        </div>

        {/* Summary Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg border-2 ${
            qualityPercentage >= 80 
              ? 'bg-green-50 border-green-200 text-green-800'
              : qualityPercentage >= 60
              ? 'bg-blue-50 border-blue-200 text-blue-800'
              : qualityPercentage >= 40
              ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="font-medium mb-1">Overall Assessment</div>
            <div className="text-sm">
              {qualityPercentage >= 80 
                ? 'Excellent dataset quality - ready for reconstruction'
                : qualityPercentage >= 60
                ? 'Good dataset quality - suitable for most projects'
                : qualityPercentage >= 40
                ? 'Acceptable quality - may need additional images'
                : 'Poor dataset quality - consider retaking images'
              }
            </div>
          </div>

          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="font-medium text-gray-900 mb-1">Reconstruction Readiness</div>
            <div className="text-sm text-gray-700">
              {stats.recommendedForReconstruction} of {stats.totalImages} images meet quality threshold
            </div>
          </div>

          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="font-medium text-gray-900 mb-1">Feature Density</div>
            <div className="text-sm text-gray-700">
              Average {Math.round(stats.averageKeypointCount || 0)} keypoints per image
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};