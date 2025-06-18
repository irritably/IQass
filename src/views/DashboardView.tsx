import React, { useMemo } from 'react';
import { StatsOverview } from '../components/StatsOverview';
import { QualityHistogram } from '../components/QualityHistogram';
import { ImageAnalysis, AnalysisStats } from '../types';
import { BarChart3, TrendingUp, Calendar, Target, Award, AlertTriangle } from 'lucide-react';
import { calculateQualityStatistics } from '../utils/qualityAssessment';

interface DashboardViewProps {
  analyses: ImageAnalysis[];
  threshold: number;
  stats: AnalysisStats;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  analyses,
  threshold,
  stats
}) => {
  // Calculate additional dashboard metrics
  const dashboardMetrics = useMemo(() => {
    if (analyses.length === 0) {
      return {
        qualityTrend: 'stable',
        topIssues: [],
        recommendations: [],
        sessionSummary: null
      };
    }

    // Analyze quality trends
    const recentAnalyses = analyses.slice(-20); // Last 20 images
    const avgRecentQuality = recentAnalyses.reduce((sum, a) => sum + (a.compositeScore?.overall || 0), 0) / recentAnalyses.length;
    const overallAvgQuality = stats.averageCompositeScore;
    
    let qualityTrend: 'improving' | 'declining' | 'stable' = 'stable';
    if (avgRecentQuality > overallAvgQuality + 5) qualityTrend = 'improving';
    else if (avgRecentQuality < overallAvgQuality - 5) qualityTrend = 'declining';

    // Identify top issues
    const topIssues = [];
    if (stats.averageBlurScore < 60) topIssues.push('Blur quality needs improvement');
    if (stats.averageExposureScore < 70) topIssues.push('Exposure consistency issues');
    if (stats.averageNoiseScore < 75) topIssues.push('Noise levels affecting quality');
    if (stats.averageKeypointCount < 500) topIssues.push('Low feature density detected');

    // Generate recommendations
    const recommendations = [];
    if (stats.recommendedForReconstruction / stats.totalImages < 0.8) {
      recommendations.push('Consider adjusting flight parameters to improve overall quality');
    }
    if (qualityTrend === 'declining') {
      recommendations.push('Recent images show declining quality - check camera settings');
    }
    if (stats.averageBlurScore < 70) {
      recommendations.push('Increase shutter speed or reduce flight speed to minimize blur');
    }

    return {
      qualityTrend,
      topIssues,
      recommendations,
      sessionSummary: {
        totalProcessingTime: analyses.length * 2, // Estimated
        averageFileSize: analyses.reduce((sum, a) => sum + a.size, 0) / analyses.length / 1024 / 1024,
        uniqueCameras: new Set(analyses.map(a => a.metadata?.camera.model).filter(Boolean)).size
      }
    };
  }, [analyses, threshold, stats]);

  if (analyses.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h2>
          <p className="text-gray-600 mb-8">
            Complete your first analysis to see comprehensive statistics and insights
          </p>
          <div className="bg-blue-50 rounded-lg p-6 max-w-md mx-auto">
            <h3 className="font-medium text-blue-900 mb-2">What you'll see here:</h3>
            <ul className="text-sm text-blue-800 space-y-1 text-left">
              <li>• Quality statistics and trends</li>
              <li>• Performance metrics and insights</li>
              <li>• Recommendations for improvement</li>
              <li>• Session history and comparisons</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* View Header */}
        <div className="text-center">
          <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
          <p className="text-lg text-gray-600">
            Comprehensive overview of your image analysis results and quality trends
          </p>
        </div>

        {/* Key Metrics Overview */}
        <StatsOverview stats={stats} threshold={threshold} />

        {/* Quality Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <TrendingUp className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Quality Distribution</h3>
          </div>
          <QualityHistogram analyses={analyses} />
        </div>

        {/* Insights and Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quality Trends */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <TrendingUp className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Quality Trends</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Overall Trend</span>
                <div className="flex items-center space-x-2">
                  {dashboardMetrics.qualityTrend === 'improving' && (
                    <>
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-600">Improving</span>
                    </>
                  )}
                  {dashboardMetrics.qualityTrend === 'declining' && (
                    <>
                      <TrendingUp className="w-4 h-4 text-red-600 transform rotate-180" />
                      <span className="text-sm font-medium text-red-600">Declining</span>
                    </>
                  )}
                  {dashboardMetrics.qualityTrend === 'stable' && (
                    <>
                      <div className="w-4 h-4 bg-blue-600 rounded-full" />
                      <span className="text-sm font-medium text-blue-600">Stable</span>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900">Session Summary</h4>
                {dashboardMetrics.sessionSummary && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg File Size:</span>
                      <span className="font-medium">{dashboardMetrics.sessionSummary.averageFileSize.toFixed(1)} MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cameras Used:</span>
                      <span className="font-medium">{dashboardMetrics.sessionSummary.uniqueCameras}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Issues and Recommendations */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Target className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Insights & Recommendations</h3>
            </div>
            
            <div className="space-y-4">
              {/* Top Issues */}
              {dashboardMetrics.topIssues.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                    <AlertTriangle className="w-4 h-4 text-amber-500 mr-1" />
                    Areas for Improvement
                  </h4>
                  <ul className="space-y-1">
                    {dashboardMetrics.topIssues.map((issue, index) => (
                      <li key={index} className="text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded">
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {dashboardMetrics.recommendations.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                    <Award className="w-4 h-4 text-blue-500 mr-1" />
                    Recommendations
                  </h4>
                  <ul className="space-y-1">
                    {dashboardMetrics.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-blue-700 bg-blue-50 px-3 py-2 rounded">
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Success Message */}
              {dashboardMetrics.topIssues.length === 0 && dashboardMetrics.recommendations.length === 0 && (
                <div className="text-center py-4">
                  <Award className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-green-700 font-medium">Excellent Quality!</p>
                  <p className="text-xs text-green-600">Your images meet high quality standards</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Calendar className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Session Performance</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{analyses.length}</div>
              <div className="text-sm text-gray-600">Images Processed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {((stats.recommendedForReconstruction / stats.totalImages) * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.averageCompositeScore.toFixed(0)}
              </div>
              <div className="text-sm text-gray-600">Avg Quality Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(stats.averageKeypointCount)}
              </div>
              <div className="text-sm text-gray-600">Avg Features</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};