import React from 'react';
import { ImageGrid } from '../components/ImageGrid';
import { ReportExport } from '../components/ReportExport';
import { ImageAnalysis } from '../types';
import { Grid3X3, Download, Search, Filter } from 'lucide-react';

interface AnalysisResultsViewProps {
  analyses: ImageAnalysis[];
  threshold: number;
}

export const AnalysisResultsView: React.FC<AnalysisResultsViewProps> = ({
  analyses,
  threshold
}) => {
  if (analyses.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4">
            <Grid3X3 className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Analysis Results</h2>
          <p className="text-gray-600 mb-8">
            No analysis results available. Upload and process images to see detailed results here.
          </p>
          <div className="bg-blue-50 rounded-lg p-6 max-w-md mx-auto">
            <h3 className="font-medium text-blue-900 mb-2">What you'll find here:</h3>
            <ul className="text-sm text-blue-800 space-y-1 text-left">
              <li>• Detailed image analysis results in list or grid view</li>
              <li>• Side-by-side comparison tools</li>
              <li>• Advanced filtering and sorting options</li>
              <li>• Export options for your workflow</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  const recommendedCount = analyses.filter(a => (a.compositeScore?.overall || 0) >= threshold).length;
  const successRate = ((recommendedCount / analyses.length) * 100).toFixed(1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* View Header */}
        <div className="text-center">
          <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mx-auto mb-4">
            <Grid3X3 className="w-8 h-8 text-purple-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Analysis Results</h2>
          <p className="text-lg text-gray-600">
            Detailed results for {analyses.length} images with {successRate}% meeting quality standards
          </p>
        </div>

        {/* Quick Stats */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-purple-600">{analyses.length}</div>
              <div className="text-sm text-purple-700">Total Images</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{recommendedCount}</div>
              <div className="text-sm text-green-700">Recommended</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{analyses.length - recommendedCount}</div>
              <div className="text-sm text-red-700">Not Recommended</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{successRate}%</div>
              <div className="text-sm text-blue-700">Success Rate</div>
            </div>
          </div>
        </div>

        {/* Results Grid */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Search className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Detailed Results</h3>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  Default: List View
                </span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Filter className="w-4 h-4" />
                <span>Use view toggle, filters and sorting options below</span>
              </div>
            </div>
          </div>
          <div className="p-6">
            <ImageGrid analyses={analyses} threshold={threshold} />
          </div>
        </div>

        {/* Export Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Download className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Export & Reports</h3>
            </div>
          </div>
          <div className="p-6">
            <ReportExport analyses={analyses} threshold={threshold} />
          </div>
        </div>

        {/* Usage Tips */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
          <h4 className="font-medium text-blue-900 mb-3">Results View Features</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <h5 className="font-medium mb-1">View Options</h5>
              <ul className="space-y-1">
                <li>• Toggle between List and Grid views</li>
                <li>• Sort by score (High→Low or Low→High)</li>
                <li>• Filter by quality level or recommendation</li>
                <li>• Click any image for detailed technical analysis</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium mb-1">Export Options</h5>
              <ul className="space-y-1">
                <li>• Export CSV data for integration with software</li>
                <li>• Generate comprehensive quality reports</li>
                <li>• Download recommended images list</li>
                <li>• All exports respect current filter settings</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};