import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ImageAnalysis } from '../types';
import { CheckCircle, AlertTriangle, XCircle, Eye, Download, Info, ArrowLeftRight } from 'lucide-react';
import { TechnicalQualityPanel } from './TechnicalQualityPanel';
import { VirtualizedImageGrid } from './VirtualizedImageGrid';
import { ImageComparisonModal } from './ImageComparisonModal';
import { getRecommendationColor } from '../utils/compositeScoring';
import { useImageFiltering, FilterType, SortType } from '../hooks/useImageFiltering';

interface ImageGridProps {
  analyses: ImageAnalysis[];
  threshold: number;
}

export const ImageGrid: React.FC<ImageGridProps> = ({ analyses, threshold }) => {
  // For large batches (>50 images), use the virtualized grid with lazy loading
  // For smaller batches, use the original implementation for simplicity
  const shouldUseVirtualization = analyses.length > 50;

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
  const [selectedImage, setSelectedImage] = useState<ImageAnalysis | null>(null);
  const [selectedForComparison, setSelectedForComparison] = useState<ImageAnalysis[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const { filteredAnalyses, filterCounts } = useImageFiltering({
    analyses,
    filter,
    sortBy,
    threshold
  });

  // Enhanced keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showComparison) {
          setShowComparison(false);
        } else if (selectedImage) {
          setSelectedImage(null);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showComparison, selectedImage]);

  // Focus management for modals
  useEffect(() => {
    if ((selectedImage || showComparison) && modalRef.current) {
      const firstFocusable = modalRef.current.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') as HTMLElement;
      firstFocusable?.focus();
    }
  }, [selectedImage, showComparison]);

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

  /**
   * Handles downloading recommended images
   */
  const handleDownloadRecommended = useCallback(() => {
    const recommended = analyses.filter(a => (a.compositeScore?.overall || 0) >= threshold);
    console.log('Would download', recommended.length, 'recommended images');
    // TODO: Implement actual download functionality
  }, [analyses, threshold]);

  /**
   * Handles image selection for comparison
   */
  const toggleImageForComparison = useCallback((analysis: ImageAnalysis) => {
    setSelectedForComparison(prev => {
      const isSelected = prev.some(img => img.id === analysis.id);
      if (isSelected) {
        return prev.filter(img => img.id !== analysis.id);
      } else if (prev.length < 3) { // Limit to 3 images for comparison
        return [...prev, analysis];
      }
      return prev;
    });
  }, []);

  /**
   * Opens comparison modal
   */
  const openComparison = useCallback(() => {
    if (selectedForComparison.length >= 2) {
      setShowComparison(true);
    }
  }, [selectedForComparison.length]);

  /**
   * Clears comparison selection
   */
  const clearComparison = useCallback(() => {
    setSelectedForComparison([]);
  }, []);

  if (analyses.length === 0) return null;

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Enhanced Header with Controls */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Image Analysis Results</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {filteredAnalyses.length} of {analyses.length} images shown
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                {/* Enhanced Filter Dropdown */}
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as FilterType)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  <option value="all">All Images ({filterCounts.all})</option>
                  <option value="recommended">✓ Recommended ({filterCounts.recommended})</option>
                  <option value="not-recommended">✗ Not Recommended ({filterCounts.notRecommended})</option>
                </select>
                
                {/* Enhanced Sort Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortType)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  <option value="composite">Sort by Composite Score</option>
                  <option value="score">Sort by Blur Score</option>
                  <option value="name">Sort by Name</option>
                  <option value="quality">Sort by Quality</option>
                </select>
                
                {/* Enhanced Download Button */}
                <button
                  onClick={handleDownloadRecommended}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm hover:shadow-md"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Recommended
                </button>
              </div>
            </div>

            {/* Enhanced Comparison Controls */}
            {selectedForComparison.length > 0 && (
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <ArrowLeftRight className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-blue-900">
                      {selectedForComparison.length} image{selectedForComparison.length !== 1 ? 's' : ''} selected for comparison
                    </span>
                    <p className="text-xs text-blue-700 mt-1">
                      Select 2-3 images to compare quality metrics and technical details
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={openComparison}
                    disabled={selectedForComparison.length < 2}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                  >
                    <ArrowLeftRight className="w-4 h-4 mr-2" />
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

        {/* Enhanced Image Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAnalyses.map((analysis) => (
              <ImageCard
                key={analysis.id}
                analysis={analysis}
                threshold={threshold}
                onSelect={setSelectedImage}
                getQualityIcon={getQualityIcon}
                isSelectedForComparison={selectedForComparison.some(img => img.id === analysis.id)}
                onToggleComparison={toggleImageForComparison}
                comparisonDisabled={selectedForComparison.length >= 3 && !selectedForComparison.some(img => img.id === analysis.id)}
              />
            ))}
          </div>
          
          {/* Enhanced Empty State */}
          {filteredAnalyses.length === 0 && (
            <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No images match the current filter</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Try adjusting your filter settings or threshold to see more results.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Technical Quality Modal */}
      {selectedImage && (
        <div 
          ref={modalRef}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={(e) => e.target === e.currentTarget && setSelectedImage(null)}
        >
          <TechnicalQualityModal
            analysis={selectedImage}
            onClose={() => setSelectedImage(null)}
          />
        </div>
      )}

      {/* Enhanced Image Comparison Modal */}
      {showComparison && (
        <div 
          ref={modalRef}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={(e) => e.target === e.currentTarget && setShowComparison(false)}
        >
          <ImageComparisonModal
            images={selectedForComparison}
            onClose={() => setShowComparison(false)}
          />
        </div>
      )}
    </>
  );
};

/**
 * Enhanced Individual Image Card Component
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
      className={`group relative bg-white rounded-lg overflow-hidden border-2 transition-all duration-200 cursor-pointer ${
        isSelectedForComparison 
          ? 'border-blue-500 shadow-lg ring-2 ring-blue-200' 
          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
      }`}
      onClick={() => onSelect(analysis)}
    >
      {/* Enhanced Comparison Selection Checkbox */}
      <div className="absolute top-3 left-3 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!comparisonDisabled) {
              onToggleComparison(analysis);
            }
          }}
          disabled={comparisonDisabled}
          className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
            isSelectedForComparison
              ? 'bg-blue-600 border-blue-600 text-white shadow-md'
              : comparisonDisabled
              ? 'bg-gray-200 border-gray-300 cursor-not-allowed opacity-50'
              : 'bg-white border-gray-300 hover:border-blue-500 hover:bg-blue-50 shadow-sm'
          }`}
          title={comparisonDisabled ? 'Maximum 3 images for comparison' : 'Select for comparison'}
        >
          {isSelectedForComparison && <CheckCircle className="w-4 h-4" />}
        </button>
      </div>

      {/* Enhanced Image Thumbnail */}
      <div className="aspect-square relative bg-gray-100">
        {analysis.thumbnail ? (
          <img
            src={analysis.thumbnail}
            alt={analysis.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Eye className="w-8 h-8 text-gray-400" />
          </div>
        )}
        
        {/* Enhanced Quality Icon Overlay */}
        <div className="absolute top-3 right-3">
          <div className="p-1 bg-white rounded-full shadow-md">
            {getQualityIcon(recommendation)}
          </div>
        </div>
        
        {/* Enhanced Score Overlays */}
        <div className="absolute bottom-2 left-2 right-2 space-y-1">
          <div className="bg-black bg-opacity-80 text-white px-3 py-1 rounded-lg text-sm font-semibold backdrop-blur-sm">
            Overall: {analysis.compositeScore?.overall || 0}
          </div>
          <div className="bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs backdrop-blur-sm">
            Blur: {analysis.blurScore} | Exp: {analysis.exposureAnalysis?.exposureScore || 0} | Noise: {analysis.noiseAnalysis?.noiseScore || 0}
          </div>
        </div>
      </div>
      
      {/* Enhanced Card Content */}
      <div className="p-4 space-y-3">
        <h4 className="font-semibold text-gray-900 truncate text-base">
          {analysis.name}
        </h4>
        
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
            getRecommendationColor(recommendation)
          }`}>
            {recommendation}
          </span>
          <span className="text-xs text-gray-500 font-medium">
            {(analysis.size / 1024 / 1024).toFixed(1)} MB
          </span>
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className={`text-sm font-semibold ${
            isRecommended ? 'text-green-600' : 'text-red-600'
          }`}>
            {isRecommended ? '✓ Recommended' : '✗ Not Recommended'}
          </span>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(analysis);
            }}
            className="text-blue-600 hover:text-blue-700 transition-colors p-1 rounded hover:bg-blue-50"
            title="View technical details"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
        
        {/* Enhanced Error Display */}
        {analysis.error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            <strong>Error:</strong> {analysis.error}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Enhanced Technical Quality Modal Component
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
    <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
      <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{analysis.name}</h2>
          <p className="text-sm text-gray-600 mt-1">Technical Quality Analysis</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
          title="Close modal (Esc)"
        >
          <XCircle className="w-6 h-6" />
        </button>
      </div>
      <div className="p-6">
        <TechnicalQualityPanel analysis={analysis} />
      </div>
    </div>
  );
};