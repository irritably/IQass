import React from 'react';
import { AnalysisStats } from '../types';
import { CheckCircle, AlertTriangle, XCircle, TrendingUp, Camera, Zap, Target, Grid } from 'lucide-react';

interface StatsOverviewProps {
  stats: AnalysisStats;
  threshold: number;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ stats, threshold }) => {
  const qualityPercentage = stats.totalImages > 0 
    ? (stats.recommendedForReconstruction / stats.totalImages) * 100 
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Images</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalImages}</p>
          </div>
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Camera className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Recommended</p>
            <p className="text-3xl font-bold text-green-600">{stats.recommendedForReconstruction}</p>
            <p className="text-sm text-gray-500">{qualityPercentage.toFixed(1)}% suitable</p>
          </div>
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Average Composite Score</p>
            <p className="text-3xl font-bold text-blue-600">{stats.averageCompositeScore?.toFixed(1) || '0.0'}</p>
            <p className="text-sm text-gray-500">Overall quality</p>
          </div>
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Quality Distribution</p>
            <div className="flex space-x-1 mt-2">
              <div className="flex flex-col items-center">
                <div className="w-3 h-8 bg-green-500 rounded-sm"></div>
                <span className="text-xs text-gray-600 mt-1">{stats.excellentCount}</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-3 h-6 bg-blue-500 rounded-sm"></div>
                <span className="text-xs text-gray-600 mt-1">{stats.goodCount}</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-3 h-4 bg-yellow-500 rounded-sm"></div>
                <span className="text-xs text-gray-600 mt-1">{stats.qualityDistribution?.acceptable || 0}</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 bg-orange-500 rounded-sm"></div>
                <span className="text-xs text-gray-600 mt-1">{stats.poorCount}</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-3 h-2 bg-red-500 rounded-sm"></div>
                <span className="text-xs text-gray-600 mt-1">{stats.unsuitableCount}</span>
              </div>
            </div>
          </div>
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-gray-600" />
          </div>
        </div>
      </div>

      {/* Second Row - Enhanced Metrics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Average Blur Score</p>
            <p className="text-3xl font-bold text-purple-600">{stats.averageBlurScore?.toFixed(1) || '0.0'}</p>
            <p className="text-sm text-gray-500">Sharpness metric</p>
          </div>
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <Zap className="w-6 h-6 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Average Exposure Score</p>
            <p className="text-3xl font-bold text-orange-600">{stats.averageExposureScore?.toFixed(1) || '0.0'}</p>
            <p className="text-sm text-gray-500">Lighting quality</p>
          </div>
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-orange-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Average Descriptor Score</p>
            <p className="text-3xl font-bold text-cyan-600">{stats.averageDescriptorScore?.toFixed(1) || '0.0'}</p>
            <p className="text-sm text-gray-500">Feature quality</p>
          </div>
          <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center">
            <Target className="w-6 h-6 text-cyan-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Average Keypoints</p>
            <p className="text-3xl font-bold text-emerald-600">{Math.round(stats.averageKeypointCount || 0)}</p>
            <p className="text-sm text-gray-500">Features detected</p>
          </div>
          <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
            <Grid className="w-6 h-6 text-emerald-600" />
          </div>
        </div>
      </div>
    </div>
  );
};