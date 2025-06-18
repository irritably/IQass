/**
 * Development Performance Panel Component
 * 
 * React component for the development performance monitoring panel.
 * This is separated from devSettings.ts to avoid JSX in .ts files.
 */

import React, { useState, useCallback } from 'react';
import { Settings, Download, Trash2, RefreshCw, Monitor, Cpu, HardDrive, Zap } from 'lucide-react';
import { usePerformanceMonitoring } from '../utils/devSettings';

export const DevPerformancePanel: React.FC = () => {
  const { report, generateReport, exportData } = usePerformanceMonitoring();
  const [isVisible, setIsVisible] = useState(false);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const downloadReport = useCallback(() => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `performance-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [exportData]);

  return (
    <>
      {/* Toggle Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors"
          title="Performance Monitor"
        >
          <Monitor className="w-5 h-5" />
        </button>
      </div>

      {/* Performance Panel */}
      {isVisible && (
        <div className="fixed bottom-20 right-4 w-96 bg-white border border-gray-300 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <Cpu className="w-5 h-5 mr-2" />
              Performance Monitor
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={generateReport}
                className="text-blue-600 hover:text-blue-700 text-sm flex items-center"
                title="Refresh Data"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Refresh
              </button>
              <button
                onClick={downloadReport}
                className="text-green-600 hover:text-green-700 text-sm flex items-center"
                title="Export Report"
              >
                <Download className="w-4 h-4 mr-1" />
                Export
              </button>
              <button
                onClick={() => setIsVisible(false)}
                className="text-gray-400 hover:text-gray-600"
                title="Close Panel"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {report ? (
              <>
                {/* Memory Stats */}
                {report.memory.available && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                      <HardDrive className="w-4 h-4 mr-2" />
                      Memory Usage
                    </h4>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-blue-700">Used:</span>
                        <span className="font-medium">{report.memory.current.usedMB} MB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Growth:</span>
                        <span className="font-medium">{report.memory.growth.growthMB} MB ({report.memory.growth.percentage}%)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Peak:</span>
                        <span className="font-medium">{report.memory.peak.valueMB} MB</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Performance Stats */}
                {report.performance.available && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2 flex items-center">
                      <Zap className="w-4 h-4 mr-2" />
                      Performance
                    </h4>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-green-700">Measurements:</span>
                        <span className="font-medium">{report.performance.overall.totalMeasurements}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Avg Duration:</span>
                        <span className="font-medium">{report.performance.overall.avgDuration}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Max Duration:</span>
                        <span className="font-medium">{report.performance.overall.maxDuration}ms</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">Recommendations</h4>
                  <div className="text-sm space-y-1">
                    {report.recommendations.map((rec, index) => (
                      <div key={index} className="text-yellow-800 text-xs">{rec}</div>
                    ))}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-50 p-2 rounded text-center">
                    <div className="font-medium text-gray-900">WebGL</div>
                    <div className="text-gray-600">{report.webgl.available ? 'Available' : 'Not Available'}</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded text-center">
                    <div className="font-medium text-gray-900">Snapshots</div>
                    <div className="text-gray-600">{report.memory.snapshots || 0}</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
                Generating performance report...
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};