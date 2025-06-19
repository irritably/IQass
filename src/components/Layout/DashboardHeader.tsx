import React from 'react';
import { Camera, Menu, Save, Download, Activity } from 'lucide-react';

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
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-800/95 backdrop-blur-sm border-b border-slate-700/50 shadow-xl">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl hover:bg-slate-700/50 transition-all duration-300 group"
          >
            <Menu className="w-5 h-5 text-slate-300 group-hover:text-white transition-colors" />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
              <Camera className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100">
                Drone Image Quality Analyzer
              </h1>
              <p className="text-sm text-slate-400">Professional Analysis Dashboard</p>
            </div>
          </div>
        </div>

        {/* Right Section - Session Controls */}
        <div className="flex items-center space-x-4">
          {/* Save Session Button */}
          <button
            onClick={onSaveSession}
            disabled={!hasData}
            className={`btn-primary ${
              !hasData ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
            }`}
            title={hasData ? 'Save current analysis session' : 'No data to save'}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Session
          </button>

          {/* Load Session Button */}
          <button
            onClick={onLoadSession}
            className="btn-success hover:scale-105"
            title="Load a previously saved session"
          >
            <Download className="w-4 h-4 mr-2" />
            Load Session
          </button>

          {/* Status Indicator */}
          <div className="flex items-center space-x-3 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 backdrop-blur-sm">
            <div className="status-online" />
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span className="font-semibold">Ready</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};