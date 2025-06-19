import React from 'react';
import { Camera, Menu, Save, Download } from 'lucide-react';

interface DashboardHeaderProps {
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
  onSaveSession?: () => void;
  onLoadSession?: () => void;
  hasData?: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  onToggleSidebar, 
  sidebarCollapsed,
  onSaveSession,
  onLoadSession,
  hasData = false
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-800/95 backdrop-blur-sm border-b border-gray-700">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-300" />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-100">
                Drone Image Quality Analyzer
              </h1>
              <p className="text-sm text-gray-400">Professional Analysis Dashboard</p>
            </div>
          </div>
        </div>

        {/* Right Section - Session Controls */}
        <div className="flex items-center space-x-3">
          {/* Save Session Button */}
          <button
            onClick={onSaveSession}
            disabled={!hasData}
            className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              hasData
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
            title={hasData ? 'Save current analysis session' : 'No data to save'}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Session
          </button>

          {/* Load Session Button */}
          <button
            onClick={onLoadSession}
            className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
            title="Load a previously saved session"
          >
            <Download className="w-4 h-4 mr-2" />
            Load Session
          </button>

          {/* Status Indicator */}
          <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span>Ready</span>
          </div>
        </div>
      </div>
    </header>
  );
};