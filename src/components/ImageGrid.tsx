import React, { useState } from 'react';
import { ImageAnalysis } from '../types';
import { CheckCircle, AlertTriangle, XCircle, Eye, Info, ArrowLeftRight, List, Grid, ArrowUpDown } from 'lucide-react';
import { TechnicalQualityPanel } from './TechnicalQualityPanel';
import { VirtualizedImageGrid } from './VirtualizedImageGrid';
import { ImageComparisonModal } from './ImageComparisonModal';
import { getRecommendationColor } from '../utils/compositeScoring';
import { useImageFiltering, FilterType, SortType } from '../hooks/useImageFiltering';
import { exportQualityDataToCSV } from '../utils/qualityAssessment';
import { CONFIG } from '../config';

interface ImageGridProps {
  analyses: ImageAnalysis[];
  threshold: number;
}

type ViewMode = 'list' | 'grid';
type SortOrder = 'desc' | 'asc';

export const ImageGrid: React.FC<ImageGridProps> = ({ analyses, threshold }) => {
  // For large batches, use the virtualized grid with lazy loading
  // For smaller batches, use the original implementation for simplicity
  const shouldUseVirtualization = analyses.length > CONFIG.QUALITY.VIRTUALIZATION_THRESHOLD;

  if (shouldUseVirtualization) {
    return <VirtualizedImageGrid analyses={analyses} threshold={threshold} />;
  }

  // Original implementation for smaller batches
  return <OriginalImageGrid analyses={analyses} threshold={threshold} />;
};

/**
 * Original Image Grid Component (for smaller batches)
 */
