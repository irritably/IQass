/**
 * Image Analysis Manager Hook
 * 
 * Custom React hook that manages the core image analysis state and logic,
 * extracting it from App.tsx to improve separation of concerns and reusability.
 */

import { useState, useCallback, useMemo } from 'react';
import { ImageAnalysis, ProcessingProgress, AnalysisStats } from '../types';
import { analyzeImage } from '../utils/imageAnalysis';
import { calculateQualityStatistics } from '../utils/qualityAssessment';
import { CONFIG } from '../config';

export const useImageAnalysisManager = () => {
  // Core state management
  const [analyses, setAnalyses] = useState<ImageAnalysis[]>([]);
  const [progress, setProgress] = useState<ProcessingProgress>({
    current: 0,
    total: 0,
    isProcessing: false
  });
  const [threshold, setThreshold] = useState(CONFIG.QUALITY.DEFAULT_THRESHOLD);

  /**
   * Calculates comprehensive statistics for all analyzed images
   */
  const calculateStats = useCallback((analyses: ImageAnalysis[]): AnalysisStats => {
    const baseStats = calculateQualityStatistics(analyses, threshold);
    
    // Calculate additional metrics for the stats overview
    const averageExposureScore = analyses.length > 0
      ? analyses.reduce((sum, a) => sum + (a.exposureAnalysis?.exposureScore || 0), 0) / analyses.length
      : 0;
    
    const averageNoiseScore = analyses.length > 0
      ? analyses.reduce((sum, a) => sum + (a.noiseAnalysis?.noiseScore || 0), 0) / analyses.length
      : 0;

    return {
      ...baseStats,
      averageExposureScore,
      averageNoiseScore,
      cameraStats: {}, // TODO: Implement camera statistics aggregation
      qualityDistribution: {
        excellent: baseStats.excellentCount,
        good: baseStats.goodCount,
        acceptable: baseStats.acceptableCount,
        poor: baseStats.poorCount,
        unsuitable: baseStats.unsuitableCount
      }
    };
  }, [threshold]);

  /**
   * Handles file selection and processes images sequentially
   */
  const handleFilesSelected = useCallback(async (files: File[]) => {
    setProgress({
      current: 0,
      total: files.length,
      isProcessing: true,
      startTime: Date.now()
    });

    const newAnalyses: ImageAnalysis[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Update progress with current image info
      setProgress(prev => ({
        ...prev,
        current: i,
        currentImageName: file.name,
        currentStep: 1,
        currentStepName: 'Loading image...',
        currentImageProgress: 0
      }));

      try {
        const analysis = await analyzeImage(file);
        newAnalyses.push(analysis);
      } catch (error) {
        // Create error analysis if processing fails
        newAnalyses.push({
          id: Math.random().toString(36).substr(2, 9),
          file,
          name: file.name,
          size: file.size,
          blurScore: 0,
          quality: 'unsuitable',
          thumbnail: '',
          processed: true,
          error: 'Analysis failed'
        });
      }

      // Update progress
      setProgress(prev => ({
        ...prev,
        current: i + 1,
        currentImageProgress: 100
      }));

      // Update analyses incrementally for better UX
      setAnalyses(prev => [...prev, ...newAnalyses.slice(i, i + 1)]);
    }

    // Mark processing as complete
    setProgress(prev => ({
      ...prev,
      isProcessing: false,
      currentImageName: undefined,
      currentStep: undefined,
      currentStepName: undefined,
      currentImageProgress: undefined
    }));
  }, []);

  /**
   * Handles threshold changes with validation
   */
  const handleThresholdChange = useCallback((newThreshold: number) => {
    const clampedThreshold = Math.max(
      CONFIG.QUALITY.MIN_THRESHOLD,
      Math.min(CONFIG.QUALITY.MAX_THRESHOLD, newThreshold)
    );
    setThreshold(clampedThreshold);
  }, []);

  /**
   * Clears all analyses and resets state
   */
  const clearAnalyses = useCallback(() => {
    setAnalyses([]);
    setProgress({
      current: 0,
      total: 0,
      isProcessing: false
    });
  }, []);

  /**
   * Removes a specific analysis
   */
  const removeAnalysis = useCallback((analysisId: string) => {
    setAnalyses(prev => prev.filter(analysis => analysis.id !== analysisId));
  }, []);

  // Calculate stats for current analyses
  const stats = useMemo(() => calculateStats(analyses), [analyses, calculateStats]);

  // Return all state and handlers
  return {
    // State
    analyses,
    progress,
    threshold,
    stats,
    
    // Handlers
    handleFilesSelected,
    handleThresholdChange,
    clearAnalyses,
    removeAnalysis,
    
    // Computed values
    isProcessing: progress.isProcessing,
    hasAnalyses: analyses.length > 0,
    recommendedCount: analyses.filter(a => (a.compositeScore?.overall || 0) >= threshold).length,
  };
};