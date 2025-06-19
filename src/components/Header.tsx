import React from 'react';
import { Camera, Zap, Sparkles } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 border-b border-purple-500/20 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl shadow-lg">
                <Camera className="w-7 h-7 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-slate-900 animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                Drone Image Quality Analyzer
              </h1>
              <p className="text-sm text-purple-300/80 font-medium">
                Professional blur detection for photogrammetry
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 px-4 py-2 bg-purple-500/10 rounded-full border border-purple-500/20">
              <Zap className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-300 font-medium">Real-time analysis</span>
            </div>
            <div className="flex items-center space-x-2 px-4 py-2 bg-blue-500/10 rounded-full border border-blue-500/20">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-300 font-medium">GPU Accelerated</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};