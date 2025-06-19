import React from 'react';
import { Camera, Zap } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-gray-800 to-gray-700 border-b border-gray-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg shadow-lg">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-100">Drone Image Quality Analyzer</h1>
              <p className="text-sm text-gray-400">Professional blur detection for photogrammetry</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-300">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>Real-time analysis</span>
          </div>
        </div>
      </div>
    </header>
  );
};