import React from 'react';
import { AnalysisStats } from '../../types';
import { StatsCard } from './StatsCard';
import { 
  Camera, 
  CheckCircle, 
  TrendingUp, 
  Target, 
  Grid, 
  Zap,
  BarChart3,
  Activity
} from 'lucide-react';

interface ModernStatsOverviewProps {
  stats: AnalysisStats;
  threshold: number;
}

export const ModernStatsOverview: React.FC<ModernStatsOverviewProps> = ({ stats, threshold }) => {
  const qualityPercentage = stats.totalImages > 0 
    ? (stats.recommendedForReconstruction / stats.totalImages) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Images"
          value={stats.totalImages}
          subtitle="Images analyzed"
          icon={Camera}
          color="blue"
          className="animate-fade-in-up"
        />

        <StatsCard
          title="Recommended"
          value={stats.recommendedForReconstruction}
          subtitle={`${qualityPercentage.toFixed(1)}% suitable`}
          icon={CheckCircle}
          color="emerald"
          trend={{
            value: qualityPercentage,
            isPositive: qualityPercentage >= 70
          }}
          className="animate-fade-in-up"
          style={{ animationDelay: '0.1s' }}
        />

        <StatsCard
          title="Average Quality"
          value={stats.averageCompositeScore?.toFixed(1) || '0.0'}
          subtitle="Overall score"
          icon={TrendingUp}
          color="cyan"
          trend={{
            value: stats.averageCompositeScore || 0,
            isPositive: (stats.averageCompositeScore || 0) >= 70
          }}
          className="animate-fade-in-up"
          style={{ animationDelay: '0.2s' }}
        />

        <StatsCard
          title="Processing Speed"
          value={`${(stats.averageProcessingTime / 1000).toFixed(1)}s`}
          subtitle="Per image"
          icon={Zap}
          color="purple"
          className="animate-fade-in-up"
          style={{ animationDelay: '0.3s' }}
        />
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Blur Score"
          value={stats.averageBlurScore?.toFixed(1) || '0.0'}
          subtitle="Sharpness metric"
          icon={Target}
          color="blue"
          className="animate-fade-in-up"
          style={{ animationDelay: '0.4s' }}
        />

        <StatsCard
          title="Feature Quality"
          value={stats.averageDescriptorScore?.toFixed(1) || '0.0'}
          subtitle="Descriptor analysis"
          icon={Grid}
          color="emerald"
          className="animate-fade-in-up"
          style={{ animationDelay: '0.5s' }}
        />

        <StatsCard
          title="Keypoints"
          value={Math.round(stats.averageKeypointCount || 0)}
          subtitle="Features detected"
          icon={Activity}
          color="amber"
          className="animate-fade-in-up"
          style={{ animationDelay: '0.6s' }}
        />

        <StatsCard
          title="Quality Distribution"
          value={
            <div className="flex space-x-1 mt-2">
              <div className="flex flex-col items-center">
                <div className="w-3 h-8 bg-emerald-500 rounded-sm"></div>
                <span className="text-xs text-gray-400 mt-1">{stats.excellentCount}</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-3 h-6 bg-blue-500 rounded-sm"></div>
                <span className="text-xs text-gray-400 mt-1">{stats.goodCount}</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-3 h-4 bg-amber-500 rounded-sm"></div>
                <span className="text-xs text-gray-400 mt-1">{stats.qualityDistribution?.acceptable || 0}</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 bg-orange-500 rounded-sm"></div>
                <span className="text-xs text-gray-400 mt-1">{stats.poorCount}</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-3 h-2 bg-red-500 rounded-sm"></div>
                <span className="text-xs text-gray-400 mt-1">{stats.unsuitableCount}</span>
              </div>
            </div>
          }
          subtitle="Quality breakdown"
          icon={BarChart3}
          color="purple"
          className="animate-fade-in-up"
          style={{ animationDelay: '0.7s' }}
        />
      </div>
    </div>
  );
};