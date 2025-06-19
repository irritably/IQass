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
      {/* Total Images */}
      <div className="card card-hover animate-fade-in-up">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Total Images</p>
              <p className="text-3xl font-bold text-slate-100 mt-1">{stats.totalImages}</p>
              <p className="text-sm text-blue-400 mt-1">Images analyzed</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Recommended */}
      <div className="card card-hover animate-fade-in-up delay-100">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Recommended</p>
              <p className="text-3xl font-bold text-emerald-400 mt-1">{stats.recommendedForReconstruction}</p>
              <p className="text-sm text-emerald-300 mt-1">{qualityPercentage.toFixed(1)}% suitable</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="progress-bar">
              <div 
                className="progress-fill bg-gradient-to-r from-emerald-500 to-green-400"
                style={{ width: `${qualityPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Average Composite Score */}
      <div className="card card-hover animate-fade-in-up delay-200">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Average Quality</p>
              <p className="text-3xl font-bold text-cyan-400 mt-1">{stats.averageCompositeScore?.toFixed(1) || '0.0'}</p>
              <p className="text-sm text-cyan-300 mt-1">Overall score</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
          {/* Quality Indicator */}
          <div className="mt-4 flex items-center space-x-2">
            {(stats.averageCompositeScore || 0) >= 80 ? (
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            ) : (stats.averageCompositeScore || 0) >= 60 ? (
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            ) : (
              <XCircle className="w-4 h-4 text-red-400" />
            )}
            <span className="text-xs text-slate-400">
              {(stats.averageCompositeScore || 0) >= 80 ? 'Excellent' : 
               (stats.averageCompositeScore || 0) >= 60 ? 'Good' : 'Needs Improvement'}
            </span>
          </div>
        </div>
      </div>

      {/* Quality Distribution */}
      <div className="card card-hover animate-fade-in-up delay-300">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-slate-400">Quality Distribution</p>
              <p className="text-sm text-slate-300 mt-1">Breakdown by quality</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
              <Grid className="w-6 h-6 text-white" />
            </div>
          </div>
          
          {/* Distribution Chart */}
          <div className="flex space-x-1 mb-3">
            <div className="flex flex-col items-center flex-1">
              <div className="w-full h-8 bg-emerald-500 rounded-sm flex items-center justify-center text-xs font-semibold text-white">
                {stats.excellentCount}
              </div>
              <span className="text-xs text-slate-400 mt-1">Exc</span>
            </div>
            <div className="flex flex-col items-center flex-1">
              <div className="w-full h-6 bg-blue-500 rounded-sm flex items-center justify-center text-xs font-semibold text-white">
                {stats.goodCount}
              </div>
              <span className="text-xs text-slate-400 mt-1">Good</span>
            </div>
            <div className="flex flex-col items-center flex-1">
              <div className="w-full h-4 bg-amber-500 rounded-sm flex items-center justify-center text-xs font-semibold text-white">
                {stats.qualityDistribution?.acceptable || 0}
              </div>
              <span className="text-xs text-slate-400 mt-1">OK</span>
            </div>
            <div className="flex flex-col items-center flex-1">
              <div className="w-full h-3 bg-orange-500 rounded-sm flex items-center justify-center text-xs font-semibold text-white">
                {stats.poorCount}
              </div>
              <span className="text-xs text-slate-400 mt-1">Poor</span>
            </div>
            <div className="flex flex-col items-center flex-1">
              <div className="w-full h-2 bg-red-500 rounded-sm flex items-center justify-center text-xs font-semibold text-white">
                {stats.unsuitableCount}
              </div>
              <span className="text-xs text-slate-400 mt-1">Bad</span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Stats Row */}
      <div className="card card-hover animate-fade-in-up delay-400">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Average Blur Score</p>
              <p className="text-3xl font-bold text-purple-400 mt-1">{stats.averageBlurScore?.toFixed(1) || '0.0'}</p>
              <p className="text-sm text-purple-300 mt-1">Sharpness metric</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl flex items-center justify-center shadow-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="card card-hover animate-fade-in-up delay-500">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Average Exposure</p>
              <p className="text-3xl font-bold text-orange-400 mt-1">{stats.averageExposureScore?.toFixed(1) || '0.0'}</p>
              <p className="text-sm text-orange-300 mt-1">Lighting quality</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="card card-hover animate-fade-in-up delay-600">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Feature Quality</p>
              <p className="text-3xl font-bold text-cyan-400 mt-1">{stats.averageDescriptorScore?.toFixed(1) || '0.0'}</p>
              <p className="text-sm text-cyan-300 mt-1">Descriptor analysis</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="card card-hover animate-fade-in-up delay-700">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Average Keypoints</p>
              <p className="text-3xl font-bold text-emerald-400 mt-1">{Math.round(stats.averageKeypointCount || 0)}</p>
              <p className="text-sm text-emerald-300 mt-1">Features detected</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
              <Grid className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};