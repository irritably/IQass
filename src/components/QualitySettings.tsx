import React from 'react';
import { Settings, Info } from 'lucide-react';

interface QualitySettingsProps {
  threshold: number;
  onThresholdChange: (threshold: number) => void;
}

export const QualitySettings: React.FC<QualitySettingsProps> = ({ 
  threshold, 
  onThresholdChange 
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-4">
        <Settings className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Quality Threshold</h3>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Blur Score for Reconstruction
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={threshold}
            onChange={(e) => onThresholdChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-sm text-gray-500 mt-1">
            <span>0 (Very Blurry)</span>
            <span className="font-medium text-blue-600">{threshold}</span>
            <span>100 (Very Sharp)</span>
          </div>
        </div>
        
        <div className="flex items-start space-x-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>
            Images with blur scores above {threshold} will be recommended for photogrammetry reconstruction. 
            Typical thresholds: 40-50 for general use, 60+ for high-precision work.
          </p>
        </div>
      </div>
    </div>
  );
};