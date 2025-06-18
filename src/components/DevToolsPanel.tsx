/**
 * Development Tools Panel
 * 
 * Comprehensive development panel for monitoring performance, debugging,
 * and analyzing the Drone Image Quality Analyzer in real-time.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Settings, Download, Trash2, RefreshCw, Monitor, Cpu, HardDrive, Zap, Eye, Code, BarChart3 } from 'lucide-react';
import { usePerformanceMonitoring } from '../utils/devSettings';
import { useDebugInfo } from '../utils/debugUtils';
import { getWebGLCapabilities, getPerformanceStats } from '../utils/webglProcessing';

interface DevToolsPanelProps {
  isVisible: boolean;
  onToggle: () => void;
}

export const DevToolsPanel: React.FC<DevToolsPanelProps> = ({ isVisible, onToggle }) => {
  const [activeTab, setActiveTab] = useState<'performance' | 'debug' | 'webgl' | 'memory'>('performance');
  const { report, generateReport, exportData } = usePerformanceMonitoring();
  const { debugData, refreshDebugData, exportData: exportDebugData, clearData } = useDebugInfo();
  const [webglCapabilities, setWebglCapabilities] = useState<any>(null);
  const [webglStats, setWebglStats] = useState<any>(null);

  // Load WebGL information
  useEffect(() => {
    if (isVisible) {
      setWebglCapabilities(getWebGLCapabilities());
      setWebglStats(getPerformanceStats());
    }
  }, [isVisible]);

  const downloadReport = useCallback((type: 'performance' | 'debug') => {
    const data = type === 'performance' ? exportData() : exportDebugData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type}-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [exportData, exportDebugData]);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      {/* Toggle Button */}
      <div className="fixed bottom-4 left-4 z-50">
        <button
          onClick={onToggle}
          className="bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors"
          title="Development Tools"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Development Panel */}
      {isVisible && (
        <div className="fixed bottom-20 left-4 w-[600px] bg-white border border-gray-300 rounded-lg shadow-xl z-50 max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <Code className="w-5 h-5 mr-2" />
              Development Tools
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  generateReport();
                  refreshDebugData();
                }}
                className="text-blue-600 hover:text-blue-700 text-sm flex items-center"
                title="Refresh All Data"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Refresh
              </button>
              <button
                onClick={onToggle}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 bg-gray-50">
            <nav className="flex space-x-0">
              {[
                { id: 'performance', label: 'Performance', icon: Monitor },
                { id: 'debug', label: 'Debug', icon: Eye },
                { id: 'webgl', label: 'WebGL', icon: Zap },
                { id: 'memory', label: 'Memory', icon: HardDrive }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === id
                      ? 'border-purple-500 text-purple-600 bg-white'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-4 overflow-y-auto max-h-96">
            {activeTab === 'performance' && (
              <PerformanceTab 
                report={report} 
                onDownload={() => downloadReport('performance')} 
              />
            )}
            {activeTab === 'debug' && (
              <DebugTab 
                debugData={debugData} 
                onDownload={() => downloadReport('debug')}
                onClear={clearData}
              />
            )}
            {activeTab === 'webgl' && (
              <WebGLTab 
                capabilities={webglCapabilities} 
                stats={webglStats} 
              />
            )}
            {activeTab === 'memory' && (
              <MemoryTab report={report} />
            )}
          </div>
        </div>
      )}
    </>
  );
};

/**
 * Performance Tab Component
 */
interface PerformanceTabProps {
  report: any;
  onDownload: () => void;
}

