import React, { useState } from 'react';
import { ImageAnalysis } from '../types';
import { CheckCircle, AlertTriangle, XCircle, Eye, Info, Zap, Target, Camera } from 'lucide-react';
import { TechnicalQualityPanel } from './TechnicalQualityPanel';

interface FloatingResultCardProps {
  analysis: ImageAnalysis;
  threshold: number;
  isSelected: boolean;
  onClick: (isMultiSelect: boolean) => void;
  animationDelay?: number;
  variant?: 'grid' | 'list';
}

export const FloatingResultCard: React.FC<FloatingResultCardProps> = ({
  analysis,
  threshold,
  isSelected,
  onClick,
  animationDelay = 0,
  variant = 'grid'
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const isRecommended = (analysis.compositeScore?.overall || 0) >= threshold;
  const recommendation = analysis.compositeScore?.recommendation || 'unsuitable';

  const getQualityIcon = () => {
    switch (recommendation) {
      case 'excellent':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'good':
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'acceptable':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'poor':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'unsuitable':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <XCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getQualityColor = () => {
    switch (recommendation) {
      case 'excellent':
        return 'from-green-500 to-emerald-500';
      case 'good':
        return 'from-blue-500 to-indigo-500';
      case 'acceptable':
        return 'from-yellow-500 to-orange-500';
      case 'poor':
        return 'from-orange-500 to-red-500';
      case 'unsuitable':
        return 'from-red-500 to-pink-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    const isMultiSelect = e.ctrlKey || e.metaKey || e.shiftKey;
    onClick(isMultiSelect);
  };

  const handleDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDetails(true);
  };

  if (variant === 'list') {
    return (
      <>
        <div
          className={`
            group relative bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 
            hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden
            ${isSelected ? 'ring-2 ring-blue-500 shadow-blue-200' : ''}
          `}
          style={{ animationDelay: `${animationDelay}ms` }}
          onClick={handleCardClick}
        >
          <div className="flex items-center p-4 space-x-4">
            {/* Thumbnail */}
            <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
              {analysis.thumbnail ? (
                <img
                  src={analysis.thumbnail}
                  alt={analysis.name}
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() => setImageLoaded(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Camera className="w-6 h-6 text-gray-400" />
                </div>
              )}
              
              {/* Quality indicator */}
              <div className="absolute -top-1 -right-1">
                {getQualityIcon()}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{analysis.name}</h3>
              <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                <span>{(analysis.size / 1024 / 1024).toFixed(1)} MB</span>
                <span className={isRecommended ? 'text-green-600' : 'text-red-600'}>
                  {isRecommended ? 'Recommended' : 'Issues'}
                </span>
              </div>
            </div>

            {/* Scores */}
            <div className="flex items-center space-x-6 text-center">
              <div>
                <div className="text-lg font-bold text-gray-900">
                  {analysis.compositeScore?.overall || 0}
                </div>
                <div className="text-xs text-gray-500">Overall</div>
              </div>
              <div>
                <div className="text-lg font-bold text-purple-600">
                  {analysis.blurScore}
                </div>
                <div className="text-xs text-gray-500">Blur</div>
              </div>
              <div>
                <div className="text-lg font-bold text-orange-600">
                  {analysis.exposureAnalysis?.exposureScore || 0}
                </div>
                <div className="text-xs text-gray-500">Exposure</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDetailsClick}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <Info className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Technical Details Modal */}
        {showDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">{analysis.name}</h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6">
                <TechnicalQualityPanel analysis={analysis} />
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div
        className={`
          group relative bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 
          hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden
          animate-fade-in-up
          ${isSelected ? 'ring-2 ring-blue-500 shadow-blue-200 scale-105' : ''}
        `}
        style={{ animationDelay: `${animationDelay}ms` }}
        onClick={handleCardClick}
      >
        {/* Quality Gradient Bar */}
        <div className={`h-1 bg-gradient-to-r ${getQualityColor()}`} />

        {/* Image */}
        <div className="relative aspect-square bg-gray-100">
          {analysis.thumbnail ? (
            <img
              src={analysis.thumbnail}
              alt={analysis.name}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Camera className="w-12 h-12 text-gray-400" />
            </div>
          )}
          
          {/* Overlay with quality indicator */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Quality badge */}
          <div className="absolute top-3 right-3">
            <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
              {getQualityIcon()}
            </div>
          </div>

          {/* Score overlay */}
          <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3">
              <div className="flex justify-between items-center">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">
                    {analysis.compositeScore?.overall || 0}
                  </div>
                  <div className="text-xs text-gray-600">Overall</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">
                    {analysis.blurScore}
                  </div>
                  <div className="text-xs text-gray-600">Blur</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-600">
                    {analysis.exposureAnalysis?.exposureScore || 0}
                  </div>
                  <div className="text-xs text-gray-600">Exposure</div>
                </div>
              </div>
            </div>
          </div>

          {/* Selection indicator */}
          {isSelected && (
            <div className="absolute top-3 left-3">
              <div className="bg-blue-500 text-white rounded-full p-2 shadow-lg">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 truncate mb-2">{analysis.name}</h3>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{(analysis.size / 1024 / 1024).toFixed(1)} MB</span>
            <span className={`font-medium ${isRecommended ? 'text-green-600' : 'text-red-600'}`}>
              {isRecommended ? 'Recommended' : 'Issues'}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center space-x-1">
              {analysis.descriptorAnalysis && (
                <div className="flex items-center text-xs text-gray-600">
                  <Target className="w-3 h-3 mr-1" />
                  {analysis.descriptorAnalysis.keypointCount}
                </div>
              )}
              <div className="flex items-center text-xs text-gray-600">
                <Zap className="w-3 h-3 mr-1" />
                GPU
              </div>
            </div>
            
            <button
              onClick={handleDetailsClick}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <Info className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Error indicator */}
        {analysis.error && (
          <div className="absolute inset-0 bg-red-500/10 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              Error
            </div>
          </div>
        )}
      </div>

      {/* Technical Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">{analysis.name}</h2>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <TechnicalQualityPanel analysis={analysis} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};