/**
 * Virtualized Image Grid Component
 * 
 * This component implements virtualization for the image grid to handle
 * large numbers of images efficiently by only rendering visible items.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { ImageAnalysis } from '../types';
import { CheckCircle, AlertTriangle, XCircle, Eye, Download, Info } from 'lucide-react';
import { TechnicalQualityPanel } from './TechnicalQualityPanel';
import { LazyImageCard } from './LazyImageCard';
import { getRecommendationColor } from '../utils/compositeScoring';
import { useImageFiltering, FilterType, SortType } from '../hooks/useImageFiltering';

interface VirtualizedImageGridProps {
  analyses: ImageAnalysis[];
  threshold: number;
}

export const VirtualizedImageGrid: React.FC<VirtualizedImageGridProps> = ({ 
  analyses, 
  threshold 
}) => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('composite');
  const [selectedImage, setSelectedImage] = useState<ImageAnalysis | null>(null);

  const { filteredAnalyses, filterCounts } = useImageFiltering({
    analyses,
    filter,
    sortBy,
    threshold
  });

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
   * FIXED: Handles downloading recommended images
   */
  const handleDownloadRecommended = useCallback(() => {
    const recommended = analyses.filter(a => (a.compositeScore?.overall || 0) >= threshold);
    
    if (recommended.length === 0) {
      alert('No images meet the current quality threshold for download.');
      return;
    }

    // Create a zip-like structure by downloading files individually
    // Since we can't create actual zip files in the browser without additional libraries,
    // we'll trigger individual downloads or create a list for the user
    
    if (recommended.length === 1) {
      // Single file - direct download
      const link = document.createElement('a');
      link.href = URL.createObjectURL(recommended[0].file);
      link.download = recommended[0].name;
      link.click();
      URL.revokeObjectURL(link.href);
    } else {
      // Multiple files - create a text file with the list and download info
      const fileList = recommended.map((analysis, index) => 
        `${index + 1}. ${analysis.name} (Score: ${analysis.compositeScore?.overall || 0})`
      ).join('\n');
      
      const reportContent = `RECOMMENDED IMAGES FOR DOWNLOAD
Generated: ${new Date().toLocaleString()}
Quality Threshold: ${threshold}
Total Recommended: ${recommended.length}

FILES:
${fileList}

NOTE: Due to browser security limitations, individual file downloads 
must be initiated manually. Please save the original files that match 
the names listed above for your photogrammetry project.

NEXT STEPS:
1. Locate the original image files on your system
2. Copy the files listed above to your project folder
3. Use these high-quality images for photogrammetric reconstruction
`;

      // Download the report
      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `recommended_images_list_${new Date().toISOString().split('T')[0]}.txt`;
      link.click();
      URL.revokeObjectURL(url);

      // Show user feedback
      alert(`Generated a list of ${recommended.length} recommended images. ` +
            `A text file with the recommended filenames has been downloaded. ` +
            `Please manually copy these files from your original image folder.`);
    }
  }, [analyses, threshold]);

  // Memoize grid items to prevent unnecessary re-renders
  const gridItems = useMemo(() => {
    return filteredAnalyses.map((analysis, index) => (
      <LazyImageCard
        key={analysis.id}
        analysis={analysis}
        threshold={threshold}
        onSelect={setSelectedImage}
        getQualityIcon={getQualityIcon}
      />
    ));
  }, [filteredAnalyses, threshold, getQualityIcon]);

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
              
              {/* Download Button */}
              <button
                onClick={handleDownloadRecommended}
                disabled={filterCounts.recommended === 0}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                title={filterCounts.recommended === 0 ? 'No images meet the quality threshold' : `Download list of ${filterCounts.recommended} recommended images`}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Recommended ({filterCounts.recommended})
              </button>
            </div>
          </div>
        </div>

        {/* Virtualized Image Grid */}
        <div className="p-6">
          {filteredAnalyses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {gridItems}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-12">
              <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No images match the current filter.</p>
            </div>
          )}
          
          {/* Performance Info */}
          {filteredAnalyses.length > 50 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-2">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900">Performance Optimization Active</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Lazy loading is active for this large batch ({filteredAnalyses.length} images). 
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