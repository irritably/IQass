/**
 * Custom React Hook for Image Filtering and Sorting
 * 
 * This hook manages the filtering and sorting logic for image analyses,
 * providing a clean separation of concerns from UI components.
 */

import { useMemo } from 'react';
import { ImageAnalysis } from '../types';

export type FilterType = 'all' | 'recommended' | 'not-recommended';
export type SortType = 'name' | 'score' | 'quality' | 'composite';

interface UseImageFilteringProps {
  analyses: ImageAnalysis[];
  filter: FilterType;
  sortBy: SortType;
  threshold: number;
}

/**
 * Custom hook for filtering and sorting image analyses
 * @param analyses - Array of image analyses to filter and sort
 * @param filter - Filter type to apply
 * @param sortBy - Sort criteria
 * @param threshold - Quality threshold for recommendations
 * @returns Filtered and sorted analyses
 */
export const useImageFiltering = ({
  analyses,
  filter,
  sortBy,
  threshold
}: UseImageFilteringProps) => {
  const filteredAndSortedAnalyses = useMemo(() => {
    // Apply filtering
    const filteredAnalyses = analyses.filter(analysis => {
      const compositeScore = analysis.compositeScore?.overall || 0;
      
      switch (filter) {
        case 'recommended':
          return compositeScore >= threshold;
        case 'not-recommended':
          return compositeScore < threshold;
        case 'all':
        default:
          return true;
      }
    });

    // Apply sorting
    const sortedAnalyses = [...filteredAnalyses].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'score':
          return b.blurScore - a.blurScore;
        case 'composite':
          return (b.compositeScore?.overall || 0) - (a.compositeScore?.overall || 0);
        case 'quality':
          const qualityOrder = { 
            excellent: 5, 
            good: 4, 
            acceptable: 3, 
            poor: 2, 
            unsuitable: 1 
          };
          const aQuality = a.compositeScore?.recommendation || 'unsuitable';
          const bQuality = b.compositeScore?.recommendation || 'unsuitable';
          return qualityOrder[bQuality as keyof typeof qualityOrder] - 
                 qualityOrder[aQuality as keyof typeof qualityOrder];
        default:
          return 0;
      }
    });

    return sortedAnalyses;
  }, [analyses, filter, sortBy, threshold]);

  // Calculate filter counts for UI display
  const filterCounts = useMemo(() => {
    const recommended = analyses.filter(a => (a.compositeScore?.overall || 0) >= threshold).length;
    const notRecommended = analyses.filter(a => (a.compositeScore?.overall || 0) < threshold).length;
    
    return {
      all: analyses.length,
      recommended,
      notRecommended
    };
  }, [analyses, threshold]);

  return {
    filteredAnalyses: filteredAndSortedAnalyses,
    filterCounts
  };
};