const PerformanceTab: React.FC<PerformanceTabProps> = ({ report, onDownload }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900">Performance Metrics</h4>
        <button
          onClick={onDownload}
          className="text-green-600 hover:text-green-700 text-sm flex items-center"
        >
          <Download className="w-4 h-4 mr-1" />
          Export
        </button>
      </div>

      {report ? (
        <div className="space-y-4">
          {/* Overall Performance */}
          {report.performance.available && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <h5 className="font-medium text-blue-900 mb-2">Overall Performance</h5>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Total Measurements:</span>
                  <div className="font-medium">{report.performance.overall.totalMeasurements}</div>
                </div>
                <div>
                  <span className="text-blue-700">Avg Duration:</span>
                  <div className="font-medium">{report.performance.overall.avgDuration}ms</div>
                </div>
                <div>
                  <span className="text-blue-700">Max Duration:</span>
                  <div className="font-medium">{report.performance.overall.maxDuration}ms</div>
                </div>
                <div>
                  <span className="text-blue-700">Min Duration:</span>
                  <div className="font-medium">{report.performance.overall.minDuration}ms</div>
                </div>
              </div>
            </div>
          )}

          {/* Operation Breakdown */}
          {report.performance.available && report.performance.operations.length > 0 && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <h5 className="font-medium text-gray-900 mb-2">Operation Breakdown</h5>
              <div className="space-y-2">
                {report.performance.operations.map((op: any, index: number) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="font-medium">{op.operation}</span>
                    <div className="text-right">
                      <div>{op.avgDuration}ms avg</div>
                      <div className="text-gray-500">{op.count} calls</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div className="bg-yellow-50 p-3 rounded-lg">
            <h5 className="font-medium text-yellow-900 mb-2">Recommendations</h5>
            <div className="space-y-1 text-sm">
              {report.recommendations.map((rec: string, index: number) => (
                <div key={index} className="text-yellow-800">{rec}</div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">
          Generating performance report...
        </div>
      )}
    </div>
  );
};

/**
 * Debug Tab Component
 */
interface DebugTabProps {
  debugData: any;
  onDownload: () => void;
  onClear: () => void;
}

const DebugTab: React.FC<DebugTabProps> = ({ debugData, onDownload, onClear }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900">Debug Information</h4>
        <div className="flex space-x-2">
          <button
            onClick={onDownload}
            className="text-green-600 hover:text-green-700 text-sm flex items-center"
          >
            <Download className="w-4 h-4 mr-1" />
            Export
          </button>
          <button
            onClick={onClear}
            className="text-red-600 hover:text-red-700 text-sm flex items-center"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Clear
          </button>
        </div>
      </div>

      {debugData ? (
        <div className="space-y-4">
          {/* Performance Analysis */}
          {debugData.performanceAnalysis?.available && (
            <div className="bg-green-50 p-3 rounded-lg">
              <h5 className="font-medium text-green-900 mb-2">Algorithm Performance</h5>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-green-700">Total Steps:</span>
                  <div className="font-medium">{debugData.performanceAnalysis.totalSteps}</div>
                </div>
                <div>
                  <span className="text-green-700">Unique Operations:</span>
                  <div className="font-medium">{debugData.performanceAnalysis.uniqueOperations}</div>
                </div>
              </div>
              
              {debugData.performanceAnalysis.analysis.length > 0 && (
                <div className="mt-3 space-y-2">
                  <h6 className="font-medium text-green-900">Top Operations by Time:</h6>
                  {debugData.performanceAnalysis.analysis.slice(0, 3).map((op: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{op.stepName}</span>
                      <span className="font-medium">{op.totalDuration.toFixed(2)}ms</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* WebGL Debug Info */}
          <div className="bg-purple-50 p-3 rounded-lg">
            <h5 className="font-medium text-purple-900 mb-2">WebGL Debug</h5>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-purple-700">Shader Compilations:</span>
                <div className="font-medium">{debugData.webglInfo?.shaderCompilations?.length || 0}</div>
              </div>
              <div>
                <span className="text-purple-700">Texture Operations:</span>
                <div className="font-medium">{debugData.webglInfo?.textureOperations?.length || 0}</div>
              </div>
            </div>
          </div>

          {/* State Snapshots */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <h5 className="font-medium text-gray-900 mb-2">State Tracking</h5>
            <div className="text-sm">
              <span className="text-gray-700">State Snapshots:</span>
              <div className="font-medium">{debugData.stateSnapshots || 0}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">
          Loading debug information...
        </div>
      )}
    </div>
  );
};

/**
 * WebGL Tab Component
 */
interface WebGLTabProps {
  capabilities: any;
  stats: any;
}

const WebGLTab: React.FC<WebGLTabProps> = ({ capabilities, stats }) => {
  return (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-900">WebGL Information</h4>

      {capabilities ? (
        <div className="space-y-4">
          {/* WebGL Support */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <h5 className="font-medium text-blue-900 mb-2">WebGL Support</h5>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700">WebGL 1.0:</span>
                <div className="font-medium">{capabilities.webgl ? '✅ Supported' : '❌ Not Supported'}</div>
              </div>
              <div>
                <span className="text-blue-700">WebGL 2.0:</span>
                <div className="font-medium">{capabilities.webgl2 ? '✅ Supported' : '❌ Not Supported'}</div>
              </div>
              <div>
                <span className="text-blue-700">High Precision:</span>
                <div className="font-medium">{capabilities.supportsHighPrecision ? '✅ Supported' : '❌ Not Supported'}</div>
              </div>
              <div>
                <span className="text-blue-700">Float Textures:</span>
                <div className="font-medium">{capabilities.supportsFloatTextures ? '✅ Supported' : '❌ Not Supported'}</div>
              </div>
            </div>
          </div>

          {/* Hardware Limits */}
          <div className="bg-green-50 p-3 rounded-lg">
            <h5 className="font-medium text-green-900 mb-2">Hardware Limits</h5>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-green-700">Max Texture Size:</span>
                <div className="font-medium">{capabilities.maxTextureSize}px</div>
              </div>
              <div>
                <span className="text-green-700">Max Viewport:</span>
                <div className="font-medium">{capabilities.maxViewportDims[0]}x{capabilities.maxViewportDims[1]}</div>
              </div>
            </div>
          </div>

          {/* Extensions */}
          {capabilities.extensions.length > 0 && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <h5 className="font-medium text-gray-900 mb-2">Available Extensions</h5>
              <div className="text-sm space-y-1">
                {capabilities.extensions.map((ext: string, index: number) => (
                  <div key={index} className="text-gray-700">{ext}</div>
                ))}
              </div>
            </div>
          )}

          {/* Performance Stats */}
          {stats && (
            <div className="bg-yellow-50 p-3 rounded-lg">
              <h5 className="font-medium text-yellow-900 mb-2">Performance Statistics</h5>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-yellow-700">Avg Speedup:</span>
                  <div className="font-medium">{stats.averageSpeedup.toFixed(1)}x</div>
                </div>
                <div>
                  <span className="text-yellow-700">Avg GPU Time:</span>
                  <div className="font-medium">{stats.averageGpuTime.toFixed(1)}ms</div>
                </div>
                <div>
                  <span className="text-yellow-700">Total Benchmarks:</span>
                  <div className="font-medium">{stats.totalBenchmarks}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">
          Loading WebGL information...
        </div>
      )}
    </div>
  );
};

/**
 * Memory Tab Component
 */
interface MemoryTabProps {
  report: any;
}

const MemoryTab: React.FC<MemoryTabProps> = ({ report }) => {
  const [currentMemory, setCurrentMemory] = useState<any>(null);

  useEffect(() => {
    const updateMemory = () => {
      if ((performance as any).memory) {
        const memory = (performance as any).memory;
        setCurrentMemory({
          used: (memory.usedJSHeapSize / 1024 / 1024).toFixed(2),
          total: (memory.totalJSHeapSize / 1024 / 1024).toFixed(2),
          limit: (memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)
        });
      }
    };

    updateMemory();
    const interval = setInterval(updateMemory, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-900">Memory Usage</h4>

      {/* Current Memory */}
      {currentMemory && (
        <div className="bg-blue-50 p-3 rounded-lg">
          <h5 className="font-medium text-blue-900 mb-2">Current Memory</h5>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-blue-700">Used:</span>
              <div className="font-medium">{currentMemory.used} MB</div>
            </div>
            <div>
              <span className="text-blue-700">Total:</span>
              <div className="font-medium">{currentMemory.total} MB</div>
            </div>
            <div>
              <span className="text-blue-700">Limit:</span>
              <div className="font-medium">{currentMemory.limit} MB</div>
            </div>
          </div>
        </div>
      )}

      {/* Memory Report */}
      {report?.memory?.available && (
        <div className="space-y-3">
          <div className="bg-green-50 p-3 rounded-lg">
            <h5 className="font-medium text-green-900 mb-2">Memory Growth</h5>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-green-700">Growth:</span>
                <div className="font-medium">{report.memory.growth.growthMB} MB</div>
              </div>
              <div>
                <span className="text-green-700">Percentage:</span>
                <div className="font-medium">{report.memory.growth.percentage}%</div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-3 rounded-lg">
            <h5 className="font-medium text-yellow-900 mb-2">Peak Usage</h5>
            <div className="text-sm">
              <span className="text-yellow-700">Peak Memory:</span>
              <div className="font-medium">{report.memory.peak.valueMB} MB</div>
            </div>
          </div>
        </div>
      )}

      {/* Memory Tips */}
      <div className="bg-gray-50 p-3 rounded-lg">
        <h5 className="font-medium text-gray-900 mb-2">Memory Optimization Tips</h5>
        <div className="text-sm text-gray-700 space-y-1">
          <div>• Use lazy loading for large image batches</div>
          <div>• Clear unused image data promptly</div>
          <div>• Monitor memory growth during processing</div>
          <div>• Consider reducing image resolution for analysis</div>
        </div>
      </div>
    </div>
  );
};