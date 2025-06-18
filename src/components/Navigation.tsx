import React from 'react';
import { Upload, BarChart3, Grid3X3, Camera } from 'lucide-react';
import { ViewType, NavigationItem } from '../types';

interface NavigationProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  analysisCount: number;
  isProcessing: boolean;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'upload',
    label: 'Upload & Analyze',
    icon: Upload,
    description: 'Upload images and configure analysis settings'
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: BarChart3,
    description: 'Overview of analysis statistics and trends'
  },
  {
    id: 'results',
    label: 'Analysis Results',
    icon: Grid3X3,
    description: 'Detailed results and export options'
  }
];

export const Navigation: React.FC<NavigationProps> = ({
  currentView,
  onViewChange,
  analysisCount,
  isProcessing
}) => {
  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Drone Image Quality Analyzer</h1>
              <p className="text-sm text-gray-500">Professional analysis for photogrammetry</p>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex items-center space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              const isDisabled = item.id === 'results' && analysisCount === 0;
              
              return (
                <button
                  key={item.id}
                  onClick={() => !isDisabled && onViewChange(item.id)}
                  disabled={isDisabled}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive 
                      ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                      : isDisabled
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }
                  `}
                  title={isDisabled ? 'Complete analysis to view results' : item.description}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.id === 'results' && analysisCount > 0 && (
                    <span className="ml-1 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                      {analysisCount}
                    </span>
                  )}
                  {item.id === 'upload' && isProcessing && (
                    <div className="ml-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Status Indicator */}
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            {isProcessing ? (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>Processing...</span>
              </div>
            ) : analysisCount > 0 ? (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span>{analysisCount} images analyzed</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full" />
                <span>Ready</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};