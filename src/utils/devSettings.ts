/**
 * Development Settings for Performance Analysis
 * 
 * This module provides comprehensive development tools for performance monitoring,
 * debugging, and optimization of the Drone Image Quality Analyzer.
 */

import React from 'react';

interface PerformanceConfig {
  enableProfiling: boolean;
  enableMemoryTracking: boolean;
  enableWebGLDebugging: boolean;
  enableBenchmarking: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  maxLogEntries: number;
  enablePerformanceObserver: boolean;
  enableResourceTiming: boolean;
}

interface MemorySnapshot {
  timestamp: number;
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  imageCount: number;
  operation: string;
}

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  metadata?: Record<string, any>;
}

class DevPerformanceAnalyzer {
  private config: PerformanceConfig;
  private memorySnapshots: MemorySnapshot[] = [];
  private performanceMetrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];
  private isEnabled: boolean;

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.isEnabled = process.env.NODE_ENV === 'development';
    
    this.config = {
      enableProfiling: true,
      enableMemoryTracking: true,
      enableWebGLDebugging: true,
      enableBenchmarking: true,
      logLevel: 'debug',
      maxLogEntries: 1000,
      enablePerformanceObserver: true,
      enableResourceTiming: true,
      ...config
    };

    if (this.isEnabled) {
      this.initializePerformanceObservers();
      this.setupMemoryTracking();
      this.setupWebGLDebugging();
    }
  }

  /**
   * Initialize Performance Observers for detailed metrics
   */
  private initializePerformanceObservers() {
    if (!this.config.enablePerformanceObserver || typeof PerformanceObserver === 'undefined') {
      return;
    }

    try {
      // Measure performance entries
      const measureObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.log('debug', 'Performance Measure', {
            name: entry.name,
            duration: entry.duration,
            startTime: entry.startTime
          });
        }
      });
      measureObserver.observe({ entryTypes: ['measure'] });
      this.observers.push(measureObserver);

      // Navigation timing
      const navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.log('info', 'Navigation Timing', {
            domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
            loadComplete: entry.loadEventEnd - entry.loadEventStart,
            totalTime: entry.loadEventEnd - entry.fetchStart
          });
        }
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navigationObserver);

      // Resource timing
      if (this.config.enableResourceTiming) {
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name.includes('blob:') || entry.name.includes('data:')) {
              this.log('debug', 'Resource Timing', {
                name: entry.name.substring(0, 50) + '...',
                duration: entry.duration,
                transferSize: (entry as any).transferSize,
                encodedBodySize: (entry as any).encodedBodySize
              });
            }
          }
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);
      }

    } catch (error) {
      this.log('warn', 'Failed to initialize Performance Observers', error);
    }
  }

  /**
   * Setup memory tracking with periodic snapshots
   */
  private setupMemoryTracking() {
    if (!this.config.enableMemoryTracking || !(performance as any).memory) {
      return;
    }

    // Take initial snapshot
    this.takeMemorySnapshot('initialization', 0);

    // Setup periodic memory monitoring
    setInterval(() => {
      this.takeMemorySnapshot('periodic', this.getCurrentImageCount());
    }, 10000); // Every 10 seconds
  }

  /**
   * Setup WebGL debugging and context monitoring
   */
  private setupWebGLDebugging() {
    if (!this.config.enableWebGLDebugging) return;

    // Monitor WebGL context creation
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(contextType: string, ...args: any[]) {
      const context = originalGetContext.call(this, contextType, ...args);
      
      if (contextType.includes('webgl') && context) {
        devAnalyzer.log('info', 'WebGL Context Created', {
          contextType,
          canvas: { width: this.width, height: this.height },
          extensions: devAnalyzer.getWebGLExtensions(context as WebGLRenderingContext)
        });
      }
      
      return context;
    };
  }

  /**
   * Take a memory snapshot
   */
  takeMemorySnapshot(operation: string, imageCount: number) {
    if (!this.config.enableMemoryTracking || !(performance as any).memory) {
      return;
    }

    const memory = (performance as any).memory;
    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      imageCount,
      operation
    };

    this.memorySnapshots.push(snapshot);
    
    // Keep only recent snapshots
    if (this.memorySnapshots.length > 100) {
      this.memorySnapshots = this.memorySnapshots.slice(-50);
    }

    this.log('debug', 'Memory Snapshot', {
      operation,
      usedMB: (snapshot.usedJSHeapSize / 1024 / 1024).toFixed(2),
      totalMB: (snapshot.totalJSHeapSize / 1024 / 1024).toFixed(2),
      imageCount
    });
  }

  /**
   * Start performance measurement
   */
  startMeasurement(name: string, metadata?: Record<string, any>): string {
    if (!this.isEnabled) return name;

    const measurementId = `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    if (this.config.enableProfiling) {
      performance.mark(`${measurementId}_start`);
    }

    this.performanceMetrics.push({
      name: measurementId,
      startTime: performance.now(),
      endTime: 0,
      duration: 0,
      metadata
    });

    return measurementId;
  }

  /**
   * End performance measurement
   */
  endMeasurement(measurementId: string): number {
    if (!this.isEnabled) return 0;

    const endTime = performance.now();
    const metric = this.performanceMetrics.find(m => m.name === measurementId);
    
    if (!metric) {
      this.log('warn', 'Measurement not found', { measurementId });
      return 0;
    }

    metric.endTime = endTime;
    metric.duration = endTime - metric.startTime;

    if (this.config.enableProfiling) {
      performance.mark(`${measurementId}_end`);
      performance.measure(measurementId, `${measurementId}_start`, `${measurementId}_end`);
    }

    this.log('debug', 'Performance Measurement', {
      name: metric.name.split('_')[0],
      duration: metric.duration.toFixed(2) + 'ms',
      metadata: metric.metadata
    });

    return metric.duration;
  }

  /**
   * Measure async function execution
   */
  async measureAsync<T>(
    name: string, 
    fn: () => Promise<T>, 
    metadata?: Record<string, any>
  ): Promise<{ result: T; duration: number }> {
    const measurementId = this.startMeasurement(name, metadata);
    
    try {
      const result = await fn();
      const duration = this.endMeasurement(measurementId);
      return { result, duration };
    } catch (error) {
      this.endMeasurement(measurementId);
      this.log('error', 'Async measurement failed', { name, error });
      throw error;
    }
  }

  /**
   * Get WebGL extensions for debugging
   */
  private getWebGLExtensions(gl: WebGLRenderingContext): string[] {
    const extensions: string[] = [];
    const supportedExtensions = gl.getSupportedExtensions();
    
    if (supportedExtensions) {
      extensions.push(...supportedExtensions);
    }
    
    return extensions;
  }

  /**
   * Get current image count (placeholder - should be connected to app state)
   */
  private getCurrentImageCount(): number {
    // This should be connected to the actual app state
    // For now, return 0 as placeholder
    return 0;
  }

  /**
   * Enhanced logging with levels and formatting
   */
  log(level: PerformanceConfig['logLevel'], message: string, data?: any) {
    if (!this.isEnabled) return;

    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    const configLevel = levels[this.config.logLevel];
    const messageLevel = levels[level];

    if (messageLevel < configLevel) return;

    const timestamp = new Date().toISOString();
    const prefix = `🔧 [DEV-PERF ${level.toUpperCase()}] ${timestamp}`;

    switch (level) {
      case 'debug':
        console.debug(prefix, message, data);
        break;
      case 'info':
        console.info(prefix, message, data);
        break;
      case 'warn':
        console.warn(prefix, message, data);
        break;
      case 'error':
        console.error(prefix, message, data);
        break;
    }
  }

  /**
   * Generate comprehensive performance report
   */
  generateReport(): PerformanceReport {
    const memoryStats = this.analyzeMemoryUsage();
    const performanceStats = this.analyzePerformanceMetrics();
    const webglStats = this.analyzeWebGLUsage();

    return {
      timestamp: new Date().toISOString(),
      memory: memoryStats,
      performance: performanceStats,
      webgl: webglStats,
      recommendations: this.generateRecommendations(memoryStats, performanceStats)
    };
  }

  /**
   * Analyze memory usage patterns
   */
  private analyzeMemoryUsage() {
    if (this.memorySnapshots.length === 0) {
      return { available: false };
    }

    const latest = this.memorySnapshots[this.memorySnapshots.length - 1];
    const initial = this.memorySnapshots[0];
    
    const memoryGrowth = latest.usedJSHeapSize - initial.usedJSHeapSize;
    const peakMemory = Math.max(...this.memorySnapshots.map(s => s.usedJSHeapSize));
    
    return {
      available: true,
      current: {
        used: latest.usedJSHeapSize,
        total: latest.totalJSHeapSize,
        limit: latest.jsHeapSizeLimit,
        usedMB: (latest.usedJSHeapSize / 1024 / 1024).toFixed(2),
        totalMB: (latest.totalJSHeapSize / 1024 / 1024).toFixed(2)
      },
      growth: {
        absolute: memoryGrowth,
        percentage: ((memoryGrowth / initial.usedJSHeapSize) * 100).toFixed(2),
        growthMB: (memoryGrowth / 1024 / 1024).toFixed(2)
      },
      peak: {
        value: peakMemory,
        valueMB: (peakMemory / 1024 / 1024).toFixed(2)
      },
      snapshots: this.memorySnapshots.length
    };
  }

  /**
   * Analyze performance metrics
   */
  private analyzePerformanceMetrics() {
    const completedMetrics = this.performanceMetrics.filter(m => m.duration > 0);
    
    if (completedMetrics.length === 0) {
      return { available: false };
    }

    const durations = completedMetrics.map(m => m.duration);
    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const maxDuration = Math.max(...durations);
    const minDuration = Math.min(...durations);

    // Group by operation type
    const operationGroups = completedMetrics.reduce((groups, metric) => {
      const operation = metric.name.split('_')[0];
      if (!groups[operation]) {
        groups[operation] = [];
      }
      groups[operation].push(metric.duration);
      return groups;
    }, {} as Record<string, number[]>);

    const operationStats = Object.entries(operationGroups).map(([operation, durations]) => ({
      operation,
      count: durations.length,
      avgDuration: (durations.reduce((sum, d) => sum + d, 0) / durations.length).toFixed(2),
      maxDuration: Math.max(...durations).toFixed(2),
      minDuration: Math.min(...durations).toFixed(2)
    }));

    return {
      available: true,
      overall: {
        totalMeasurements: completedMetrics.length,
        avgDuration: avgDuration.toFixed(2),
        maxDuration: maxDuration.toFixed(2),
        minDuration: minDuration.toFixed(2)
      },
      operations: operationStats
    };
  }

  /**
   * Analyze WebGL usage (placeholder)
   */
  private analyzeWebGLUsage() {
    return {
      available: true,
      contextsCreated: 0, // Would track actual WebGL context creation
      extensionsUsed: [], // Would track which extensions are being used
      shaderCompilations: 0 // Would track shader compilation count
    };
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(memoryStats: any, performanceStats: any): string[] {
    const recommendations: string[] = [];

    if (memoryStats.available) {
      const usedMB = parseFloat(memoryStats.current.usedMB);
      const growthMB = parseFloat(memoryStats.growth.growthMB);

      if (usedMB > 500) {
        recommendations.push('High memory usage detected (>500MB). Consider implementing lazy loading or reducing image batch sizes.');
      }

      if (growthMB > 100) {
        recommendations.push('Significant memory growth detected. Check for memory leaks in image processing or thumbnail generation.');
      }
    }

    if (performanceStats.available) {
      const slowOperations = performanceStats.operations.filter((op: any) => parseFloat(op.avgDuration) > 1000);
      
      if (slowOperations.length > 0) {
        recommendations.push(`Slow operations detected: ${slowOperations.map((op: any) => op.operation).join(', ')}. Consider WebGL acceleration or Web Workers.`);
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance looks good! No immediate optimizations needed.');
    }

    return recommendations;
  }

  /**
   * Export performance data for external analysis
   */
  exportData(): string {
    const data = {
      config: this.config,
      memorySnapshots: this.memorySnapshots,
      performanceMetrics: this.performanceMetrics.filter(m => m.duration > 0),
      report: this.generateReport()
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Cleanup observers and resources
   */
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.memorySnapshots = [];
    this.performanceMetrics = [];
  }
}

interface PerformanceReport {
  timestamp: string;
  memory: any;
  performance: any;
  webgl: any;
  recommendations: string[];
}

// Global instance
export const devAnalyzer = new DevPerformanceAnalyzer();

// Utility functions for easy integration
export const measurePerformance = {
  start: (name: string, metadata?: Record<string, any>) => devAnalyzer.startMeasurement(name, metadata),
  end: (measurementId: string) => devAnalyzer.endMeasurement(measurementId),
  async: <T>(name: string, fn: () => Promise<T>, metadata?: Record<string, any>) => 
    devAnalyzer.measureAsync(name, fn, metadata),
  memory: (operation: string, imageCount: number) => devAnalyzer.takeMemorySnapshot(operation, imageCount)
};

// React Hook for performance monitoring
export const usePerformanceMonitoring = () => {
  const [report, setReport] = React.useState<PerformanceReport | null>(null);

  const generateReport = React.useCallback(() => {
    const newReport = devAnalyzer.generateReport();
    setReport(newReport);
    return newReport;
  }, []);

  const exportData = React.useCallback(() => {
    return devAnalyzer.exportData();
  }, []);

  React.useEffect(() => {
    // Generate initial report
    const timer = setTimeout(() => {
      generateReport();
    }, 5000);

    return () => clearTimeout(timer);
  }, [generateReport]);

  return {
    report,
    generateReport,
    exportData,
    measurePerformance
  };
};

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    devAnalyzer.cleanup();
  });
}