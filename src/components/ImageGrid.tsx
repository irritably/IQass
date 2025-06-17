import React, { useState } from 'react';
import { ImageAnalysis } from '../types';
import { CheckCircle, AlertTriangle, XCircle, Eye, Download, Info } from 'lucide-react';
import { TechnicalQualityPanel } from './TechnicalQualityPanel';
import { getRecommendationColor } from '../utils/compositeScoring';

interface ImageGridProps {
  analyses: ImageAnalysis[];
  threshold: number;
}

export const ImageGrid: React.FC<ImageGridProps> = ({ analyses, threshold }) => {
  const [filter, setFilter] = useState<'all' | 'recommended' | 'not-recommended'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'score' | 'quality' | 'composite'>('composite');
  const [selectedImage, setSelectedImage] = useState<ImageAnalysis | null>(null);

  const getQualityIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'excellent':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'good':
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case 'acceptable':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'poor':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'unsuitable':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <XCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const filteredAnalyses = analyses.filter(analysis => {
    const compositeScore = analysis.compositeScore?.overall || 0;
    if (filter === 'recommended') return compositeScore >= threshold;
    if (filter === 'not-recommended') return compositeScore < threshold;
    return true;
  });

  const sortedAnalyses = [...filteredAnalyses].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'score':
        return b.blurScore - a.blurScore;
      case 'composite':
        return (b.compositeScore?.overall || 0) - (a.compositeScore?.overall || 0);
      case 'quality':
        const qualityOrder = { excellent: 5, good: 4, acceptable: 3, poor: 2, unsuitable: 1 };
        const aQuality = a.compositeScore?.recommendation || 'unsuitable';
        const bQuality = b.compositeScore?.recommendation || 'unsuitable';
        return qualityOrder[bQuality as keyof typeof qualityOrder] - qualityOrder[aQuality as keyof typeof qualityOrder];
      default:
        return 0;
    }
  });

  const downloadRecommended = () => {
    const recommended = analyses.filter(a => (a.compositeScore?.overall || 0) >= threshold);
    console.log('Would download', recommended.length, 'recommended images');
  };

  if (analyses.length === 0) return null;

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <h3 className="text-lg font-semibold text-gray-900">Image Analysis Results</h3>
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Images ({analyses.length})</option>
                <option value="recommended">
                  Recommended ({analyses.filter(a => (a.compositeScore?.overall || 0) >= threshold).length})
                </option>
                <option value="not-recommended">
                  Not Recommended ({analyses.filter(a => (a.compositeScore?.overall || 0) < threshold).length})
                </option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="composite">Sort by Composite Score</option>
                <option value="score">Sort by Blur Score</option>
                <option value="name">Sort by Name</option>
                <option value="quality">Sort by Quality</option>
              </select>
              
              <button
                onClick={downloadRecommended}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Recommended
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedAnalyses.map((analysis) => (
              <div
                key={analysis.id}
                className="group relative bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedImage(analysis)}
              >
                <div className="aspect-square relative">
                  {analysis.thumbnail ? (
                    <img
                      src={analysis.thumbnail}
                      alt={analysis.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <Eye className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  
                  <div className="absolute top-2 right-2">
                    {getQualityIcon(analysis.compositeScore?.recommendation || 'unsuitable')}
                  </div>
                  
                  <div className="absolute bottom-2 left-2 right-2 space-y-1">
                    <div className="bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs font-medium">
                      Overall: {analysis.compositeScore?.overall || 0}
                    </div>
                    <div className="bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                      Blur: {analysis.blurScore} | Exp: {analysis.exposureAnalysis?.exposureScore || 0} | Noise: {analysis.noiseAnalysis?.noiseScore || 0}
                    </div>
                  </div>
                </div>
                
                <div className="p-4">
                  <h4 className="font-medium text-gray-900 truncate mb-2">
                    {analysis.name}
                  </h4>
                  
                  <div className="flex items-center justify-between mb-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                      getRecommendationColor(analysis.compositeScore?.recommendation || 'unsuitable')
                    }`}>
                      {analysis.compositeScore?.recommendation || 'unsuitable'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {(analysis.size / 1024 / 1024).toFixed(1)} MB
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${
                      (analysis.compositeScore?.overall || 0) >= threshold ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {(analysis.compositeScore?.overall || 0) >= threshold ? 'Recommended' : 'Not Recommended'}
                    </span>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImage(analysis);
                      }}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {analysis.error && (
                    <div className="mt-2 text-xs text-red-600 truncate">
                      Error: {analysis.error}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {sortedAnalyses.length === 0 && (
            <div className="text-center py-12">
              <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No images match the current filter.</p>
            </div>
          )}
        </div>
      </div>

      {/* Technical Quality Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">{selectedImage.name}</h2>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <TechnicalQualityPanel analysis={selectedImage} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};