const OriginalImageGrid: React.FC<ImageGridProps> = ({ analyses, threshold }) => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('composite');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedImage, setSelectedImage] = useState<ImageAnalysis | null>(null);
  const [selectedForComparison, setSelectedForComparison] = useState<ImageAnalysis[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  const { filteredAnalyses, filterCounts } = useImageFiltering({
    analyses,
    filter,
    sortBy,
    threshold
  });

  // Apply sort order
  const sortedAnalyses = React.useMemo(() => {
    const sorted = [...filteredAnalyses];
    if (sortOrder === 'asc') {
      sorted.reverse();
    }
    return sorted;
  }, [filteredAnalyses, sortOrder]);

  /**
   * Returns appropriate icon for quality recommendation
   */
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

  /**
   * Handles image selection for comparison
   */
  const toggleImageForComparison = (analysis: ImageAnalysis) => {
    setSelectedForComparison(prev => {
      const isSelected = prev.some(img => img.id === analysis.id);
      if (isSelected) {
        return prev.filter(img => img.id !== analysis.id);
      } else if (prev.length < 3) { // Limit to 3 images for comparison
        return [...prev, analysis];
      }
      return prev;
    });
  };

  /**
   * Opens comparison modal
   */
  const openComparison = () => {
    if (selectedForComparison.length >= 2) {
      setShowComparison(true);
    }
  };

  /**
   * Clears comparison selection
   */
  const clearComparison = () => {
    setSelectedForComparison([]);
  };

  if (analyses.length === 0) return null;

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Header with Controls */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <h3 className="text-lg font-semibold text-gray-900">Image Analysis Results</h3>
              
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

            {/* Comparison Controls */}
            {selectedForComparison.length > 0 && (
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-3">
                  <ArrowLeftRight className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    {selectedForComparison.length} image{selectedForComparison.length !== 1 ? 's' : ''} selected for comparison
                  </span>
                  <span className="text-xs text-blue-700">
                    (Select 2-3 images to compare)
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={openComparison}
                    disabled={selectedForComparison.length < 2}
                    className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Compare Images
                  </button>
                  <button
                    onClick={clearComparison}
                    className="inline-flex items-center px-3 py-2 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Display */}
        <div className="p-6">
          {viewMode === 'list' ? (
            <ListView
              analyses={sortedAnalyses}
              threshold={threshold}
              onSelect={setSelectedImage}
              getQualityIcon={getQualityIcon}
              selectedForComparison={selectedForComparison}
              onToggleComparison={toggleImageForComparison}
              comparisonDisabled={(analysis) => selectedForComparison.length >= 3 && !selectedForComparison.some(img => img.id === analysis.id)}
            />
          ) : (
            <GridView
              analyses={sortedAnalyses}
              threshold={threshold}
              onSelect={setSelectedImage}
              getQualityIcon={getQualityIcon}
              selectedForComparison={selectedForComparison}
              onToggleComparison={toggleImageForComparison}
              comparisonDisabled={(analysis) => selectedForComparison.length >= 3 && !selectedForComparison.some(img => img.id === analysis.id)}
            />
          )}
          
          {/* Empty State */}
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
        <TechnicalQualityModal
          analysis={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}

      {/* Image Comparison Modal */}
      {showComparison && (
        <ImageComparisonModal
          images={selectedForComparison}
          onClose={() => setShowComparison(false)}
        />
      )}
    </>
  );
};

/**
 * List View Component
 */
interface ViewProps {
  analyses: ImageAnalysis[];
  threshold: number;
  onSelect: (analysis: ImageAnalysis) => void;
  getQualityIcon: (recommendation: string) => React.ReactNode;
  selectedForComparison: ImageAnalysis[];
  onToggleComparison: (analysis: ImageAnalysis) => void;
  comparisonDisabled: (analysis: ImageAnalysis) => boolean;
}

const ListView: React.FC<ViewProps> = ({
  analyses,
  threshold,
  onSelect,
  getQualityIcon,
  selectedForComparison,
  onToggleComparison,
  comparisonDisabled
}) => {
  return (
    <div className="space-y-2">
      {analyses.map((analysis) => {
        const isRecommended = (analysis.compositeScore?.overall || 0) >= threshold;
        const recommendation = analysis.compositeScore?.recommendation || 'unsuitable';
        const isSelectedForComparison = selectedForComparison.some(img => img.id === analysis.id);

        return (
          <div
            key={analysis.id}
            className={`flex items-center space-x-4 p-4 border rounded-lg hover:shadow-md transition-all cursor-pointer ${
              isSelectedForComparison ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-white hover:bg-gray-50'
            }`}
            onClick={() => onSelect(analysis)}
          >
            {/* Comparison Checkbox */}
            <div className="flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!comparisonDisabled(analysis)) {
                    onToggleComparison(analysis);
                  }
                }}
                disabled={comparisonDisabled(analysis)}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                  isSelectedForComparison
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : comparisonDisabled(analysis)
                    ? 'bg-gray-200 border-gray-300 cursor-not-allowed'
                    : 'bg-white border-gray-300 hover:border-blue-500'
                }`}
              >
                {isSelectedForComparison && <CheckCircle className="w-3 h-3" />}
              </button>
            </div>

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
      })}
    </div>
  );
};

/**
 * Grid View Component
 */
const GridView: React.FC<ViewProps> = ({
  analyses,
  threshold,
  onSelect,
  getQualityIcon,
  selectedForComparison,
  onToggleComparison,
  comparisonDisabled
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {analyses.map((analysis) => (
        <ImageCard
          key={analysis.id}
          analysis={analysis}
          threshold={threshold}
          onSelect={onSelect}
          getQualityIcon={getQualityIcon}
          isSelectedForComparison={selectedForComparison.some(img => img.id === analysis.id)}
          onToggleComparison={onToggleComparison}
          comparisonDisabled={comparisonDisabled(analysis)}
        />
      ))}
    </div>
  );
};

/**
 * Individual Image Card Component
 */
interface ImageCardProps {
  analysis: ImageAnalysis;
  threshold: number;
  onSelect: (analysis: ImageAnalysis) => void;
  getQualityIcon: (recommendation: string) => React.ReactNode;
  isSelectedForComparison: boolean;
  onToggleComparison: (analysis: ImageAnalysis) => void;
  comparisonDisabled: boolean;
}

const ImageCard: React.FC<ImageCardProps> = ({ 
  analysis, 
  threshold, 
  onSelect, 
  getQualityIcon,
  isSelectedForComparison,
  onToggleComparison,
  comparisonDisabled
}) => {
  const isRecommended = (analysis.compositeScore?.overall || 0) >= threshold;
  const recommendation = analysis.compositeScore?.recommendation || 'unsuitable';

  return (
    <div
      className={`group relative bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-all cursor-pointer ${
        isSelectedForComparison ? 'ring-2 ring-blue-500 shadow-lg' : ''
      }`}
      onClick={() => onSelect(analysis)}
    >
      {/* Comparison Selection Checkbox */}
      <div className="absolute top-2 left-2 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!comparisonDisabled) {
              onToggleComparison(analysis);
            }
          }}
          disabled={comparisonDisabled}
          className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
            isSelectedForComparison
              ? 'bg-blue-600 border-blue-600 text-white'
              : comparisonDisabled
              ? 'bg-gray-200 border-gray-300 cursor-not-allowed'
              : 'bg-white border-gray-300 hover:border-blue-500'
          }`}
        >
          {isSelectedForComparison && <CheckCircle className="w-4 h-4" />}
        </button>
      </div>

      {/* Image Thumbnail */}
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
        
        {/* Quality Icon Overlay */}
        <div className="absolute top-2 right-2">
          {getQualityIcon(recommendation)}
        </div>
        
        {/* Score Overlays */}
        <div className="absolute bottom-2 left-2 right-2 space-y-1">
          <div className="bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs font-medium">
            Overall: {analysis.compositeScore?.overall || 0}
          </div>
          <div className="bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
            Blur: {analysis.blurScore} | Exp: {analysis.exposureAnalysis?.exposureScore || 0} | Noise: {analysis.noiseAnalysis?.noiseScore || 0}
          </div>
        </div>
      </div>
      
      {/* Card Content */}
      <div className="p-4">
        <h4 className="font-medium text-gray-900 truncate mb-2">
          {analysis.name}
        </h4>
        
        <div className="flex items-center justify-between mb-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
            getRecommendationColor(recommendation)
          }`}>
            {recommendation}
          </span>
          <span className="text-xs text-gray-500">
            {(analysis.size / 1024 / 1024).toFixed(1)} MB
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className={`text-sm font-medium ${
            isRecommended ? 'text-green-600' : 'text-red-600'
          }`}>
            {isRecommended ? 'Recommended' : 'Not Recommended'}
          </span>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(analysis);
            }}
            className="text-blue-600 hover:text-blue-700"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
        
        {/* Error Display */}
        {analysis.error && (
          <div className="mt-2 text-xs text-red-600 truncate">
            Error: {analysis.error}
          </div>
        )}
      </div>
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
            className="text-gray-400 hover:text-gray-600"
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