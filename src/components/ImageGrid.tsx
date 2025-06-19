import React, { useState } from 'react';
import { ImageAnalysis } from '../types';
import { CheckCircle, AlertTriangle, XCircle, Eye, Download, Info } from 'lucide-react';
import { TechnicalQualityPanel } from './TechnicalQualityPanel';
import { VirtualizedImageGrid } from './VirtualizedImageGrid';
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

  const { filteredAnalyses, filterCounts } = useImageFiltering({
    analyses,
    filter,
    sortBy,
    threshold
  });

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
   * FIXED: Handles downloading recommended images
   */
  const handleDownloadRecommended = () => {
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
  };

  if (analyses.length === 0) return null;

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Header with Controls */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <h3 className="text-lg font-semibold text-gray-900">Image Analysis Results</h3>
            
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

        {/* Image Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAnalyses.map((analysis) => (
              <ImageCard
                key={analysis.id}
                analysis={analysis}
                threshold={threshold}
                onSelect={setSelectedImage}
                getQualityIcon={getQualityIcon}
              />
            ))}
          </div>
          
          {/* Empty State */}
          {filteredAnalyses.length === 0 && (
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
    </>
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
}

const ImageCard: React.FC<ImageCardProps> = ({ 
  analysis, 
  threshold, 
  onSelect, 
  getQualityIcon 
}) => {
  const isRecommended = (analysis.compositeScore?.overall || 0) >= threshold;
  const recommendation = analysis.compositeScore?.recommendation || 'unsuitable';

  return (
    <div
      className="group relative bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onSelect(analysis)}
    >
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