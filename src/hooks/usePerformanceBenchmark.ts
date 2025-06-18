/**
 * Performance Benchmarking Hook
 * 
 * Enhanced hook that provides both internal benchmarking capabilities
 * and user-facing performance insights and controls.
 */

import { useState, useCallback, useRef, useMemo } from 'react';
import { benchmarkOperation, getPerformanceStats } from '../utils/webglProcessing';
import { CONFIG } from '../config';

interface BenchmarkResult {
  operation: string;
  cpuTime: number;
  gpuTime: number;
  speedup: number;
  recommendation: 'cpu' | 'gpu';
  imageSize: number;
  timestamp: number;
}

interface UseBenchmarkOptions {
  enableLogging?: boolean;
  sampleSize?: number;
  autoOptimize?: boolean;
}

interface PerformancePreferences {
  processingMode: 'auto' | 'cpu' | 'gpu';
  enableGpuAcceleration: boolean;
  showPerformanceIndicators: boolean;
  enableBenchmarkHistory: boolean;
}

interface UserFacingPerformanceStats {
  totalBenchmarks: number;
  averageSpeedup: number;
  averageGpuTime: number;
  averageCpuTime: number;
  gpuRecommendationRate: number;
  operationBreakdown: Record<string, {
    count: number;
    avgSpeedup: number;
    recommendation: 'cpu' | 'gpu';
  }>;
}

