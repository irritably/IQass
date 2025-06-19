import React from 'react';
import { Camera, Zap } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Drone Image Quality Analyzer</h1>
              <p className="text-sm text-gray-500">Professional blur detection for photogrammetry</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Zap className="w-4 h-4" />
            <span>Real-time analysis</span>
          </div>
        </div>
      </div>
    </header>
  );
};