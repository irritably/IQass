/**
 * Enhanced Debug Visualization Modal Component
 * 
 * This component provides comprehensive visualization of shader outputs and noise analysis
 * for debugging and educational purposes, helping users understand the image analysis process.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ImageAnalysis } from '../types';
import { X, Eye, Zap, Target, Info, Download, Grid, Layers, AlertTriangle, Camera } from 'lucide-react';
import { generateDebugVisualization, getPerformanceStats } from '../utils/webglProcessing';

interface DebugVisualizationModalProps {
  analysis: ImageAnalysis;
  onClose: () => void;
}

type VisualizationType = 
  | 'original'
  | 'laplacian'
  | 'harris'
  | 'noise'
  | 'compression'
  | 'aberration'
  | 'vignetting';

export const DebugVisualizationModal: React.FC<DebugVisualizationModalProps> = ({
  analysis,
  onClose
}) => {
  const [activeVisualization, setActiveVisualization] = useState<VisualizationType>('original');
  const [visualizations, setVisualizations] = useState<Map<VisualizationType, string>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load original image
  useEffect(() => {
    if (analysis.thumbnail) {
      setVisualizations(prev => new Map(prev.set('original', analysis.thumbnail)));
    }
  }, [analysis.thumbnail]);

  const generateVisualization = useCallback(async (type: VisualizationType) => {
    if (type === 'original' || visualizations.has(type)) return;

    setLoading(true);
    setError(null);

    try {
      // Create ImageData from the original file
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');

      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = URL.createObjectURL(analysis.file);
      });

      // Resize for processing (limit to 800px for performance)
      const ratio = Math.min(800 / img.width, 800 / img.height, 1);
      canvas.width = Math.floor(img.width * ratio);
      canvas.height = Math.floor(img.height * ratio);

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Generate visualization
      const result = await generateDebugVisualization(imageData, type);
      if (!result) throw new Error('Failed to generate visualization');

      // Convert result back to data URL
      const resultCanvas = document.createElement('canvas');
      const resultCtx = resultCanvas.getContext('2d');
      if (!resultCtx) throw new Error('Failed to get result canvas context');

      resultCanvas.width = result.width;
      resultCanvas.height = result.height;
      resultCtx.putImageData(result, 0, 0);

      const dataUrl = resultCanvas.toDataURL('image/png');
      setVisualizations(prev => new Map(prev.set(type, dataUrl)));

      // Cleanup
      URL.revokeObjectURL(img.src);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate visualization');
    } finally {
      setLoading(false);
    }
  }, [analysis.file, visualizations]);

  const handleVisualizationChange = useCallback((type: VisualizationType) => {
    setActiveVisualization(type);
    if (type !== 'original') {
      generateVisualization(type);
    }
  }, [generateVisualization]);

  const downloadVisualization = useCallback(() => {
    const dataUrl = visualizations.get(activeVisualization);
    if (!dataUrl) return;

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${analysis.name}_${activeVisualization}_visualization.png`;
    link.click();
  }, [visualizations, activeVisualization, analysis.name]);

  const performanceStats = getPerformanceStats();

  const getVisualizationIcon = (type: VisualizationType) => {
    switch (type) {
      case 'original': return <Eye className="w-5 h-5" />;
      case 'laplacian': return <Zap className="w-5 h-5" />;
      case 'harris': return <Target className="w-5 h-5" />;
      case 'noise': return <Grid className="w-5 h-5" />;
      case 'compression': return <Layers className="w-5 h-5" />;
      case 'aberration': return <AlertTriangle className="w-5 h-5" />;
      case 'vignetting': return <Camera className="w-5 h-5" />;
      default: return <Eye className="w-5 h-5" />;
    }
  };

  const getVisualizationDescription = (type: VisualizationType) => {
    switch (type) {
      case 'original': return 'Source image';
      case 'laplacian': return 'Edge response map';
      case 'harris': return 'Corner response map';
      case 'noise': return 'Block-wise luminance variation';
      case 'compression': return 'Block boundary discontinuities';
      case 'aberration': return 'Channel misalignment heatmap';
      case 'vignetting': return 'Radial brightness drop';
      default: return 'Visualization';
    }
  };

  const getVisualizationExplanation = (type: VisualizationType) => {
    switch (type) {
      case 'original':
        return 'This is the original image as uploaded. Use the buttons on the left to view different analysis visualizations.';
      case 'laplacian':
        return 'The Laplacian edge detection highlights areas of rapid intensity change. Brighter areas indicate sharper edges, while darker areas suggest blur or smooth gradients. This visualization helps understand how the blur score is calculated.';
      case 'harris':
        return 'The Harris corner detection shows corner response strength. Brighter areas indicate stronger corners that are good for feature matching in photogrammetry. This visualization helps understand feature quality and distribution.';
      case 'noise':
        return 'The noise map shows local standard deviation of luminance in small blocks. Brighter areas indicate more noise, which can degrade 3D reconstruction quality. This helps identify sensor noise patterns and problematic image regions.';
      case 'compression':
        return 'This overlay highlights compression artifacts detected along typical JPEG block boundaries. Strong transitions across these blocks may reduce image fidelity and affect feature matching accuracy.';
      case 'aberration':
        return 'This map reveals chromatic aberration by showing gradient misalignments between color channels. It\'s useful for diagnosing lens issues or sensor alignment problems that can affect geometric accuracy.';
      case 'vignetting':
        return 'The vignetting map shows how brightness falls off from center to edges. A radial profile is fitted and shown to reveal both natural lens shading and sensor issues that can affect photogrammetric accuracy.';
      default:
        return 'Visualization explanation not available.';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Debug Visualization</h2>
            <p className="text-sm text-gray-600 mt-1">{analysis.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Visualization Controls */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Visualization Types</h3>
              
              <div className="space-y-2">
                {/* Original Image */}
                <button
                  onClick={() => handleVisualizationChange('original')}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                    activeVisualization === 'original'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {getVisualizationIcon('original')}
                  <div className="text-left">
                    <div className="font-medium">Original Image</div>
                    <div className="text-sm text-gray-500">{getVisualizationDescription('original')}</div>
                  </div>
                </button>

                {/* Blur Analysis */}
                <button
                  onClick={() => handleVisualizationChange('laplacian')}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                    activeVisualization === 'laplacian'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {getVisualizationIcon('laplacian')}
                  <div className="text-left">
                    <div className="font-medium">Laplacian (Blur Detection)</div>
                    <div className="text-sm text-gray-500">{getVisualizationDescription('laplacian')}</div>
                  </div>
                </button>

                {/* Feature Detection */}
                <button
                  onClick={() => handleVisualizationChange('harris')}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                    activeVisualization === 'harris'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {getVisualizationIcon('harris')}
                  <div className="text-left">
                    <div className="font-medium">Harris Corners</div>
                    <div className="text-sm text-gray-500">{getVisualizationDescription('harris')}</div>
                  </div>
                </button>

                {/* Noise Analysis */}
                <button
                  onClick={() => handleVisualizationChange('noise')}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                    activeVisualization === 'noise'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {getVisualizationIcon('noise')}
                  <div className="text-left">
                    <div className="font-medium">Noise Map</div>
                    <div className="text-sm text-gray-500">{getVisualizationDescription('noise')}</div>
                  </div>
                </button>

                {/* Compression Artifacts */}
                <button
                  onClick={() => handleVisualizationChange('compression')}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                    activeVisualization === 'compression'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {getVisualizationIcon('compression')}
                  <div className="text-left">
                    <div className="font-medium">Compression Artifacts</div>
                    <div className="text-sm text-gray-500">{getVisualizationDescription('compression')}</div>
                  </div>
                </button>

                {/* Chromatic Aberration */}
                <button
                  onClick={() => handleVisualizationChange('aberration')}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                    activeVisualization === 'aberration'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {getVisualizationIcon('aberration')}
                  <div className="text-left">
                    <div className="font-medium">Chromatic Aberration</div>
                    <div className="text-sm text-gray-500">{getVisualizationDescription('aberration')}</div>
                  </div>
                </button>

                {/* Vignetting */}
                <button
                  onClick={() => handleVisualizationChange('vignetting')}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                    activeVisualization === 'vignetting'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {getVisualizationIcon('vignetting')}
                  <div className="text-left">
                    <div className="font-medium">Vignetting Profile</div>
                    <div className="text-sm text-gray-500">{getVisualizationDescription('vignetting')}</div>
                  </div>
                </button>
              </div>

              {/* Performance Stats */}
              {performanceStats && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Performance Stats</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg GPU Speedup:</span>
                      <span className="font-medium">{performanceStats.averageSpeedup.toFixed(1)}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg GPU Time:</span>
                      <span className="font-medium">{performanceStats.averageGpuTime.toFixed(1)}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Benchmarks:</span>
                      <span className="font-medium">{performanceStats.totalBenchmarks}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Visualization Display */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {activeVisualization === 'original' && 'Original Image'}
                  {activeVisualization === 'laplacian' && 'Laplacian Edge Detection'}
                  {activeVisualization === 'harris' && 'Harris Corner Detection'}
                  {activeVisualization === 'noise' && 'Noise Map'}
                  {activeVisualization === 'compression' && 'Compression Artifacts'}
                  {activeVisualization === 'aberration' && 'Chromatic Aberration'}
                  {activeVisualization === 'vignetting' && 'Vignetting Profile'}
                </h3>
                
                <button
                  onClick={downloadVisualization}
                  disabled={!visualizations.has(activeVisualization)}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 disabled:text-gray-400"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </button>
              </div>

              <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ minHeight: '400px' }}>
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-gray-600">Generating visualization...</span>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="absolute inset-0 flex items-center justify-center bg-red-50">
                    <div className="text-center">
                      <div className="text-red-600 font-medium">Visualization Failed</div>
                      <div className="text-red-500 text-sm mt-1">{error}</div>
                    </div>
                  </div>
                )}

                {visualizations.has(activeVisualization) && (
                  <img
                    src={visualizations.get(activeVisualization)}
                    alt={`${activeVisualization} visualization`}
                    className="w-full h-auto max-h-96 object-contain"
                  />
                )}
              </div>

              {/* Explanation */}
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p>{getVisualizationExplanation(activeVisualization)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};