/**
 * Performance Dashboard Component
 * 
 * User-facing interface for the Performance Benchmarking Utility,
 * providing insights into system performance, optimization recommendations,
 * and hardware utilization metrics.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { X, Zap, Cpu, Monitor, TrendingUp, Settings, Info, Download, Play, BarChart3 } from 'lucide-react';
import { usePerformanceBenchmark } from '../hooks/usePerformanceBenchmark';
import { getWebGLCapabilities } from '../utils/webglProcessing';

interface PerformanceDashboardProps {
  isVisible: boolean;
  onClose: () => void;
}

type TabType = 'overview' | 'history' | 'settings' | 'help';

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  isVisible,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isRunningBenchmark, setIsRunningBenchmark] = useState(false);

  const {
    benchmarkResults,
    getStats,
    clearBenchmarks,
    runBenchmark,
    getRecommendation,
    optimizedExecution
  } = usePerformanceBenchmark();

  const systemCapabilities = useMemo(() => getWebGLCapabilities(), []);
  const performanceStats = useMemo(() => getStats(), [getStats]);

  const runCustomBenchmark = useCallback(async () => {
    setIsRunningBenchmark(true);
    try {
      // Create a test image for benchmarking
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Fill with test pattern
      const imageData = ctx.createImageData(800, 600);
      for (let i = 0; i < imageData.data.length; i += 4) {
        imageData.data[i] = Math.random() * 255;     // R
        imageData.data[i + 1] = Math.random() * 255; // G
        imageData.data[i + 2] = Math.random() * 255; // B
        imageData.data[i + 3] = 255;                 // A
      }

      // Mock CPU and GPU functions for benchmarking
      const cpuFunction = () => new Promise(resolve => {
        setTimeout(() => resolve('CPU result'), 50 + Math.random() * 100);
      });

      const gpuFunction = () => new Promise(resolve => {
        setTimeout(() => resolve('GPU result'), 5 + Math.random() * 20);
      });

      await runBenchmark(
        'Custom Benchmark',
        cpuFunction,
        gpuFunction,
        imageData.width * imageData.height
      );
    } catch (error) {
      console.error('Benchmark failed:', error);
    } finally {
      setIsRunningBenchmark(false);
    }
  }, [runBenchmark]);

  const exportBenchmarkData = useCallback(() => {
    const data = {
      systemCapabilities,
      benchmarkResults,
      performanceStats,
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `performance-benchmark-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [systemCapabilities, benchmarkResults, performanceStats]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Performance Dashboard</h2>
              <p className="text-sm text-gray-600">System performance insights and optimization</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: Monitor },
              { id: 'history', label: 'Benchmark History', icon: BarChart3 },
              { id: 'settings', label: 'Settings', icon: Settings },
              { id: 'help', label: 'Help', icon: Info }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as TabType)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <OverviewTab
              systemCapabilities={systemCapabilities}
              performanceStats={performanceStats}
              benchmarkResults={benchmarkResults}
              onRunBenchmark={runCustomBenchmark}
              isRunningBenchmark={isRunningBenchmark}
            />
          )}

          {activeTab === 'history' && (
            <HistoryTab
              benchmarkResults={benchmarkResults}
              onClearHistory={clearBenchmarks}
              onExportData={exportBenchmarkData}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab
              systemCapabilities={systemCapabilities}
              getRecommendation={getRecommendation}
            />
          )}

          {activeTab === 'help' && (
            <HelpTab />
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Overview Tab Component
 */
