import React from 'react';
import { Camera, Menu, Settings, Bell, User } from 'lucide-react';

interface DashboardHeaderProps {
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  onToggleSidebar, 
  sidebarCollapsed 
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

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Status Indicator */}
          <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span>System Ready</span>
          </div>

          {/* Action Buttons */}
          <button className="p-2 rounded-lg hover:bg-gray-700 transition-colors relative">
            <Bell className="w-5 h-5 text-gray-300" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
          </button>
          
          <button className="p-2 rounded-lg hover:bg-gray-700 transition-colors">
            <Settings className="w-5 h-5 text-gray-300" />
          </button>
          
          <button className="p-2 rounded-lg hover:bg-gray-700 transition-colors">
            <User className="w-5 h-5 text-gray-300" />
          </button>
        </div>
      </div>
    </header>
  );
};