/**
 * Debug Utilities for Development
 * 
 * Comprehensive debugging tools for image processing, WebGL operations,
 * and performance analysis in development mode.
 */

import { ImageAnalysis } from '../types';

interface DebugConfig {
  enableImageDebugging: boolean;
  enableWebGLDebugging: boolean;
  enableAlgorithmDebugging: boolean;
  enableStateDebugging: boolean;
  logImageProcessingSteps: boolean;
  saveIntermediateResults: boolean;
}

interface ImageProcessingStep {
  stepName: string;
  timestamp: number;
  inputSize: { width: number; height: number };
  outputData?: any;
  duration: number;
  metadata?: Record<string, any>;
}

interface WebGLDebugInfo {
  contextInfo: {
    version: string;
    vendor: string;
    renderer: string;
    extensions: string[];
  };
  shaderCompilations: Array<{
    type: 'vertex' | 'fragment';
    source: string;
    success: boolean;
    error?: string;
    timestamp: number;
  }>;
  textureOperations: Array<{
    operation: 'create' | 'bind' | 'delete';
    size: { width: number; height: number };
    format: string;
    timestamp: number;
  }>;
}

class DebugManager {
  private config: DebugConfig;
  private isEnabled: boolean;
  private imageProcessingSteps: Map<string, ImageProcessingStep[]> = new Map();
  private webglDebugInfo: WebGLDebugInfo;
  private stateSnapshots: Array<{ timestamp: number; state: any }> = [];

  constructor(config: Partial<DebugConfig> = {}) {
    this.isEnabled = process.env.NODE_ENV === 'development';
    
    this.config = {
      enableImageDebugging: true,
      enableWebGLDebugging: true,
      enableAlgorithmDebugging: true,
      enableStateDebugging: true,
      logImageProcessingSteps: true,
      saveIntermediateResults: false,
      ...config
    };

    this.webglDebugInfo = {
      contextInfo: { version: '', vendor: '', renderer: '', extensions: [] },
      shaderCompilations: [],
      textureOperations: []
    };

    if (this.isEnabled) {
      this.setupGlobalDebugging();
    }
  }

  /**
   * Setup global debugging hooks
   */
  private setupGlobalDebugging() {
    // Add debug info to window for console access
    (window as any).debugManager = this;
    (window as any).debugUtils = {
      getImageSteps: (imageId: string) => this.getImageProcessingSteps(imageId),
      getWebGLInfo: () => this.getWebGLDebugInfo(),
      exportDebugData: () => this.exportDebugData(),
      analyzePerformance: () => this.analyzePerformanceBottlenecks()
    };

    console.log('🔧 Debug Manager initialized. Access via window.debugUtils');
  }

  /**
   * Log image processing step with detailed information
   */
  logImageProcessingStep(
    imageId: string,
    stepName: string,
    inputSize: { width: number; height: number },
    duration: number,
    outputData?: any,
    metadata?: Record<string, any>
  ) {
    if (!this.isEnabled || !this.config.logImageProcessingSteps) return;

    const step: ImageProcessingStep = {
      stepName,
      timestamp: Date.now(),
      inputSize,
      outputData: this.config.saveIntermediateResults ? outputData : undefined,
      duration,
      metadata
    };

    if (!this.imageProcessingSteps.has(imageId)) {
      this.imageProcessingSteps.set(imageId, []);
    }

    this.imageProcessingSteps.get(imageId)!.push(step);

    console.group(`🖼️ Image Processing: ${stepName}`);
    console.log(`Image ID: ${imageId}`);
    console.log(`Duration: ${duration.toFixed(2)}ms`);
    console.log(`Input Size: ${inputSize.width}x${inputSize.height}`);
    if (metadata) {
      console.log('Metadata:', metadata);
    }
    console.groupEnd();
  }

  /**
   * Log WebGL operations for debugging
   */
  logWebGLOperation(
    operation: string,
    details: Record<string, any>,
    success: boolean,
    error?: string
  ) {
    if (!this.isEnabled || !this.config.enableWebGLDebugging) return;

    console.group(`🎮 WebGL: ${operation}`);
    console.log('Success:', success);
    console.log('Details:', details);
    if (error) {
      console.error('Error:', error);
    }
    console.groupEnd();
  }

  /**
   * Log shader compilation with source code
   */
  logShaderCompilation(
    type: 'vertex' | 'fragment',
    source: string,
    success: boolean,
    error?: string
  ) {
    if (!this.isEnabled || !this.config.enableWebGLDebugging) return;

    const compilation = {
      type,
      source,
      success,
      error,
      timestamp: Date.now()
    };

    this.webglDebugInfo.shaderCompilations.push(compilation);

    console.group(`🔧 Shader Compilation: ${type}`);
    console.log('Success:', success);
    if (error) {
      console.error('Compilation Error:', error);
      console.log('Shader Source:');
      console.log(source);
    }
    console.groupEnd();
  }

