/**
 * Performance Benchmarking Hook
 * 
 * This hook provides utilities for benchmarking CPU vs GPU performance
 * and making intelligent decisions about which processing method to use.
 */

import { useState, useCallback, useRef } from 'react';
import { benchmarkOperation, getPerformanceStats } from '../utils/webglProcessing';
import { CONFIG } from '../config';

interface BenchmarkResult {
  operation: string;
  cpuTime: number;
  gpuTime: number;
  speedup: number;
  recommendation: 'cpu' | 'gpu';
  imageSize: number;
}

interface UseBenchmarkOptions {
  enableLogging?: boolean;
  sampleSize?: number;
  autoOptimize?: boolean;
}

export const usePerformanceBenchmark = (options: UseBenchmarkOptions = {}) => {
  const {
    enableLogging = CONFIG.BENCHMARK.ENABLE_LOGGING,
    sampleSize = CONFIG.BENCHMARK.SAMPLE_SIZE,
    autoOptimize = CONFIG.BENCHMARK.AUTO_OPTIMIZE
  } = options;

  const [benchmarkResults, setBenchmarkResults] = useState<BenchmarkResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const benchmarkCache = useRef<Map<string, BenchmarkResult>>(new Map());

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
        imageSize
      };

      // Cache result for similar image sizes
      const cacheKey = `${operation}_${Math.floor(imageSize / 10000)}`;
      benchmarkCache.current.set(cacheKey, benchmarkResult);

      // Update state
      setBenchmarkResults(prev => [...prev.slice(-sampleSize + 1), benchmarkResult]);

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
  }, [enableLogging, sampleSize]);

  /**
   * Gets recommendation for whether to use GPU or CPU based on historical data
   */
  const getRecommendation = useCallback((operation: string, imageSize: number): 'cpu' | 'gpu' | 'unknown' => {
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
  }, [benchmarkResults]);

  /**
   * Gets comprehensive performance statistics
   */
  const getStats = useCallback(() => {
    const globalStats = getPerformanceStats();
    const localStats = {
      totalBenchmarks: benchmarkResults.length,
      averageSpeedup: benchmarkResults.length > 0 
        ? benchmarkResults.reduce((sum, b) => sum + b.speedup, 0) / benchmarkResults.length 
        : 0,
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
    if (recommendation === 'gpu') {
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
  }, [autoOptimize, getRecommendation, runBenchmark, enableLogging]);

  return {
    // Core benchmarking
    runBenchmark,
    getRecommendation,
    optimizedExecution,
    
    // State
    benchmarkResults,
    isRunning,
    
    // Utilities
    getStats,
    clearBenchmarks,
    
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