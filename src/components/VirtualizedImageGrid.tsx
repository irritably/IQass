/**
 * Virtualized Image Grid Component
 * 
 * This component implements virtualization for the image grid to handle
 * large numbers of images efficiently by only rendering visible items.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { ImageAnalysis } from '../types';
import { CheckCircle, AlertTriangle, XCircle, Eye, Info, List, Grid, ArrowUpDown } from 'lucide-react';
import { TechnicalQualityPanel } from './TechnicalQualityPanel';
import { LazyImageCard } from './LazyImageCard';
import { getRecommendationColor } from '../utils/compositeScoring';
import { useImageFiltering, FilterType, SortType } from '../hooks/useImageFiltering';
import { exportQualityDataToCSV } from '../utils/qualityAssessment';
import { CONFIG } from '../config';

interface VirtualizedImageGridProps {
  analyses: ImageAnalysis[];
  threshold: number;
}

type ViewMode = 'list' | 'grid';
type SortOrder = 'desc' | 'asc';

export const VirtualizedImageGrid: React.FC<VirtualizedImageGridProps> = ({ 
  analyses, 
  threshold 
}) => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('composite');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedImage, setSelectedImage] = useState<ImageAnalysis | null>(null);

  const { filteredAnalyses, filterCounts } = useImageFiltering({
    analyses,
    filter,
    sortBy,
    threshold
  });

  // Apply sort order
  const sortedAnalyses = useMemo(() => {
    const sorted = [...filteredAnalyses];
    if (sortOrder === 'asc') {
      sorted.reverse();
    }
    return sorted;
  }, [filteredAnalyses, sortOrder]);

  /**
   * Returns appropriate icon for quality recommendation
   */
  const getQualityIcon = useCallback((recommendation: string) => {
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
  }, []);

  // Memoize grid items to prevent unnecessary re-renders
  const gridItems = useMemo(() => {
    if (viewMode === 'list') {
      return sortedAnalyses.map((analysis) => (
        <VirtualizedListItem
          key={analysis.id}
          analysis={analysis}
          threshold={threshold}
          onSelect={setSelectedImage}
          getQualityIcon={getQualityIcon}
        />
      ));
    } else {
      return sortedAnalyses.map((analysis) => (
        <LazyImageCard
          key={analysis.id}
          analysis={analysis}
          threshold={threshold}
          onSelect={setSelectedImage}
          getQualityIcon={getQualityIcon}
        />
      ));
    }
  }, [sortedAnalyses, threshold, getQualityIcon, viewMode]);

  if (analyses.length === 0) return null;

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Header with Controls */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Image Analysis Results</h3>
              <p className="text-sm text-gray-600 mt-1">
                Optimized for large batches with lazy loading
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List className="w-4 h-4 mr-1" />
                  List
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Grid className="w-4 h-4 mr-1" />
                  Grid
                </button>
              </div>

              {/* Filter Dropdown */}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as FilterType)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Images ({filterCounts.all})</option>
                <option value="recommended">Recommended ({filterCounts.recommended})</option>
                <option value="not-recommended">Not Recommended ({filterCounts.notRecommended})</option>
              </select>
              
              {/* Sort Dropdown */}
              <div className="flex items-center space-x-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortType)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="composite">Sort by Composite Score</option>
                  <option value="score">Sort by Blur Score</option>
                  <option value="name">Sort by Name</option>
                  <option value="quality">Sort by Quality</option>
                </select>
                
                {/* Sort Order Toggle */}
                <button
                  onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                  className="flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                  title={`Sort ${sortOrder === 'desc' ? 'High to Low' : 'Low to High'}`}
                >
                  <ArrowUpDown className="w-4 h-4" />
                  <span className="ml-1 text-xs">
                    {sortOrder === 'desc' ? 'High→Low' : 'Low→High'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Virtualized Results Display */}
        <div className="p-6">
          {sortedAnalyses.length > 0 ? (
            viewMode === 'list' ? (
              <div className="space-y-2">
                {gridItems}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {gridItems}
              </div>
            )
          ) : (
            /* Empty State */
            <div className="text-center py-12">
              <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No images match the current filter.</p>
            </div>
          )}
          
          {/* Performance Info */}
          {sortedAnalyses.length > CONFIG.QUALITY.VIRTUALIZATION_THRESHOLD && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-2">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900">Performance Optimization Active</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Lazy loading is active for this large batch ({sortedAnalyses.length} images). 
                    Thumbnails load as you scroll to optimize memory usage and performance.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Technical Quality Modal */}
      {selectedImage && (
        <TechnicalQualityModal
          analysis={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </>
  );
};

/**
 * Virtualized List Item Component
 */
interface VirtualizedListItemProps {
  analysis: ImageAnalysis;
  threshold: number;
  onSelect: (analysis: ImageAnalysis) => void;
  getQualityIcon: (recommendation: string) => React.ReactNode;
}

const VirtualizedListItem: React.FC<VirtualizedListItemProps> = ({
  analysis,
  threshold,
  onSelect,
  getQualityIcon
}) => {
  const isRecommended = (analysis.compositeScore?.overall || 0) >= threshold;
  const recommendation = analysis.compositeScore?.recommendation || 'unsuitable';

  return (
    <div
      className="flex items-center space-x-4 p-4 border rounded-lg hover:shadow-md transition-all cursor-pointer bg-white hover:bg-gray-50"
      onClick={() => onSelect(analysis)}
    >
      {/* Thumbnail */}
      <div className="flex-shrink-0 w-16 h-16">
        {analysis.thumbnail ? (
          <img
            src={analysis.thumbnail}
            alt={analysis.name}
            className="w-full h-full object-cover rounded"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
            <Eye className="w-6 h-6 text-gray-400" />
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          {getQualityIcon(recommendation)}
          <h4 className="font-medium text-gray-900 truncate">
            {analysis.name}
          </h4>
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>{(analysis.size / 1024 / 1024).toFixed(1)} MB</span>
          <span className={`font-medium ${
            isRecommended ? 'text-green-600' : 'text-red-600'
          }`}>
            {isRecommended ? 'Recommended' : 'Not Recommended'}
          </span>
        </div>
      </div>

      {/* Scores */}
      <div className="flex-shrink-0 grid grid-cols-4 gap-3 text-center">
        <div>
          <div className="text-lg font-bold text-gray-900">
            {analysis.compositeScore?.overall || 0}
          </div>
          <div className="text-xs text-gray-500">Overall</div>
        </div>
        <div>
          <div className="text-lg font-bold text-purple-600">
            {analysis.blurScore}
          </div>
          <div className="text-xs text-gray-500">Blur</div>
        </div>
        <div>
          <div className="text-lg font-bold text-orange-600">
            {analysis.exposureAnalysis?.exposureScore || 0}
          </div>
          <div className="text-xs text-gray-500">Exposure</div>
        </div>
        <div>
          <div className="text-lg font-bold text-cyan-600">
            {analysis.noiseAnalysis?.noiseScore || 0}
          </div>
          <div className="text-xs text-gray-500">Noise</div>
        </div>
      </div>

      {/* Quality Badge */}
      <div className="flex-shrink-0">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
          getRecommendationColor(recommendation)
        }`}>
          {recommendation}
        </span>
      </div>

      {/* Details Button */}
      <div className="flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(analysis);
          }}
          className="text-blue-600 hover:text-blue-700 transition-colors"
          aria-label={`View details for ${analysis.name}`}
        >
          <Info className="w-5 h-5" />
        </button>
      </div>

      {/* Error Display */}
      {analysis.error && (
        <div className="flex-shrink-0 text-xs text-red-600">
          Error: {analysis.error}
        </div>
      )}
    </div>
  );
};

/**
 * Technical Quality Modal Component
 */
interface TechnicalQualityModalProps {
  analysis: ImageAnalysis;
  onClose: () => void;
}

const TechnicalQualityModal: React.FC<TechnicalQualityModalProps> = ({ 
  analysis, 
  onClose 
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">{analysis.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">
          <TechnicalQualityPanel analysis={analysis} />
        </div>
      </div>
    </div>
  );
};