  /**
   * Capture application state snapshot
   */
  captureStateSnapshot(label: string, state: any) {
    if (!this.isEnabled || !this.config.enableStateDebugging) return;

    const snapshot = {
      timestamp: Date.now(),
      label,
      state: JSON.parse(JSON.stringify(state)) // Deep clone
    };

    this.stateSnapshots.push(snapshot);

    // Keep only recent snapshots
    if (this.stateSnapshots.length > 50) {
      this.stateSnapshots = this.stateSnapshots.slice(-25);
    }

    console.log(`📸 State Snapshot: ${label}`, snapshot);
  }

  /**
   * Analyze algorithm performance and bottlenecks
   */
  analyzeAlgorithmPerformance(
    algorithmName: string,
    inputSize: number,
    duration: number,
    metadata?: Record<string, any>
  ) {
    if (!this.isEnabled || !this.config.enableAlgorithmDebugging) return;

    const pixelsPerMs = inputSize / duration;
    const efficiency = this.categorizeEfficiency(pixelsPerMs);

    console.group(`⚡ Algorithm Performance: ${algorithmName}`);
    console.log(`Duration: ${duration.toFixed(2)}ms`);
    console.log(`Input Size: ${inputSize.toLocaleString()} pixels`);
    console.log(`Throughput: ${pixelsPerMs.toFixed(0)} pixels/ms`);
    console.log(`Efficiency: ${efficiency}`);
    if (metadata) {
      console.log('Additional Info:', metadata);
    }
    console.groupEnd();

    // Suggest optimizations for slow algorithms
    if (efficiency === 'Poor' || efficiency === 'Very Poor') {
      console.warn(`💡 Optimization Suggestion for ${algorithmName}:`);
      console.warn('Consider WebGL acceleration or algorithm optimization');
    }
  }

  /**
   * Categorize algorithm efficiency
   */
  private categorizeEfficiency(pixelsPerMs: number): string {
    if (pixelsPerMs > 10000) return 'Excellent';
    if (pixelsPerMs > 5000) return 'Good';
    if (pixelsPerMs > 1000) return 'Fair';
    if (pixelsPerMs > 500) return 'Poor';
    return 'Very Poor';
  }

  /**
   * Get image processing steps for a specific image
   */
  getImageProcessingSteps(imageId: string): ImageProcessingStep[] {
    return this.imageProcessingSteps.get(imageId) || [];
  }

  /**
   * Get WebGL debug information
   */
  getWebGLDebugInfo(): WebGLDebugInfo {
    return this.webglDebugInfo;
  }

  /**
   * Analyze performance bottlenecks across all operations
   */
  analyzePerformanceBottlenecks() {
    const allSteps: ImageProcessingStep[] = [];
    
    for (const steps of this.imageProcessingSteps.values()) {
      allSteps.push(...steps);
    }

    if (allSteps.length === 0) {
      console.log('No performance data available');
      return;
    }

    // Group by step name
    const stepGroups = allSteps.reduce((groups, step) => {
      if (!groups[step.stepName]) {
        groups[step.stepName] = [];
      }
      groups[step.stepName].push(step);
      return groups;
    }, {} as Record<string, ImageProcessingStep[]>);

    console.group('📊 Performance Bottleneck Analysis');
    
    Object.entries(stepGroups).forEach(([stepName, steps]) => {
      const durations = steps.map(s => s.duration);
      const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      const maxDuration = Math.max(...durations);
      const totalDuration = durations.reduce((sum, d) => sum + d, 0);

      console.log(`${stepName}:`);
      console.log(`  Count: ${steps.length}`);
      console.log(`  Avg Duration: ${avgDuration.toFixed(2)}ms`);
      console.log(`  Max Duration: ${maxDuration.toFixed(2)}ms`);
      console.log(`  Total Time: ${totalDuration.toFixed(2)}ms`);
      console.log(`  % of Total: ${((totalDuration / allSteps.reduce((sum, s) => sum + s.duration, 0)) * 100).toFixed(1)}%`);
    });

    console.groupEnd();

    // Identify bottlenecks
    const bottlenecks = Object.entries(stepGroups)
      .map(([stepName, steps]) => ({
        stepName,
        avgDuration: steps.reduce((sum, s) => sum + s.duration, 0) / steps.length,
        totalTime: steps.reduce((sum, s) => sum + s.duration, 0)
      }))
      .sort((a, b) => b.totalTime - a.totalTime)
      .slice(0, 3);

    console.warn('🚨 Top Performance Bottlenecks:');
    bottlenecks.forEach((bottleneck, index) => {
      console.warn(`${index + 1}. ${bottleneck.stepName}: ${bottleneck.totalTime.toFixed(2)}ms total`);
    });
  }

