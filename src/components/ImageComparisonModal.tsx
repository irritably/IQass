import React, { useState } from 'react';
import { ImageAnalysis } from '../types';
import { X, ArrowLeftRight, Info, Download } from 'lucide-react';
import { TechnicalQualityPanel } from './TechnicalQualityPanel';
import { getScoreColor, getRecommendationColor } from '../utils/compositeScoring';

interface ImageComparisonModalProps {
  images: ImageAnalysis[];
  onClose: () => void;
}

export const ImageComparisonModal: React.FC<ImageComparisonModalProps> = ({
  images,
  onClose
}) => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'technical'>('overview');
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  if (images.length === 0) return null;

  const toggleImageExpansion = (imageId: string) => {
    setExpandedImage(expandedImage === imageId ? null : imageId);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-7xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <ArrowLeftRight className="w-5 h-5 mr-2" />
              Image Comparison ({images.length} images)
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Side-by-side analysis of selected images
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setSelectedTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                selectedTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Quality Overview
            </button>
            <button
              onClick={() => setSelectedTab('technical')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                selectedTab === 'technical'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Technical Details
            </button>
          </nav>
        </div>

        <div className="p-6">
          {selectedTab === 'overview' && (
            <OverviewComparison 
              images={images} 
              expandedImage={expandedImage}
              onToggleExpansion={toggleImageExpansion}
            />
          )}
          {selectedTab === 'technical' && (
            <TechnicalComparison images={images} />
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Overview Comparison Component
 */
interface OverviewComparisonProps {
  images: ImageAnalysis[];
  expandedImage: string | null;
  onToggleExpansion: (imageId: string) => void;
}

const OverviewComparison: React.FC<OverviewComparisonProps> = ({
  images,
  expandedImage,
  onToggleExpansion
}) => {
  return (
    <div className="space-y-6">
      {/* Image Thumbnails and Basic Info */}
      <div className={`grid gap-6 ${images.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {images.map((image) => (
          <div key={image.id} className="space-y-4">
            {/* Image Thumbnail */}
            <div 
              className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
              onClick={() => onToggleExpansion(image.id)}
            >
              {image.thumbnail ? (
                <img
                  src={image.thumbnail}
                  alt={image.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Info className="w-8 h-8" />
                </div>
              )}
              
              {/* Quality Badge */}
              <div className="absolute top-2 right-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                  getRecommendationColor(image.compositeScore?.recommendation || 'unsuitable')
                }`}>
                  {image.compositeScore?.recommendation || 'unsuitable'}
                </span>
              </div>
              
              {/* Overall Score */}
              <div className="absolute bottom-2 left-2 right-2">
                <div className="bg-black bg-opacity-75 text-white px-2 py-1 rounded text-center">
                  <div className="text-lg font-bold">
                    {image.compositeScore?.overall || 0}
                  </div>
                  <div className="text-xs">Overall Score</div>
                </div>
              </div>
            </div>

            {/* Image Info */}
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900 truncate" title={image.name}>
                {image.name}
              </h3>
              <div className="text-sm text-gray-600">
                {(image.size / 1024 / 1024).toFixed(1)} MB
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Metrics Comparison */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Metrics Comparison</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">Metric</th>
                {images.map((image) => (
                  <th key={image.id} className="text-center py-3 px-4 font-medium text-gray-900">
                    <div className="truncate max-w-32" title={image.name}>
                      {image.name}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <MetricRow
                label="Overall Score"
                values={images.map(img => img.compositeScore?.overall || 0)}
                format={(val) => val.toString()}
              />
              <MetricRow
                label="Blur Score"
                values={images.map(img => img.blurScore)}
                format={(val) => val.toString()}
              />
              <MetricRow
                label="Exposure Score"
                values={images.map(img => img.exposureAnalysis?.exposureScore || 0)}
                format={(val) => val.toString()}
              />
              <MetricRow
                label="Noise Score"
                values={images.map(img => img.noiseAnalysis?.noiseScore || 0)}
                format={(val) => val.toString()}
              />
              <MetricRow
                label="Feature Count"
                values={images.map(img => img.descriptorAnalysis?.keypointCount || 0)}
                format={(val) => val.toLocaleString()}
              />
              <MetricRow
                label="Photogrammetric Score"
                values={images.map(img => img.descriptorAnalysis?.photogrammetricScore || 0)}
                format={(val) => val.toString()}
              />
            </tbody>
          </table>
        </div>
      </div>

      {/* Key Differences Analysis */}
      <KeyDifferencesAnalysis images={images} />
    </div>
  );
};

/**
 * Metric Row Component for Comparison Table
 */
interface MetricRowProps {
  label: string;
  values: number[];
  format: (value: number) => string;
}

const MetricRow: React.FC<MetricRowProps> = ({ label, values, format }) => {
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);

  return (
    <tr>
      <td className="py-3 px-4 font-medium text-gray-900">{label}</td>
      {values.map((value, index) => {
        const isHighest = value === maxValue && maxValue !== minValue;
        const isLowest = value === minValue && maxValue !== minValue;
        
        return (
          <td key={index} className="py-3 px-4 text-center">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${
              isHighest 
                ? 'bg-green-100 text-green-800' 
                : isLowest 
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {format(value)}
            </span>
          </td>
        );
      })}
    </tr>
  );
};

/**
 * Key Differences Analysis Component
 */
interface KeyDifferencesAnalysisProps {
  images: ImageAnalysis[];
}

const KeyDifferencesAnalysis: React.FC<KeyDifferencesAnalysisProps> = ({ images }) => {
  const differences = [];

  // Analyze overall quality differences
  const overallScores = images.map(img => img.compositeScore?.overall || 0);
  const scoreDiff = Math.max(...overallScores) - Math.min(...overallScores);
  
  if (scoreDiff > 20) {
    differences.push({
      type: 'warning',
      title: 'Significant Quality Variation',
      description: `Overall quality scores vary by ${scoreDiff} points. Consider reviewing lower-scoring images for potential issues.`
    });
  }

  // Analyze blur differences
  const blurScores = images.map(img => img.blurScore);
  const blurDiff = Math.max(...blurScores) - Math.min(...blurScores);
  
  if (blurDiff > 30) {
    differences.push({
      type: 'info',
      title: 'Blur Quality Variation',
      description: `Blur scores vary significantly (${blurDiff} points). This may indicate different focus settings or motion blur.`
    });
  }

  // Analyze feature count differences
  const featureCounts = images.map(img => img.descriptorAnalysis?.keypointCount || 0);
  const featureRatio = Math.max(...featureCounts) / Math.max(Math.min(...featureCounts), 1);
  
  if (featureRatio > 2) {
    differences.push({
      type: 'info',
      title: 'Feature Density Variation',
      description: `Feature counts vary significantly. Images with fewer features may be less suitable for photogrammetric reconstruction.`
    });
  }

  if (differences.length === 0) {
    differences.push({
      type: 'success',
      title: 'Consistent Quality',
      description: 'All selected images show consistent quality metrics, indicating good capture conditions.'
    });
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900">Key Differences Analysis</h3>
      
      {differences.map((diff, index) => (
        <div key={index} className={`p-4 rounded-lg border ${
          diff.type === 'warning' 
            ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
            : diff.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <div className="font-medium">{diff.title}</div>
          <div className="text-sm mt-1">{diff.description}</div>
        </div>
      ))}
    </div>
  );
};

/**
 * Technical Comparison Component
 */
interface TechnicalComparisonProps {
  images: ImageAnalysis[];
}

const TechnicalComparison: React.FC<TechnicalComparisonProps> = ({ images }) => {
  return (
    <div className="space-y-8">
      {images.map((image, index) => (
        <div key={image.id} className="border border-gray-200 rounded-lg">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Image {index + 1}: {image.name}
            </h3>
          </div>
          <div className="p-6">
            <TechnicalQualityPanel analysis={image} />
          </div>
        </div>
      ))}
    </div>
  );
};