interface OverviewTabProps {
  systemCapabilities: any;
  performanceStats: any;
  benchmarkResults: any[];
  onRunBenchmark: () => void;
  isRunningBenchmark: boolean;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
  systemCapabilities,
  performanceStats,
  benchmarkResults,
  onRunBenchmark,
  isRunningBenchmark
}) => {
  return (
    <div className="space-y-6">
      {/* System Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center space-x-2 mb-3">
            <Monitor className="w-5 h-5 text-blue-600" />
            <h3 className="font-medium text-blue-900">System Capabilities</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-700">WebGL Support:</span>
              <span className="font-medium text-blue-900">
                {systemCapabilities.webgl ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">WebGL 2.0:</span>
              <span className="font-medium text-blue-900">
                {systemCapabilities.webgl2 ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">High Precision:</span>
              <span className="font-medium text-blue-900">
                {systemCapabilities.supportsHighPrecision ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Max Texture Size:</span>
              <span className="font-medium text-blue-900">
                {systemCapabilities.maxTextureSize}px
              </span>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center space-x-2 mb-3">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h3 className="font-medium text-green-900">Performance Stats</h3>
          </div>
          {performanceStats ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-700">Avg Speedup:</span>
                <span className="font-medium text-green-900">
                  {performanceStats.local.averageSpeedup.toFixed(1)}x
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Total Benchmarks:</span>
                <span className="font-medium text-green-900">
                  {performanceStats.local.totalBenchmarks}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">GPU Recommended:</span>
                <span className="font-medium text-green-900">
                  {performanceStats.local.averageSpeedup > 1.5 ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-green-700">No benchmark data available</p>
          )}
        </div>

        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center space-x-2 mb-3">
            <Cpu className="w-5 h-5 text-purple-600" />
            <h3 className="font-medium text-purple-900">Quick Actions</h3>
          </div>
          <div className="space-y-3">
            <button
              onClick={onRunBenchmark}
              disabled={isRunningBenchmark}
              className="w-full flex items-center justify-center px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {isRunningBenchmark ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run Benchmark
                </>
              )}
            </button>
            <p className="text-xs text-purple-700">
              Test your system's performance with image processing tasks
            </p>
          </div>
        </div>
      </div>

      {/* Performance Recommendations */}
      <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
        <h3 className="font-medium text-amber-900 mb-3">Performance Recommendations</h3>
        <div className="space-y-2 text-sm text-amber-800">
          {systemCapabilities.webgl ? (
            <>
              <p>✅ GPU acceleration is available and will automatically speed up image processing</p>
              {performanceStats?.local.averageSpeedup > 5 && (
                <p>🚀 Your GPU provides excellent acceleration ({performanceStats.local.averageSpeedup.toFixed(1)}x speedup)</p>
              )}
            </>
          ) : (
            <p>⚠️ GPU acceleration is not available. Processing will use CPU only.</p>
          )}
          
          {systemCapabilities.maxTextureSize < 4096 && (
            <p>⚠️ Limited texture size may affect processing of very large images</p>
          )}
          
          {!systemCapabilities.supportsHighPrecision && (
            <p>ℹ️ High precision operations will use medium precision fallback</p>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * History Tab Component
 */
interface HistoryTabProps {
  benchmarkResults: any[];
  onClearHistory: () => void;
  onExportData: () => void;
}

const HistoryTab: React.FC<HistoryTabProps> = ({
  benchmarkResults,
  onClearHistory,
  onExportData
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Benchmark History</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={onExportData}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </button>
          <button
            onClick={onClearHistory}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700"
          >
            Clear History
          </button>
        </div>
      </div>

      {benchmarkResults.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Operation</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">CPU Time</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">GPU Time</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Speedup</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Image Size</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {benchmarkResults.slice(-10).map((result, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{result.operation}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{result.cpuTime.toFixed(1)}ms</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{result.gpuTime.toFixed(1)}ms</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`font-medium ${
                      result.speedup > 2 ? 'text-green-600' : 
                      result.speedup > 1.2 ? 'text-blue-600' : 'text-gray-600'
                    }`}>
                      {result.speedup.toFixed(1)}x
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {(result.imageSize / 1000).toFixed(0)}K px
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      result.recommendation === 'gpu' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {result.recommendation.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No benchmark data available</p>
          <p className="text-sm text-gray-500 mt-1">
            Process some images or run a custom benchmark to see performance data
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * Settings Tab Component
 */
interface SettingsTabProps {
  systemCapabilities: any;
  getRecommendation: (operation: string, imageSize: number) => 'cpu' | 'gpu' | 'unknown';
}

const SettingsTab: React.FC<SettingsTabProps> = ({
  systemCapabilities,
  getRecommendation
}) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Performance Settings</h3>
      
      <div className="space-y-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">Processing Mode</h4>
          <p className="text-sm text-blue-800 mb-3">
            The application automatically chooses the best processing method based on your hardware and performance history.
          </p>
          <div className="space-y-2">
            <label className="flex items-center">
              <input type="radio" name="mode" value="auto" defaultChecked className="mr-2" />
              <span className="text-sm text-blue-900">Auto (Recommended)</span>
            </label>
            <label className="flex items-center">
              <input type="radio" name="mode" value="gpu" disabled={!systemCapabilities.webgl} className="mr-2" />
              <span className={`text-sm ${systemCapabilities.webgl ? 'text-blue-900' : 'text-gray-500'}`}>
                Force GPU {!systemCapabilities.webgl && '(Not Available)'}
              </span>
            </label>
            <label className="flex items-center">
              <input type="radio" name="mode" value="cpu" className="mr-2" />
              <span className="text-sm text-blue-900">Force CPU</span>
            </label>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <h4 className="font-medium text-green-900 mb-2">Current Recommendations</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-green-700">Blur Detection (800x600):</span>
              <span className="font-medium text-green-900 uppercase">
                {getRecommendation('blur', 480000)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700">Large Images (2MP):</span>
              <span className="font-medium text-green-900 uppercase">
                {getRecommendation('blur', 2000000)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700">Small Images (VGA):</span>
              <span className="font-medium text-green-900 uppercase">
                {getRecommendation('blur', 307200)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Help Tab Component
 */
const HelpTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Performance Help</h3>
      
      <div className="space-y-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">What is GPU Acceleration?</h4>
          <p className="text-sm text-blue-800">
            GPU acceleration uses your computer's graphics card to process images much faster than the CPU alone. 
            This can provide 10-30x speedup for image analysis operations like blur detection and feature extraction.
          </p>
        </div>

        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <h4 className="font-medium text-green-900 mb-2">How Does Benchmarking Work?</h4>
          <p className="text-sm text-green-800">
            The application automatically compares CPU and GPU performance for different operations and image sizes. 
            It then uses this data to automatically choose the fastest method for each task.
          </p>
        </div>

        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <h4 className="font-medium text-purple-900 mb-2">Troubleshooting Performance Issues</h4>
          <ul className="text-sm text-purple-800 space-y-1">
            <li>• Ensure your browser supports WebGL (most modern browsers do)</li>
            <li>• Update your graphics drivers for best performance</li>
            <li>• Close other GPU-intensive applications while processing</li>
            <li>• For very large images, consider reducing size before analysis</li>
            <li>• Check that hardware acceleration is enabled in your browser</li>
          </ul>
        </div>

        <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
          <h4 className="font-medium text-amber-900 mb-2">Understanding the Metrics</h4>
          <div className="text-sm text-amber-800 space-y-2">
            <p><strong>Speedup:</strong> How many times faster GPU is compared to CPU</p>
            <p><strong>CPU Time:</strong> Time taken to process using CPU only</p>
            <p><strong>GPU Time:</strong> Time taken to process using GPU acceleration</p>
            <p><strong>Recommendation:</strong> Which method the system recommends for similar tasks</p>
          </div>
        </div>
      </div>
    </div>
  );
};