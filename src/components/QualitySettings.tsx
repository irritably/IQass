import React from 'react';
import { Settings, Info, Sliders } from 'lucide-react';

interface QualitySettingsProps {
  threshold: number;
  onThresholdChange: (threshold: number) => void;
}

export const QualitySettings: React.FC<QualitySettingsProps> = ({ 
  threshold, 
  onThresholdChange 
}) => {
  return (
    <div className="bg-gradient-to-br from-gray-800/50 to-gray-700/30 backdrop-blur-sm rounded-xl border border-gray-600/50 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
          <Sliders className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-100">Quality Threshold</h3>
          <p className="text-sm text-gray-400">Set minimum quality score for reconstruction</p>
        </div>
      </div>
      
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-medium text-gray-300">
              Minimum Composite Score for Reconstruction
            </label>
            <div className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30 font-semibold">
              {threshold}
            </div>
          </div>
          
          <div className="relative">
            <input
              type="range"
              min="0"
              max="100"
              value={threshold}
              onChange={(e) => onThresholdChange(Number(e.target.value))}
              className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
              style={{
                background: `linear-gradient(to right, #ef4444 0%, #f59e0b 25%, #10b981 50%, #3b82f6 75%, #8b5cf6 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>0 (Very Poor)</span>
              <span>25 (Poor)</span>
              <span>50 (Acceptable)</span>
              <span>75 (Good)</span>
              <span>100 (Excellent)</span>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-lg border border-blue-500/30">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-200">
              <p className="font-medium mb-1">Threshold Guidelines:</p>
              <ul className="space-y-1 text-blue-300">
                <li>• <strong>40-50:</strong> General use, basic quality requirements</li>
                <li>• <strong>60-70:</strong> Professional mapping and surveying</li>
                <li>• <strong>70-80:</strong> High-precision photogrammetry</li>
                <li>• <strong>80+:</strong> Critical applications requiring maximum quality</li>
              </ul>
              <p className="mt-2 text-xs text-blue-400">
                Images with scores above {threshold} will be recommended for photogrammetry reconstruction.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};