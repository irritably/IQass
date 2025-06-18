/**
 * Lazy Loading Image Card Component
 * 
 * This component implements lazy loading for image thumbnails in the grid,
 * significantly reducing memory usage when handling large batches of images.
 */

import React, { useCallback } from 'react';
import { ImageAnalysis } from '../types';
import { CheckCircle, AlertTriangle, XCircle, Eye, Info, Image as ImageIcon } from 'lucide-react';
import { getRecommendationColor } from '../utils/compositeScoring';
import { useLazyLoading, useLazyImage } from '../hooks/useLazyLoading';

interface LazyImageCardProps {
  analysis: ImageAnalysis;
  threshold: number;
  onSelect: (analysis: ImageAnalysis) => void;
  getQualityIcon: (recommendation: string) => React.ReactNode;
}

export const LazyImageCard: React.FC<LazyImageCardProps> = ({ 
  analysis, 
  threshold, 
  onSelect, 
  getQualityIcon 
}) => {
  const isRecommended = (analysis.compositeScore?.overall || 0) >= threshold;
  const recommendation = analysis.compositeScore?.recommendation || 'unsuitable';

  // Lazy loading for the card container
  const { ref, shouldLoad } = useLazyLoading({
    rootMargin: '100px', // Start loading 100px before entering viewport
    threshold: 0.1,
    unloadOnExit: false // Keep loaded once loaded to avoid re-loading on scroll
  });

  // Lazy loading for the actual image
  const { loaded, loading, error, imageSrc } = useLazyImage(
    analysis.thumbnail, 
    shouldLoad && !!analysis.thumbnail
  );

  const handleCardClick = useCallback(() => {
    onSelect(analysis);
  }, [analysis, onSelect]);

  const handleInfoClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(analysis);
  }, [analysis, onSelect]);

  return (
    <div
      ref={ref}
      className="group relative bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Image Thumbnail */}
      <div className="aspect-square relative bg-gray-100">
        {shouldLoad ? (
          <>
            {loading && (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            
            {error && (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                <ImageIcon className="w-8 h-8 mb-2" />
                <span className="text-xs">Failed to load</span>
              </div>
            )}
            
            {loaded && imageSrc && (
              <img
                src={imageSrc}
                alt={analysis.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            )}
            
            {!analysis.thumbnail && (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Eye className="w-8 h-8" />
              </div>
            )}
          </>
        ) : (
          // Placeholder while not in viewport
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <ImageIcon className="w-8 h-8 text-gray-400" />
          </div>
        )}
        
        {/* Quality Icon Overlay */}
        <div className="absolute top-2 right-2">
          {getQualityIcon(recommendation)}
        </div>
        
        {/* Score Overlays - Only show when loaded */}
        {shouldLoad && (
          <div className="absolute bottom-2 left-2 right-2 space-y-1">
            <div className="bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs font-medium">
              Overall: {analysis.compositeScore?.overall || 0}
            </div>
            <div className="bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
              Blur: {analysis.blurScore} | Exp: {analysis.exposureAnalysis?.exposureScore || 0} | Noise: {analysis.noiseAnalysis?.noiseScore || 0}
            </div>
          </div>
        )}
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
            onClick={handleInfoClick}
            className="text-blue-600 hover:text-blue-700 transition-colors"
            aria-label={`View details for ${analysis.name}`}
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
        
        {/* Loading State Indicator */}
        {!shouldLoad && (
          <div className="mt-2 text-xs text-gray-500">
            Scroll to load preview
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Memory-efficient placeholder component for images not yet in viewport
 */
export const ImageCardPlaceholder: React.FC<{ analysis: ImageAnalysis }> = ({ analysis }) => {
  return (
    <div className="group relative bg-gray-50 rounded-lg overflow-hidden">
      <div className="aspect-square relative bg-gray-200 flex items-center justify-center">
        <ImageIcon className="w-8 h-8 text-gray-400" />
      </div>
      
      <div className="p-4">
        <h4 className="font-medium text-gray-900 truncate mb-2">
          {analysis.name}
        </h4>
        
        <div className="flex items-center justify-between mb-2">
          <div className="w-16 h-5 bg-gray-200 rounded animate-pulse" />
          <span className="text-xs text-gray-500">
            {(analysis.size / 1024 / 1024).toFixed(1)} MB
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
          <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
};