export const usePerformanceBenchmark = (options: UseBenchmarkOptions = {}) => {
  const {
    enableLogging = CONFIG.BENCHMARK.ENABLE_LOGGING,
    sampleSize = CONFIG.BENCHMARK.SAMPLE_SIZE,
    autoOptimize = CONFIG.BENCHMARK.AUTO_OPTIMIZE
  } = options;

  // Core benchmarking state
  const [benchmarkResults, setBenchmarkResults] = useState<BenchmarkResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const benchmarkCache = useRef<Map<string, BenchmarkResult>>(new Map());

  // User-facing state
  const [preferences, setPreferences] = useState<PerformancePreferences>({
    processingMode: 'auto',
    enableGpuAcceleration: true,
    showPerformanceIndicators: true,
    enableBenchmarkHistory: true
  });

  /**
   * Runs a performance benchmark comparing CPU and GPU implementations
   */
  const runBenchmark = useCallback(async <T>(
    operation: string,
    cpuFunction: () => Promise<T> | T,
    gpuFunction: () => Promise<T> | T,
    imageSize: number
  ): Promise<{ result: T; benchmark: BenchmarkResult }> => {
    setIsRunning(true);

    try {
      const { result, benchmark } = await benchmarkOperation(
        operation,
        cpuFunction,
        gpuFunction,
        imageSize
      );

      const benchmarkResult: BenchmarkResult = {
        operation,
        cpuTime: benchmark.cpuTime,
        gpuTime: benchmark.gpuTime,
        speedup: benchmark.speedup,
        recommendation: benchmark.speedup > 1.2 ? 'gpu' : 'cpu',
        imageSize,
        timestamp: Date.now()
      };

      // Cache result for similar image sizes
      const cacheKey = `${operation}_${Math.floor(imageSize / 10000)}`;
      benchmarkCache.current.set(cacheKey, benchmarkResult);

      // Update state if history is enabled
      if (preferences.enableBenchmarkHistory) {
        setBenchmarkResults(prev => [...prev.slice(-sampleSize + 1), benchmarkResult]);
      }

      if (enableLogging) {
        console.group(`🔬 Performance Benchmark: ${operation}`);
        console.log(`Image Size: ${imageSize.toLocaleString()} pixels`);
        console.log(`CPU Time: ${benchmark.cpuTime.toFixed(2)}ms`);
        console.log(`GPU Time: ${benchmark.gpuTime.toFixed(2)}ms`);
        console.log(`Speedup: ${benchmark.speedup.toFixed(2)}x`);
        console.log(`Recommendation: Use ${benchmarkResult.recommendation.toUpperCase()}`);
        console.groupEnd();
      }

      return { result, benchmark: benchmarkResult };
    } finally {
      setIsRunning(false);
    }
  }, [enableLogging, sampleSize, preferences.enableBenchmarkHistory]);

  /**
   * Gets recommendation for whether to use GPU or CPU based on historical data
   */
  const getRecommendation = useCallback((operation: string, imageSize: number): 'cpu' | 'gpu' | 'unknown' => {
    // Respect user preferences
    if (preferences.processingMode === 'cpu') return 'cpu';
    if (preferences.processingMode === 'gpu') return 'gpu';

    // Check cache first
    const cacheKey = `${operation}_${Math.floor(imageSize / 10000)}`;
    const cached = benchmarkCache.current.get(cacheKey);
    if (cached) {
      return cached.recommendation;
    }

    // Check recent benchmarks for similar operations
    const recentBenchmarks = benchmarkResults
      .filter(b => b.operation === operation)
      .slice(-3); // Last 3 benchmarks

    if (recentBenchmarks.length === 0) {
      return 'unknown';
    }

    // Calculate average speedup for similar image sizes
    const similarSizeBenchmarks = recentBenchmarks.filter(b => 
      Math.abs(b.imageSize - imageSize) / imageSize < 0.5 // Within 50% of image size
    );

    if (similarSizeBenchmarks.length === 0) {
      // Use overall average if no similar sizes
      const avgSpeedup = recentBenchmarks.reduce((sum, b) => sum + b.speedup, 0) / recentBenchmarks.length;
      return avgSpeedup > 1.2 ? 'gpu' : 'cpu';
    }

    const avgSpeedup = similarSizeBenchmarks.reduce((sum, b) => sum + b.speedup, 0) / similarSizeBenchmarks.length;
    return avgSpeedup > 1.2 ? 'gpu' : 'cpu';
  }, [benchmarkResults, preferences.processingMode]);

  /**
   * Gets comprehensive performance statistics for user display
   */
  const getStats = useCallback((): { global: any; local: UserFacingPerformanceStats } | null => {
    const globalStats = getPerformanceStats();
    
    if (benchmarkResults.length === 0) {
      return globalStats ? { global: globalStats, local: {
        totalBenchmarks: 0,
        averageSpeedup: 0,
        averageGpuTime: 0,
        averageCpuTime: 0,
        gpuRecommendationRate: 0,
        operationBreakdown: {}
      }} : null;
    }

    const localStats: UserFacingPerformanceStats = {
      totalBenchmarks: benchmarkResults.length,
      averageSpeedup: benchmarkResults.reduce((sum, b) => sum + b.speedup, 0) / benchmarkResults.length,
      averageGpuTime: benchmarkResults.reduce((sum, b) => sum + b.gpuTime, 0) / benchmarkResults.length,
      averageCpuTime: benchmarkResults.reduce((sum, b) => sum + b.cpuTime, 0) / benchmarkResults.length,
      gpuRecommendationRate: (benchmarkResults.filter(b => b.recommendation === 'gpu').length / benchmarkResults.length) * 100,
      operationBreakdown: benchmarkResults.reduce((acc, b) => {
        if (!acc[b.operation]) {
          acc[b.operation] = { count: 0, avgSpeedup: 0, recommendation: 'cpu' as const };
        }
        acc[b.operation].count++;
        acc[b.operation].avgSpeedup = (acc[b.operation].avgSpeedup * (acc[b.operation].count - 1) + b.speedup) / acc[b.operation].count;
        acc[b.operation].recommendation = acc[b.operation].avgSpeedup > 1.2 ? 'gpu' : 'cpu';
        return acc;
      }, {} as Record<string, { count: number; avgSpeedup: number; recommendation: 'cpu' | 'gpu' }>)
    };

    return {
      global: globalStats,
      local: localStats
    };
  }, [benchmarkResults]);

  /**
   * Clears benchmark history
   */
  const clearBenchmarks = useCallback(() => {
    setBenchmarkResults([]);
    benchmarkCache.current.clear();
  }, []);

  /**
   * Auto-optimization utility that chooses the best implementation
   */
  const optimizedExecution = useCallback(async <T>(
    operation: string,
    cpuFunction: () => Promise<T> | T,
    gpuFunction: () => Promise<T> | T,
    imageSize: number,
    forceBenchmark: boolean = false
  ): Promise<T> => {
    if (!autoOptimize && !forceBenchmark) {
      // Default to CPU if auto-optimization is disabled
      return await cpuFunction();
    }

    const recommendation = getRecommendation(operation, imageSize);

    if (recommendation === 'unknown' || forceBenchmark) {
      // Run benchmark to determine best approach
      const { result } = await runBenchmark(operation, cpuFunction, gpuFunction, imageSize);
      return result;
    }

    // Use cached recommendation
    if (recommendation === 'gpu' && preferences.enableGpuAcceleration) {
      try {
        return await gpuFunction();
      } catch (error) {
        if (enableLogging) {
          console.warn(`GPU execution failed for ${operation}, falling back to CPU:`, error);
        }
        return await cpuFunction();
      }
    } else {
      return await cpuFunction();
    }
  }, [autoOptimize, getRecommendation, runBenchmark, enableLogging, preferences.enableGpuAcceleration]);

  /**
   * Updates user preferences
   */
  const updatePreferences = useCallback((newPreferences: Partial<PerformancePreferences>) => {
    setPreferences(prev => ({ ...prev, ...newPreferences }));
  }, []);

  /**
   * Gets current performance status for UI indicators
   */
  const getCurrentPerformanceStatus = useCallback(() => {
    const stats = getStats();
    const recentBenchmark = benchmarkResults[benchmarkResults.length - 1];
    
    return {
      isGpuAccelerated: preferences.enableGpuAcceleration && recentBenchmark?.recommendation === 'gpu',
      averageSpeedup: stats?.local.averageSpeedup || 0,
      processingMode: preferences.processingMode,
      showIndicators: preferences.showPerformanceIndicators
    };
  }, [benchmarkResults, preferences, getStats]);

  /**
   * Exports benchmark data for user download
   */
  const exportBenchmarkData = useCallback(() => {
    const data = {
      benchmarkResults,
      preferences,
      stats: getStats(),
      exportDate: new Date().toISOString(),
      version: '1.0'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `performance-benchmark-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [benchmarkResults, preferences, getStats]);

  return {
    // Core benchmarking
    runBenchmark,
    getRecommendation,
    optimizedExecution,
    
    // State
    benchmarkResults,
    isRunning,
    preferences,
    
    // User-facing utilities
    getStats,
    clearBenchmarks,
    updatePreferences,
    getCurrentPerformanceStatus,
    exportBenchmarkData,
    
    // Configuration
    enableLogging,
    autoOptimize
  };
};

/**
 * Hook for simple performance timing
 */
export const usePerformanceTimer = () => {
  const [timings, setTimings] = useState<Record<string, number>>({});

  const time = useCallback(async <T>(
    label: string,
    fn: () => Promise<T> | T
  ): Promise<T> => {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    const duration = end - start;

    setTimings(prev => ({ ...prev, [label]: duration }));

    if (CONFIG.BENCHMARK.ENABLE_LOGGING) {
      console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
    }

    return result;
  }, []);

  const getLastTiming = useCallback((label: string) => timings[label], [timings]);
  const getAllTimings = useCallback(() => timings, [timings]);
  const clearTimings = useCallback(() => setTimings({}), []);

  return {
    time,
    getLastTiming,
    getAllTimings,
    clearTimings,
    timings
  };
};