  /**
   * Export all debug data for external analysis
   */
  exportDebugData(): string {
    const debugData = {
      timestamp: new Date().toISOString(),
      config: this.config,
      imageProcessingSteps: Object.fromEntries(this.imageProcessingSteps),
      webglDebugInfo: this.webglDebugInfo,
      stateSnapshots: this.stateSnapshots,
      performanceAnalysis: this.generatePerformanceAnalysis()
    };

    return JSON.stringify(debugData, null, 2);
  }

  /**
   * Generate comprehensive performance analysis
   */
  private generatePerformanceAnalysis() {
    const allSteps: ImageProcessingStep[] = [];
    
    for (const steps of this.imageProcessingSteps.values()) {
      allSteps.push(...steps);
    }

    if (allSteps.length === 0) {
      return { available: false };
    }

    const stepGroups = allSteps.reduce((groups, step) => {
      if (!groups[step.stepName]) {
        groups[step.stepName] = [];
      }
      groups[step.stepName].push(step);
      return groups;
    }, {} as Record<string, ImageProcessingStep[]>);

    const analysis = Object.entries(stepGroups).map(([stepName, steps]) => {
      const durations = steps.map(s => s.duration);
      const inputSizes = steps.map(s => s.inputSize.width * s.inputSize.height);
      
      return {
        stepName,
        count: steps.length,
        avgDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
        maxDuration: Math.max(...durations),
        minDuration: Math.min(...durations),
        totalDuration: durations.reduce((sum, d) => sum + d, 0),
        avgInputSize: inputSizes.reduce((sum, s) => sum + s, 0) / inputSizes.length,
        avgThroughput: inputSizes.reduce((sum, size, i) => sum + (size / durations[i]), 0) / steps.length
      };
    });

    return {
      available: true,
      totalSteps: allSteps.length,
      uniqueOperations: Object.keys(stepGroups).length,
      analysis: analysis.sort((a, b) => b.totalDuration - a.totalDuration)
    };
  }

  /**
   * Clear all debug data
   */
  clearDebugData() {
    this.imageProcessingSteps.clear();
    this.webglDebugInfo.shaderCompilations = [];
    this.webglDebugInfo.textureOperations = [];
    this.stateSnapshots = [];
    console.log('🧹 Debug data cleared');
  }
}

// Global debug manager instance
export const debugManager = new DebugManager();

// Utility functions for easy integration
export const debugUtils = {
  logImageStep: (imageId: string, stepName: string, inputSize: { width: number; height: number }, duration: number, outputData?: any, metadata?: Record<string, any>) =>
    debugManager.logImageProcessingStep(imageId, stepName, inputSize, duration, outputData, metadata),
  
  logWebGL: (operation: string, details: Record<string, any>, success: boolean, error?: string) =>
    debugManager.logWebGLOperation(operation, details, success, error),
  
  logShader: (type: 'vertex' | 'fragment', source: string, success: boolean, error?: string) =>
    debugManager.logShaderCompilation(type, source, success, error),
  
  captureState: (label: string, state: any) =>
    debugManager.captureStateSnapshot(label, state),
  
  analyzeAlgorithm: (algorithmName: string, inputSize: number, duration: number, metadata?: Record<string, any>) =>
    debugManager.analyzeAlgorithmPerformance(algorithmName, inputSize, duration, metadata),
  
  exportData: () => debugManager.exportDebugData(),
  
  clear: () => debugManager.clearDebugData()
};

// React Hook for debug information
export const useDebugInfo = () => {
  const [debugData, setDebugData] = React.useState<any>(null);

  const refreshDebugData = React.useCallback(() => {
    const data = {
      performanceAnalysis: debugManager['generatePerformanceAnalysis'](),
      webglInfo: debugManager.getWebGLDebugInfo(),
      stateSnapshots: debugManager['stateSnapshots'].length
    };
    setDebugData(data);
  }, []);

  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      refreshDebugData();
      
      // Refresh every 10 seconds
      const interval = setInterval(refreshDebugData, 10000);
      return () => clearInterval(interval);
    }
  }, [refreshDebugData]);

  return {
    debugData,
    refreshDebugData,
    exportData: debugUtils.exportData,
    clearData: debugUtils.clear
  };
};

// Development console commands
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  (window as any).debug = debugUtils;
  console.log('🔧 Debug utilities available via window.debug');
  console.log('Available commands:');
  console.log('  debug.exportData() - Export all debug data');
  console.log('  debug.clear() - Clear debug data');
  console.log('  debugUtils.analyzePerformance() - Analyze performance bottlenecks');
}